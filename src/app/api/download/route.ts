import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { downloadVideoLocal, getVideoInfo } from '@/lib/downloader';
import { isSsrfSafeUrl, sanitizeInput } from '@/lib/security';
import { detectPlatform } from '@/lib/platforms/detectPlatform';
import { AppError } from '@/lib/errors';
import { getVideoInfoViaInnerTube, getBestStreamUrl } from '@/lib/innertube';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';
import http from 'http';

// Temp directory for InnerTube downloads
const isServerless = process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';
const TMP_DIR = isServerless 
  ? path.join(os.tmpdir(), 'mediaflow')
  : path.join(process.cwd(), 'public', 'downloads');

if (!fs.existsSync(TMP_DIR)) {
  try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch {}
}

/**
 * Download a file from a direct URL to disk
 */
async function downloadFromDirectUrl(streamUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = streamUrl.startsWith('https') ? https : http;
    const request = handler.get(streamUrl, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFromDirectUrl(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode && response.statusCode >= 400) {
        reject(new Error(`HTTP ${response.statusCode} downloading stream`));
        return;
      }
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); resolve(); });
      fileStream.on('error', reject);
    });
    request.on('error', reject);
    request.setTimeout(120000, () => { request.destroy(); reject(new Error('Download timeout')); });
  });
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';

  let url = '';
  let formatId = 'best';

  try {
    const body = await req.json();
    url = sanitizeInput(body.url || '', 1000);
    formatId = sanitizeInput(body.formatId || 'best', 100);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request body.', code: 'UNSUPPORTED_URL' },
      { status: 400 }
    );
  }

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL is required.', code: 'UNSUPPORTED_URL' },
      { status: 400 }
    );
  }

  try {
    // 1. SSRF Protection
    const ssrfCheck = await isSsrfSafeUrl(url);
    if (!ssrfCheck.safe) {
      await db.platformRequestLog.create({
        data: {
          ipAddress: clientIp,
          url,
          success: false,
          action: 'DOWNLOAD',
          reason: ssrfCheck.reason || 'Blocked by SSRF Shield'
        }
      });
      throw new AppError('UNSUPPORTED_URL', ssrfCheck.reason || 'Blocked by SSRF Shield', 400);
    }

    // 2. Platform Adapter Validation
    const { platform, normalizedUrl } = detectPlatform(url);
    if (platform === 'unknown') {
      throw new AppError('UNSUPPORTED_URL', 'The provided URL platform is unsupported.', 400);
    }

    // 3. Create Job Record in PROCESSING
    const job = await db.downloadJob.create({
      data: {
        platform,
        url: normalizedUrl,
        status: 'PROCESSING',
        progress: 10
      }
    });

    console.log(`[MediaFlow API] Initialized download job ${job.id} synchronously for URL: ${normalizedUrl}`);

    // 4. Run the download
    try {
      let downloadUrl = '';
      let videoTitle = `${platform.toUpperCase()} Media`;
      let videoUploader = 'Creator';
      let videoThumbnail = '';
      let videoDuration = 0;
      let fileSize = 0;
      let usedInnerTube = false;

      // Try yt-dlp first
      try {
        const info = await getVideoInfo(normalizedUrl);
        
        await db.downloadJob.update({
          where: { id: job.id },
          data: {
            title: info?.title || videoTitle,
            creatorName: info?.uploader || videoUploader,
            thumbnail: info?.thumbnail || '',
            duration: info?.duration || 0,
            contentType: formatId === 'mp3' ? 'audio' : 'video',
            progress: 40
          }
        });

        videoTitle = info?.title || videoTitle;
        videoUploader = info?.uploader || videoUploader;
        videoThumbnail = info?.thumbnail || '';
        videoDuration = info?.duration || 0;
        fileSize = info?.formats?.find(f => f.format_id === formatId)?.filesize || 0;

        downloadUrl = await downloadVideoLocal(normalizedUrl, formatId);
      } catch (ytDlpError: any) {
        // If YouTube and yt-dlp fails with cookies/fetch error, try InnerTube fallback
        const isYouTube = platform === 'youtube';
        const isCookiesOrFetchError = ytDlpError instanceof AppError && 
          (ytDlpError.code === 'COOKIES_REQUIRED' || ytDlpError.code === 'FETCH_FAILED');

        if (isYouTube && isCookiesOrFetchError) {
          console.log(`[MediaFlow API] yt-dlp failed for YouTube, trying InnerTube direct stream download...`);
          
          // Get metadata via InnerTube
          const innerInfo = await getVideoInfoViaInnerTube(normalizedUrl);
          
          if (!innerInfo || innerInfo.formats.length === 0) {
            throw new AppError(
              'COOKIES_REQUIRED',
              'YouTube requires authentication. Please provide a cookies.txt file or try again later.',
              422
            );
          }

          videoTitle = innerInfo.title;
          videoUploader = innerInfo.uploader;
          videoThumbnail = innerInfo.thumbnail;
          videoDuration = innerInfo.duration;

          await db.downloadJob.update({
            where: { id: job.id },
            data: {
              title: videoTitle,
              creatorName: videoUploader,
              thumbnail: videoThumbnail,
              duration: videoDuration,
              contentType: formatId === 'mp3' ? 'audio' : 'video',
              progress: 40
            }
          });

          // Find the best stream URL
          let targetFormat = null;
          
          if (formatId === 'best' || formatId === 'mp3') {
            // For "best", pick the highest quality combined format
            const combined = innerInfo.formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url);
            if (combined.length > 0) {
              combined.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
              targetFormat = combined[0];
            }
            
            // If no combined formats, try audio-only for mp3 or any format with URL
            if (!targetFormat) {
              if (formatId === 'mp3') {
                const audioFormats = innerInfo.formats.filter(f => f.acodec !== 'none' && f.url);
                audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                targetFormat = audioFormats[0];
              } else {
                const anyFormat = innerInfo.formats.find(f => f.url);
                targetFormat = anyFormat || null;
              }
            }
          } else {
            // Specific format ID requested
            targetFormat = innerInfo.formats.find(f => f.format_id === formatId && f.url);
            if (!targetFormat) {
              // Fallback to any format with URL
              const withUrl = innerInfo.formats.filter(f => f.url);
              if (withUrl.length > 0) {
                withUrl.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                targetFormat = withUrl[0];
              }
            }
          }

          if (!targetFormat || !targetFormat.url) {
            throw new AppError(
              'COOKIES_REQUIRED',
              'YouTube requires authentication to access stream URLs. Please provide cookies.',
              422
            );
          }

          // Download the stream directly
          const fileId = randomUUID();
          const ext = targetFormat.ext || 'mp4';
          const outputPath = path.join(TMP_DIR, `${fileId}.${ext}`);

          console.log(`[MediaFlow API] Downloading InnerTube stream (${targetFormat.quality_label || targetFormat.resolution}) to ${outputPath}...`);
          
          await db.downloadJob.update({
            where: { id: job.id },
            data: { progress: 60 }
          });

          await downloadFromDirectUrl(targetFormat.url, outputPath);
          
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            fileSize = stats.size;
          }

          downloadUrl = `/downloads/${fileId}.${ext}`;
          usedInnerTube = true;
          console.log(`[MediaFlow API] InnerTube download completed! File: ${downloadUrl}, Size: ${fileSize}`);
        } else {
          // Non-YouTube or non-recoverable error
          throw ytDlpError;
        }
      }

      // 5. Mark Job as COMPLETED
      await db.downloadJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          downloadUrl,
          fileSize
        }
      });

      // Record successful log
      await db.platformRequestLog.create({
        data: {
          ipAddress: clientIp,
          platform,
          url: normalizedUrl,
          success: true,
          action: 'DOWNLOAD'
        }
      });

      return NextResponse.json({
        success: true,
        jobId: job.id
      });

    } catch (downloadError: any) {
      console.error(`[MediaFlow API] Download execution crashed for job ${job.id}:`, downloadError);
      
      const cleanError = downloadError instanceof AppError 
        ? downloadError 
        : new AppError('DOWNLOAD_FAILED', 'Failed to complete media processing job.', 500);

      await db.downloadJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          progress: 0,
          errorMessage: cleanError.message
        }
      });

      throw cleanError;
    }

  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('[MediaFlow API Download Error]:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected server error occurred during processing.', code: 'DOWNLOAD_FAILED' },
      { status: 500 }
    );
  }
}
