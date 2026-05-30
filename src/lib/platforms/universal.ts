import { PlatformAdapter, NormalizedMetadata, NormalizedFormat } from './types';
import { getVideoInfo, VideoInfo } from '../downloader';
import { AppError } from '../errors';

export class UniversalAdapter implements PlatformAdapter {
  detect(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  validate(url: string): boolean {
    return this.detect(url);
  }

  async extract(url: string): Promise<NormalizedMetadata> {
    const info = await getVideoInfo(url);
    if (!info) {
      throw new AppError('FETCH_FAILED', 'Could not fetch metadata. Try another public URL.', 422);
    }

    return this.mapVideoInfoToNormalized(info, url);
  }

  public mapVideoInfoToNormalized(info: VideoInfo, originalUrl: string): NormalizedMetadata {
    const formats: NormalizedFormat[] = (info.formats || []).map((f) => {
      const isVideo = f.vcodec && f.vcodec !== 'none';
      const isAudio = f.acodec && f.acodec !== 'none';
      
      let label = 'Media Stream';
      if (isVideo && isAudio) {
        label = `Video + Audio (${f.resolution})`;
      } else if (isVideo) {
        label = `Video Only (${f.resolution})`;
      } else if (isAudio) {
        label = `Audio Only`;
      }

      return {
        formatId: f.format_id,
        label,
        ext: f.ext || 'mp4',
        resolution: f.resolution || 'unknown',
        filesize: f.filesize || undefined,
        hasVideo: !!isVideo,
        hasAudio: !!isAudio,
        url: `/api/download?url=${encodeURIComponent(originalUrl)}&formatId=${f.format_id}`
      };
    });

    // Unshift a direct "Best Quality" merge format
    formats.unshift({
      formatId: 'best',
      label: 'Best Quality (Video + Voice)',
      ext: 'mp4',
      resolution: 'Auto',
      hasVideo: true,
      hasAudio: true,
      url: `/api/download?url=${encodeURIComponent(originalUrl)}&formatId=best`
    });

    // Push a direct "MP3 Audio" extract format
    formats.push({
      formatId: 'mp3',
      label: 'Audio Only (MP3)',
      ext: 'mp3',
      resolution: 'Audio',
      hasVideo: false,
      hasAudio: true,
      url: `/api/download?url=${encodeURIComponent(originalUrl)}&formatId=mp3`
    });

    // Detect mediaType
    let mediaType: 'video' | 'audio' | 'photo' | 'carousel' | 'unknown' = 'video';
    if (info.platform?.toLowerCase().includes('instagram') && originalUrl.includes('/p/')) {
      mediaType = 'photo';
    }

    return {
      id: info.id,
      platform: info.platform || 'generic',
      title: info.title,
      thumbnail: info.thumbnail || undefined,
      duration: info.duration || undefined,
      uploader: info.uploader || undefined,
      mediaType,
      formats
    };
  }
}
