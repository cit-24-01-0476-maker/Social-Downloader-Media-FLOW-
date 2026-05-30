import { PlatformAdapter, NormalizedMetadata } from './types';
import { UniversalAdapter } from './universal';

export class FacebookAdapter extends UniversalAdapter implements PlatformAdapter {
  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return (
      cleanUrl.includes('facebook.com') || 
      cleanUrl.includes('fb.watch') || 
      cleanUrl.includes('fb.gg')
    );
  }

  validate(url: string): boolean {
    return this.detect(url);
  }

  async extract(url: string): Promise<NormalizedMetadata> {
    const meta = await super.extract(url);
    meta.platform = 'facebook';
    return meta;
  }
}
