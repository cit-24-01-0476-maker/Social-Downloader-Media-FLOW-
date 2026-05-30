import { create } from 'youtube-dl-exec';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'ffmpeg-static';

// Get the absolute physical path of the yt-dlp binary to bypass Next.js bundling path issues
const binaryPath = path.join(
  process.cwd(),
  'node_modules',
  'youtube-dl-exec',
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

const youtubedl = create(binaryPath);

// Helper to ensure the temp storage directory exists
const TMP_DIR = path.join(process.cwd(), 'public', 'downloads');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  platform: string;
  formats: {
    format_id: string;
    ext: string;
    resolution: string;
    filesize?: number;
    url?: string;
    vcodec?: string;
    acodec?: string;
  }[];
}

/**
 * Fetches accurate metadata and formats using yt-dlp.
 * Sequentially falls back through browsers to find working authenticated cookies database.
 */
export async function getVideoInfo(url: string, browser: string = 'none'): Promise<VideoInfo | null> {
  const browsers = browser !== 'none' ? [browser] : ['none', 'chrome', 'edge', 'firefox', 'brave'];
  let lastError: any = null;

  for (const b of browsers) {
    try {
      const ytDlpOptions: any = {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        extractorArgs: 'youtube:player-client=ios,android',
      };

      if (ffmpeg) {
        ytDlpOptions.ffmpegLocation = ffmpeg;
      }

      if (b !== 'none') {
        ytDlpOptions.cookiesFromBrowser = b;
      } else {
        // Use cookies if cookies.txt exists in the project root
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiesPath)) {
          ytDlpOptions.cookies = cookiesPath;
        }
      }

      const rawData = await youtubedl(url, ytDlpOptions) as any;

      const formats = rawData.formats
        ?.filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none') // filter valid AV
        .map((f: any) => {
          let size = f.filesize || f.filesize_approx;
          if (!size && f.tbr && rawData.duration) {
            size = Math.round((f.tbr * 1024 * rawData.duration) / 8);
          }
          return {
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.resolution || (f.width ? `${f.width}x${f.height}` : 'audio'),
            filesize: size || 0,
            url: f.url,
            vcodec: f.vcodec,
            acodec: f.acodec,
          };
        }) || [];

      return {
        id: rawData.id,
        title: rawData.title,
        thumbnail: rawData.thumbnail,
        duration: rawData.duration,
        uploader: rawData.uploader || rawData.creator || 'Unknown',
        platform: rawData.extractor,
        formats,
      };
    } catch (error: any) {
      console.warn(`[Downloader] Metadata query failed with cookie option: ${b}. Error detail:`, error.message || error);
      lastError = error;
    }
  }

  console.error('[Downloader] All cookie source options exhausted. Error parsing URL:', lastError);
  const cleanMessage = lastError.stderr || lastError.message || String(lastError);
  throw new Error(cleanMessage);
}

/**
 * Executes a download using yt-dlp to a temporary local file.
 * Sequentially falls back through browsers to find working authenticated cookies database.
 * Returns the relative path for the client to download.
 */
export async function downloadVideoLocal(url: string, formatId: string = 'best', browser: string = 'none'): Promise<string> {
  const browsers = browser !== 'none' ? [browser] : ['none', 'chrome', 'edge', 'firefox', 'brave'];
  let lastError: any = null;

  for (const b of browsers) {
    const fileId = randomUUID();
    const outputPath = path.join(TMP_DIR, `${fileId}.%(ext)s`);

    try {
      const ytDlpOptions: any = {
        f: formatId === 'best' ? 'bv*+ba/b' : formatId,
        o: outputPath,
        noWarnings: true,
        noCheckCertificate: true,
        extractorArgs: 'youtube:player-client=ios,android',
        // High-speed optimizations:
        concurrentFragments: 5,
        bufferSize: '16K',
        httpChunkSize: '10M',
        forceOverwrites: true,
      };

      if (ffmpeg) {
        ytDlpOptions.ffmpegLocation = ffmpeg;
      }

      // Auto-append +ba/best if formatId is numeric (video-only stream)
      if (/^\d+$/.test(formatId)) {
        ytDlpOptions.f = `${formatId}+ba/best`;
      }

      // Support extracting MP3 / Audio-only
      if (formatId === 'mp3') {
        delete ytDlpOptions.f;
        ytDlpOptions.extractAudio = true;
        ytDlpOptions.audioFormat = 'mp3';
        ytDlpOptions.o = path.join(TMP_DIR, `${fileId}.mp3`);
      }

      if (b !== 'none') {
        ytDlpOptions.cookiesFromBrowser = b;
      } else {
        // Use cookies if cookies.txt exists in the project root
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiesPath)) {
          ytDlpOptions.cookies = cookiesPath;
        }
      }

      await youtubedl(url, ytDlpOptions);

      // We don't know the exact extension yt-dlp chose unless we read the directory.
      // Let's find the created file starting with our fileId.
      const files = fs.readdirSync(TMP_DIR);
      const downloadedFile = files.find(f => f.startsWith(fileId));
      
      if (!downloadedFile) {
        throw new Error('File download succeeded but file not found on disk.');
      }

      // Return the relative URL path for the client to access via public/downloads
      return `/downloads/${downloadedFile}`;
    } catch (error) {
      console.warn(`[Downloader] Download failed with cookie option: ${b}. Error detail:`, error);
      lastError = error;
    }
  }

  console.error('[Downloader] All cookie source options exhausted. Download failed:', lastError);
  throw lastError;
}
