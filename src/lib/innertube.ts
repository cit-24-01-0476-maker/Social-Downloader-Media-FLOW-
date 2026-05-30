/**
 * InnerTube YouTube Fallback Engine
 * Uses youtubei.js to access YouTube's InnerTube API directly.
 * This bypasses yt-dlp's "Sign in to confirm you're not a bot" errors
 * by using YouTube's internal API protocol.
 */
import { Innertube, Platform } from 'youtubei.js';
import vm from 'vm';

// Register the JavaScript evaluator for URL deciphering
// This is REQUIRED by youtubei.js to decipher obfuscated stream URLs
// The code contains bare return statements, so we wrap it in a function expression
Platform.shim.eval = async (data: any) => {
  const wrappedCode = '(function() { ' + data.output + ' })()';
  const ctx = {};
  vm.createContext(ctx);
  return vm.runInContext(wrappedCode, ctx);
};

// Singleton Innertube instance (reuse across requests)
let innertubeInstance: any = null;
let instanceCreatedAt = 0;
const INSTANCE_TTL = 1000 * 60 * 30; // Refresh every 30 minutes

async function getInnertube() {
  const now = Date.now();
  if (!innertubeInstance || now - instanceCreatedAt > INSTANCE_TTL) {
    console.log('[InnerTube] Creating new Innertube instance...');
    innertubeInstance = await Innertube.create({
      lang: 'en',
      location: 'US',
    });
    instanceCreatedAt = now;
  }
  return innertubeInstance;
}

/**
 * Extract a YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export interface InnerTubeVideoInfo {
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
    quality_label?: string;
    mime_type?: string;
    bitrate?: number;
  }[];
}

/**
 * Fetches metadata and stream URLs using youtubei.js InnerTube API
 */
export async function getVideoInfoViaInnerTube(url: string): Promise<InnerTubeVideoInfo | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    console.warn('[InnerTube] Could not extract video ID from URL:', url);
    return null;
  }

  try {
    const yt = await getInnertube();
    const info = await yt.getBasicInfo(videoId);

    // Check playability
    const playability = info.playability_status;
    if (playability?.status === 'LOGIN_REQUIRED') {
      console.warn('[InnerTube] Video requires login:', playability.reason);
      return null;
    }
    if (playability?.status === 'ERROR' || playability?.status === 'UNPLAYABLE') {
      console.warn('[InnerTube] Video unplayable:', playability.reason);
      return null;
    }

    // Extract basic info
    const basicInfo = info.basic_info || {};
    const title = basicInfo.title || basicInfo.short_description?.substring(0, 80) || `YouTube Video ${videoId}`;
    const duration = basicInfo.duration || 0;
    const channel = basicInfo.channel;
    const uploader = channel?.name || basicInfo.author || 'Unknown';
    const thumbnail = basicInfo.thumbnail?.url || 
      basicInfo.thumbnail?.[0]?.url || 
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    // Extract streaming formats
    const formats: InnerTubeVideoInfo['formats'] = [];
    const streamingData = info.streaming_data;
    
    if (streamingData) {
      const player = yt.session?.player;

      // Helper to safely extract stream URL from a format (async because decipher returns a Promise)
      const safeGetUrl = async (f: any): Promise<string | undefined> => {
        // If format already has a direct URL, use it
        if (f.url && typeof f.url === 'string') return f.url;
        // Try deciphering the signature
        if (f.decipher && player) {
          try {
            const result = await f.decipher(player);
            if (typeof result === 'string') return result;
            if (result?.url) return String(result.url);
            if (result) return String(result);
          } catch (e: any) {
            console.warn('[InnerTube] Decipher failed for format:', f.itag, e.message);
          }
        }
        return undefined;
      };

      // Process regular formats (video+audio combined)
      const regularFormats = streamingData.formats || [];
      for (const f of regularFormats) {
        formats.push({
          format_id: String(f.itag || formats.length),
          ext: f.mime_type?.includes('webm') ? 'webm' : 'mp4',
          resolution: f.quality_label || f.quality || 'auto',
          filesize: f.content_length ? Number(f.content_length) : undefined,
          url: await safeGetUrl(f),
          vcodec: f.mime_type?.includes('video') ? 'h264' : 'none',
          acodec: f.mime_type?.includes('audio') ? 'aac' : (f.has_audio ? 'aac' : 'none'),
          quality_label: f.quality_label,
          mime_type: f.mime_type,
          bitrate: f.bitrate,
        });
      }

      // Process adaptive formats (video-only or audio-only)
      const adaptiveFormats = streamingData.adaptive_formats || [];
      for (const f of adaptiveFormats) {
        const isVideo = f.mime_type?.startsWith('video/');
        const isAudio = f.mime_type?.startsWith('audio/');
        formats.push({
          format_id: String(f.itag || formats.length),
          ext: f.mime_type?.includes('webm') ? 'webm' : (isAudio ? 'mp4' : 'mp4'),
          resolution: f.quality_label || (isAudio ? 'audio' : f.quality || 'auto'),
          filesize: f.content_length ? Number(f.content_length) : undefined,
          url: await safeGetUrl(f),
          vcodec: isVideo ? (f.mime_type?.includes('vp9') ? 'vp9' : 'h264') : 'none',
          acodec: isAudio ? (f.mime_type?.includes('opus') ? 'opus' : 'aac') : 'none',
          quality_label: f.quality_label,
          mime_type: f.mime_type,
          bitrate: f.bitrate,
        });
      }
    }

    return {
      id: videoId,
      title,
      thumbnail: typeof thumbnail === 'string' ? thumbnail : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration,
      uploader,
      platform: 'youtube',
      formats,
    };
  } catch (error: any) {
    console.error('[InnerTube] Failed to fetch video info:', error.message);
    // Reset instance on error so next call creates a fresh one
    innertubeInstance = null;
    return null;
  }
}

/**
 * Get the best downloadable stream URL from InnerTube
 * Returns the URL of the best combined (video+audio) format
 */
export async function getBestStreamUrl(url: string, preferredQuality?: string): Promise<{ url: string; ext: string; title: string } | null> {
  const info = await getVideoInfoViaInnerTube(url);
  if (!info || info.formats.length === 0) return null;

  // Filter for combined video+audio formats first
  const combined = info.formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.url);
  
  if (combined.length > 0) {
    // Sort by bitrate (highest first)
    combined.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const best = combined[0];
    return { url: best.url!, ext: best.ext, title: info.title };
  }

  // Fallback: return best video-only format
  const videoFormats = info.formats.filter(f => f.vcodec !== 'none' && f.url);
  if (videoFormats.length > 0) {
    videoFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    return { url: videoFormats[0].url!, ext: videoFormats[0].ext, title: info.title };
  }

  return null;
}
