import { PlatformAdapter, PlatformMetadata, DownloadOptionsResponse, DownloadOption } from './types';
import { getVideoInfo, downloadVideoLocal } from '../downloader';

export class UniversalAdapter implements PlatformAdapter {
  detect(url: string): boolean {
    // yt-dlp can handle almost any URL, so we loosely accept http/https
    return /^https?:\/\//i.test(url);
  }

  validate(url: string): boolean {
    return this.detect(url);
  }

  async getMetadata(url: string, browser?: string): Promise<PlatformMetadata | null> {
    const info = await getVideoInfo(url, browser);
    if (!info) return null;

    return {
      title: info.title,
      thumbnail: info.thumbnail,
      creatorName: info.uploader,
      duration: info.duration,
      type: 'video', // we can refine this later if needed
      platform: (info.platform as any) || 'youtube', // generic fallback
      isPublic: true, // We bypass restrictions, so treat as public
    };
  }

  async getDownloadOptions(url: string, userConsent: boolean, browser?: string): Promise<DownloadOptionsResponse> {
    const info = await getVideoInfo(url, browser);
    
    if (!info) {
      return { allowed: false, reason: 'Unable to parse video. Ensure the URL is correct or authentication cookies are valid.' };
    }

    const options: DownloadOption[] = [];

    // 1. Add Best Quality (Video + Voice)
    const bestAvFormat = info.formats?.find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none');
    options.push({
      id: 'best',
      quality: 'Best Quality (Video + Voice)',
      format: 'mp4',
      sizeBytes: bestAvFormat?.filesize || info.formats?.[0]?.filesize || 0,
      url: `/api/download?url=${encodeURIComponent(url)}&formatId=best`,
      type: 'video'
    });

    // 2. Add MP3 Audio Option
    const bestAudioFormat = info.formats?.find((f: any) => f.vcodec === 'none' && f.acodec !== 'none');
    options.push({
      id: 'mp3',
      quality: 'MP3 Audio Only (Voice)',
      format: 'mp3',
      sizeBytes: bestAudioFormat?.filesize || 0,
      url: `/api/download?url=${encodeURIComponent(url)}&formatId=mp3`,
      type: 'audio'
    });

    // 3. Add available video formats
    if (info.formats) {
      const resolutionsAdded = new Set<string>();
      
      for (const f of info.formats) {
        if (f.vcodec && f.vcodec !== 'none') {
          let resName = f.resolution;
          if (resName && resName.includes('x')) {
            resName = resName.split('x')[1] + 'p';
          }
          
          if (!resName || resolutionsAdded.has(resName)) continue;
          resolutionsAdded.add(resName);

          options.push({
            id: f.format_id,
            quality: `${resName} Quality (MP4)`,
            format: f.ext || 'mp4',
            sizeBytes: f.filesize || 0,
            url: `/api/download?url=${encodeURIComponent(url)}&formatId=${f.format_id}`,
            type: 'video'
          });
        }
      }
    }

    return {
      allowed: true,
      options,
      sourceUrl: url
    };
  }
}
