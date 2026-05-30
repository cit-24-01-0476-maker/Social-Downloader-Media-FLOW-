import { PlatformAdapter, NormalizedMetadata } from './types';
import { UniversalAdapter } from './universal';

export class TiktokAdapter extends UniversalAdapter implements PlatformAdapter {
  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return (
      cleanUrl.includes('tiktok.com') || 
      cleanUrl.includes('vm.tiktok.com') || 
      cleanUrl.includes('vt.tiktok.com')
    );
  }

  validate(url: string): boolean {
    return this.detect(url);
  }

  async extract(url: string): Promise<NormalizedMetadata> {
    const meta = await super.extract(url);
    meta.platform = 'tiktok';
    return meta;
  }
}
