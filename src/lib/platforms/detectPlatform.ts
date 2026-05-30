export type DetectedPlatform = 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'unknown';

export interface DetectionResult {
  platform: DetectedPlatform;
  normalizedUrl: string;
}

export function detectPlatform(url: string): DetectionResult {
  if (!url) {
    return { platform: 'unknown', normalizedUrl: '' };
  }

  const trimmedUrl = url.trim();
  const lowerUrl = trimmedUrl.toLowerCase();

  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return { platform: 'youtube', normalizedUrl: trimmedUrl };
  }

  // Facebook
  if (
    lowerUrl.includes('facebook.com') || 
    lowerUrl.includes('fb.watch') || 
    lowerUrl.includes('fb.gg') || 
    lowerUrl.includes('m.facebook.com') ||
    lowerUrl.includes('web.facebook.com')
  ) {
    return { platform: 'facebook', normalizedUrl: trimmedUrl };
  }

  // Instagram
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am')) {
    return { platform: 'instagram', normalizedUrl: trimmedUrl };
  }

  // TikTok
  if (
    lowerUrl.includes('tiktok.com') || 
    lowerUrl.includes('vm.tiktok.com') || 
    lowerUrl.includes('vt.tiktok.com')
  ) {
    return { platform: 'tiktok', normalizedUrl: trimmedUrl };
  }

  return { platform: 'unknown', normalizedUrl: trimmedUrl };
}
