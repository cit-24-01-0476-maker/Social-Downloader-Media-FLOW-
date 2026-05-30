import { create } from 'youtube-dl-exec';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'ffmpeg-static';
import os from 'os';
import { AppError } from './errors';

// Resolve absolute path for ffmpeg to prevent path mismatch errors in production/serverless environments
let ffmpegPath: string | null = null;
if (ffmpeg) {
  try {
    const resolvedPath = path.resolve(ffmpeg);
    if (fs.existsSync(resolvedPath)) {
      ffmpegPath = resolvedPath;
    } else {
      console.warn(`[Downloader] Resolved ffmpeg-static path does not exist on disk: ${resolvedPath}`);
    }
  } catch (err) {
    console.warn('[Downloader] Failed to resolve absolute path for ffmpeg:', err);
  }
}

// Get the absolute physical path of the yt-dlp binary to bypass Next.js bundling path issues
const binaryPath = path.join(
  process.cwd(),
  'node_modules',
  'youtube-dl-exec',
  'bin',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

const youtubedl = create(binaryPath);

// Helper to ensure the temp storage directory exists (Dynamic path for serverless environment)
const isServerless = process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';
const TMP_DIR = isServerless 
  ? path.join(os.tmpdir(), 'mediaflow')
  : path.join(process.cwd(), 'public', 'downloads');

if (!fs.existsSync(TMP_DIR)) {
  try {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Downloader] Failed to create TMP_DIR, fallback to system temp:', err);
  }
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
 * Fetches metadata and formats using yt-dlp.
 * Uses optional Netscape cookies.txt file path if YTDLP_COOKIES_FILE is configured.
 */
export async function getVideoInfo(url: string): Promise<VideoInfo | null> {
  try {
    const ytDlpOptions: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      extractorArgs: 'youtube:player-client=ios,android',
    };

    if (ffmpegPath) {
      ytDlpOptions.ffmpegLocation = ffmpegPath;
    }

    // Resolve Netscape cookies file if YTDLP_COOKIES_FILE is configured
    const cookiesEnv = process.env.YTDLP_COOKIES_FILE;
    if (cookiesEnv) {
      try {
        const resolvedCookiesPath = path.resolve(process.cwd(), cookiesEnv);
        if (fs.existsSync(resolvedCookiesPath)) {
          ytDlpOptions.cookies = resolvedCookiesPath;
        } else {
          console.warn(`[Downloader] Configured YTDLP_COOKIES_FILE not found: ${resolvedCookiesPath}`);
        }
      } catch (e) {
        console.warn('[Downloader] Failed to resolve cookies path:', e);
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
      thumbnail: rawData.thumbnail || '',
      duration: rawData.duration || 0,
      uploader: rawData.uploader || rawData.creator || 'Unknown',
      platform: rawData.extractor || '',
      formats,
    };
  } catch (error: any) {
    const rawError = error.stderr || error.message || String(error);
    console.error('[MediaFlow Downloader Subprocess Error]:', rawError);

    const errorStr = rawError.toLowerCase();
    if (
      errorStr.includes('sign in to confirm you\'re not a bot') || 
      errorStr.includes('login required') || 
      errorStr.includes('cookies') || 
      errorStr.includes('sign in to confirm your age') ||
      errorStr.includes('confirm you are not a bot')
    ) {
      throw new AppError('COOKIES_REQUIRED', 'This video requires cookies or login credentials to be downloaded.', 422);
    }

    if (
      errorStr.includes('private video') || 
      errorStr.includes('private account') || 
      errorStr.includes('members-only') || 
      errorStr.includes('access control') || 
      errorStr.includes('unauthorized') || 
      errorStr.includes('this video is private')
    ) {
      throw new AppError('PRIVATE_CONTENT', 'Private or restricted content is not supported by MediaFlow.', 422);
    }

    if (
      errorStr.includes('unsupported url') || 
      errorStr.includes('unrecognized url') ||
      errorStr.includes('not a valid url') || 
      errorStr.includes('extractor not found')
    ) {
      throw new AppError('UNSUPPORTED_URL', 'The provided URL is not supported or is invalid.', 400);
    }

    throw new AppError('FETCH_FAILED', 'Could not fetch metadata. Try another public URL.', 422);
  }
}

/**
 * Executes a download using yt-dlp to a temporary local file.
 * Returns the relative URL path for the client to access via /downloads/[filename]
 */
export async function downloadVideoLocal(url: string, formatId: string = 'best'): Promise<string> {
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

    if (ffmpegPath) {
      ytDlpOptions.ffmpegLocation = ffmpegPath;
    }

    // Resolve Netscape cookies file if YTDLP_COOKIES_FILE is configured
    const cookiesEnv = process.env.YTDLP_COOKIES_FILE;
    if (cookiesEnv) {
      try {
        const resolvedCookiesPath = path.resolve(process.cwd(), cookiesEnv);
        if (fs.existsSync(resolvedCookiesPath)) {
          ytDlpOptions.cookies = resolvedCookiesPath;
        }
      } catch (e) {
        console.warn('[Downloader] Failed to resolve cookies path during download:', e);
      }
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

    await youtubedl(url, ytDlpOptions);

    // Find the created file starting with our fileId.
    const files = fs.readdirSync(TMP_DIR);
    const downloadedFile = files.find(f => f.startsWith(fileId));
    
    if (!downloadedFile) {
      throw new Error('File download succeeded but file not found on disk.');
    }

    return `/downloads/${downloadedFile}`;
  } catch (error: any) {
    const rawError = error.stderr || error.message || String(error);
    console.error('[MediaFlow Downloader Download Subprocess Error]:', rawError);

    const errorStr = rawError.toLowerCase();
    if (
      errorStr.includes('sign in to confirm you\'re not a bot') || 
      errorStr.includes('login required') || 
      errorStr.includes('cookies') ||
      errorStr.includes('confirm you are not a bot')
    ) {
      throw new AppError('COOKIES_REQUIRED', 'This video requires cookies or login credentials to be downloaded.', 422);
    }

    if (
      errorStr.includes('private video') || 
      errorStr.includes('private account') || 
      errorStr.includes('this video is private')
    ) {
      throw new AppError('PRIVATE_CONTENT', 'Private or restricted content is not supported by MediaFlow.', 422);
    }

    throw new AppError('DOWNLOAD_FAILED', 'Failed to download the media content. Try another public URL.', 500);
  }
}
