import { PlatformAdapter } from './types';
import { UniversalAdapter } from './universal';

const universalAdapter = new UniversalAdapter();

export function detectPlatform(url: string): string | null {
  // Try basic extraction for UI purposes
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok')) return 'tiktok';
  if (url.includes('facebook') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('instagram')) return 'instagram';
  
  return 'generic';
}

export function getPlatformAdapter(platform: string): PlatformAdapter | null {
  return universalAdapter;
}

export * from './types';
export * from './universal';
