import { PlatformAdapter, PlatformMetadata, DownloadOptionsResponse } from './types';
import { fetchOpenGraphMetadata } from './utils';

export class FacebookAdapter implements PlatformAdapter {
  // Regex supporting public watch URLs, groups, shares, reels, and share/v links
  private urlRegex = /facebook\.com\/(?:[a-zA-Z0-9\.]+\/(?:videos|posts|watch|reels|share)|share\/v)\/?([0-9a-zA-Z_-]+)?/i;

  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch') || cleanUrl.includes('fb.com');
  }

  validate(url: string): boolean {
    if (!this.detect(url)) return false;

    // Block private configuration URL hooks or admin workspaces
    if (url.includes('business.facebook.com') || url.includes('/settings/') || url.includes('/manager/')) {
      return false;
    }

    return this.urlRegex.test(url) || url.includes('fb.watch');
  }

  async getMetadata(url: string): Promise<PlatformMetadata | null> {
    if (!this.validate(url)) return null;

    // Extract an ID for mapping high fidelity mock details
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const mockId = segments[segments.length - 1] || 'fb-video-101';

    // Simulated private check for closed Facebook groups or private profiles
    if (url.includes('/groups/') && !url.includes('public')) {
      return {
        title: 'Private Group Content (Restricted)',
        thumbnail: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=400',
        creatorName: 'Private Facebook Group Member',
        type: 'video',
        platform: 'facebook',
        isPublic: false,
        isPrivateProfile: true
      };
    }

    // Try fetching the actual metadata using the public Open Graph scraper
    const ogData = await fetchOpenGraphMetadata(url);
    if (ogData && ogData.title) {
      return {
        title: ogData.title,
        thumbnail: ogData.image || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=400',
        creatorName: ogData.creator || 'Facebook Public Post',
        type: 'video',
        platform: 'facebook',
        isPublic: true
      };
    }

    // Fallback Mock high-fidelity metadata based on video ID
    const sampleTitles = [
      'Sri Lanka Tea Plantation Documentary Tour 🍃',
      'The ultimate workspace setup reveal for 2026',
      'Learn PostgreSQL indexing rules in 5 minutes',
      'Agentic Web Coding - Antigravity Agent Showcase'
    ];
    
    const charCodeSum = mockId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const titleIndex = charCodeSum % sampleTitles.length;

    return {
      title: sampleTitles[titleIndex],
      thumbnail: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=400',
      creatorName: 'SriLankaTechPulse',
      duration: 60 + (charCodeSum % 180), // 1 to 4 minutes
      type: 'video',
      platform: 'facebook',
      isPublic: true
    };
  }

  async getDownloadOptions(url: string, userConsent: boolean): Promise<DownloadOptionsResponse> {
    if (!userConsent) {
      return { allowed: false, reason: 'Consent is required to proceed.' };
    }

    const metadata = await this.getMetadata(url);
    if (!metadata) {
      return { allowed: false, reason: 'Facebook URL format not supported.' };
    }

    if (!metadata.isPublic) {
      return {
        allowed: false,
        reason: 'This Facebook post belongs to a private group or account. Bypassing user settings is blocked.'
      };
    }

    return {
      allowed: true,
      options: [
        {
          id: 'fb-sd',
          quality: 'Standard Definition (SD Quality)',
          format: 'mp4',
          sizeBytes: 1024 * 1024 * 12.8, // 12.8MB
          url: `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/facebook_sd.mp4`,
          type: 'video'
        },
        {
          id: 'fb-hd',
          quality: 'High Definition (HD Quality)',
          format: 'mp4',
          sizeBytes: 1024 * 1024 * 34.5, // 34.5MB
          url: `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/facebook_hd.mp4`,
          type: 'video'
        }
      ],
      sourceUrl: url
    };
  }
}
