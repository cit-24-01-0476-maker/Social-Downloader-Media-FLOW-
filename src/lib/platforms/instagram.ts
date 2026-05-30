import { PlatformAdapter, NormalizedMetadata } from './types';
import { UniversalAdapter } from './universal';

export class InstagramAdapter extends UniversalAdapter implements PlatformAdapter {
  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl.includes('instagram.com') || cleanUrl.includes('instagr.am');
  }

  validate(url: string): boolean {
    return this.detect(url);
  }

  async extract(url: string): Promise<NormalizedMetadata> {
    const meta = await super.extract(url);
    meta.platform = 'instagram';
    
    // Set appropriate mediaType for Instagram posts
    if (url.includes('/p/') || url.includes('/tv/')) {
      meta.mediaType = 'photo';
    } else if (url.includes('/reels/') || url.includes('/reel/')) {
      meta.mediaType = 'video';
    }
    
    return meta;
  }
}
