import { PlatformAdapter, NormalizedMetadata, NormalizedFormat } from './types';
import { UniversalAdapter } from './universal';
import { getVideoInfoViaInnerTube, extractYouTubeVideoId } from '../innertube';
import { AppError } from '../errors';

export class YoutubeAdapter extends UniversalAdapter implements PlatformAdapter {
  private urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|shorts\/|v\/|playlist\?list=)?([a-zA-Z0-9_-]{11})/;

  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  }

  validate(url: string): boolean {
    if (!this.detect(url)) return false;
    if (url.includes('studio.youtube.com') || url.includes('/dashboard')) {
      return false;
    }
    return this.urlRegex.test(url);
  }

  async extract(url: string): Promise<NormalizedMetadata> {
    // Try yt-dlp first (most reliable when it works)
    try {
      const meta = await super.extract(url);
      meta.platform = 'youtube';
      return meta;
    } catch (ytDlpError: any) {
      // If yt-dlp fails with COOKIES_REQUIRED or FETCH_FAILED, try InnerTube fallback
      const isCookiesError = ytDlpError instanceof AppError && 
        (ytDlpError.code === 'COOKIES_REQUIRED' || ytDlpError.code === 'FETCH_FAILED');
      
      if (!isCookiesError) {
        // For other errors (PRIVATE_CONTENT, UNSUPPORTED_URL), re-throw immediately
        throw ytDlpError;
      }

      console.log('[YouTube Adapter] yt-dlp failed with cookies/fetch error, trying InnerTube fallback...');
      
      try {
        const innerTubeInfo = await getVideoInfoViaInnerTube(url);
        
        if (!innerTubeInfo || innerTubeInfo.formats.length === 0) {
          // InnerTube also failed - throw the original yt-dlp error with enhanced message
          console.warn('[YouTube Adapter] InnerTube fallback also failed.');
          throw new AppError(
            'COOKIES_REQUIRED',
            'YouTube is requiring authentication for this video. Please provide a cookies.txt file via the YTDLP_COOKIES_FILE environment variable, or try again later.',
            422
          );
        }

        console.log(`[YouTube Adapter] InnerTube fallback succeeded! Title: "${innerTubeInfo.title}", Formats: ${innerTubeInfo.formats.length}`);
        
        // Convert InnerTube info to NormalizedMetadata
        return this.mapInnerTubeToNormalized(innerTubeInfo, url);
      } catch (innerTubeError: any) {
        if (innerTubeError instanceof AppError) throw innerTubeError;
        console.error('[YouTube Adapter] InnerTube fallback error:', innerTubeError.message);
        // Re-throw original yt-dlp error as it's more descriptive
        throw ytDlpError;
      }
    }
  }

  private mapInnerTubeToNormalized(info: any, originalUrl: string): NormalizedMetadata {
    const formats: NormalizedFormat[] = [];

    // Add "Best Quality" option first
    formats.push({
      formatId: 'best',
      label: 'Best Quality (Video + Voice)',
      ext: 'mp4',
      resolution: 'Auto',
      hasVideo: true,
      hasAudio: true,
      url: `/api/download?url=${encodeURIComponent(originalUrl)}&formatId=best`
    });

    // Add individual formats from InnerTube
    for (const f of info.formats) {
      const isVideo = f.vcodec && f.vcodec !== 'none';
      const isAudio = f.acodec && f.acodec !== 'none';

      let label = 'Media Stream';
      if (isVideo && isAudio) {
        label = `Video + Audio (${f.resolution || f.quality_label || 'auto'})`;
      } else if (isVideo) {
        label = `Video Only (${f.resolution || f.quality_label || 'auto'})`;
      } else if (isAudio) {
        label = `Audio Only`;
      }

      formats.push({
        formatId: f.format_id,
        label,
        ext: f.ext || 'mp4',
        resolution: f.resolution || f.quality_label || 'unknown',
        filesize: f.filesize || undefined,
        hasVideo: !!isVideo,
        hasAudio: !!isAudio,
        url: `/api/download?url=${encodeURIComponent(originalUrl)}&formatId=${f.format_id}`
      });
    }

    // Add MP3 audio option
    formats.push({
      formatId: 'mp3',
      label: 'Audio Only (MP3)',
      ext: 'mp3',
      resolution: 'Audio',
      hasVideo: false,
      hasAudio: true,
      url: `/api/download?url=${encodeURIComponent(originalUrl)}&formatId=mp3`
    });

    return {
      id: info.id,
      platform: 'youtube',
      title: info.title,
      thumbnail: info.thumbnail || undefined,
      duration: info.duration || undefined,
      uploader: info.uploader || undefined,
      mediaType: 'video',
      formats
    };
  }
}
