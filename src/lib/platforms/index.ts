import { YoutubeAdapter } from './youtube';
import { TiktokAdapter } from './tiktok';
import { FacebookAdapter } from './facebook';
import { InstagramAdapter } from './instagram';
import { UniversalAdapter } from './universal';
import { PlatformAdapter } from './types';

export * from './types';
export * from './detectPlatform';

const youtubeAdapter = new YoutubeAdapter();
const tiktokAdapter = new TiktokAdapter();
const facebookAdapter = new FacebookAdapter();
const instagramAdapter = new InstagramAdapter();
const universalAdapter = new UniversalAdapter();

export function getPlatformAdapter(platform: string): PlatformAdapter {
  switch (platform) {
    case 'youtube':
      return youtubeAdapter;
    case 'tiktok':
      return tiktokAdapter;
    case 'facebook':
      return facebookAdapter;
    case 'instagram':
      return instagramAdapter;
    default:
      return universalAdapter;
  }
}
