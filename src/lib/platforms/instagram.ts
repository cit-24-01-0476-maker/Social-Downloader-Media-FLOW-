import { PlatformAdapter, PlatformMetadata, DownloadOptionsResponse } from './types';
import { fetchOpenGraphMetadata } from './utils';

export class InstagramAdapter implements PlatformAdapter {
  // Regex supporting public reels, posts (p/), and share links
  private urlRegex = /instagram\.com\/(p|reel|tv|stories)\/([a-zA-Z0-9_-]+)/i;

  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl.includes('instagram.com');
  }

  validate(url: string): boolean {
    if (!this.detect(url)) return false;

    // Block IG administration or settings hooks
    if (url.includes('business.instagram.com') || url.includes('/developer')) {
      return false;
    }

    return this.urlRegex.test(url);
  }

  async getMetadata(url: string): Promise<PlatformMetadata | null> {
    if (!this.validate(url)) return null;

    const match = url.match(this.urlRegex);
    if (!match) return null;

    const typeCode = match[1]; // "p", "reel", "stories", "tv"
    const mediaId = match[2];

    // Stories require login. We strictly NEVER bypass logins.
    if (typeCode === 'stories') {
      return {
        title: 'Instagram Stories require explicit authentication',
        thumbnail: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=400',
        creatorName: 'Unknown Account',
        type: 'mixed',
        platform: 'instagram',
        isPublic: false,
        isPrivateProfile: true
      };
    }

    const isReel = typeCode === 'reel';

    // Try fetching the actual metadata using the public Open Graph scraper
    const ogData = await fetchOpenGraphMetadata(url);
    if (ogData && ogData.title) {
      return {
        title: ogData.title,
        thumbnail: ogData.image || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400',
        creatorName: ogData.creator || 'Instagram Post',
        duration: isReel ? 30 : undefined,
        type: isReel ? 'video' : 'photo',
        platform: 'instagram',
        isPublic: true
      };
    }

    // Fallback Mock high-fidelity metadata
    const sampleCaptions = [
      'Chasing waves in Weligama 🏄‍♂️✨ #srilanka #surfing #beach',
      'Minimalist home studio design setup ☕🖥️ #developer #setup #desk',
      'The power of clean code and good coffee #codingSriLanka #javascript',
      'Exploring the ancient ruins of Sigiriya Rock Fortress #history #culture'
    ];

    const charCodeSum = mediaId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const captionIndex = charCodeSum % sampleCaptions.length;

    return {
      title: sampleCaptions[captionIndex],
      thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400',
      creatorName: 'explore_srilanka',
      duration: isReel ? 30 : undefined,
      type: isReel ? 'video' : 'photo',
      platform: 'instagram',
      isPublic: true
    };
  }

  async getDownloadOptions(url: string, userConsent: boolean): Promise<DownloadOptionsResponse> {
    if (!userConsent) {
      return { allowed: false, reason: 'Consent is required to download files.' };
    }

    const metadata = await this.getMetadata(url);
    if (!metadata) {
      return { allowed: false, reason: 'Instagram URL format not recognized.' };
    }

    if (!metadata.isPublic) {
      return {
        allowed: false,
        reason: 'This content is private or requires authentication to access. MediaFlow does not bypass user permissions.'
      };
    }

    const isVideo = metadata.type === 'video';

    return {
      allowed: true,
      options: [
        {
          id: isVideo ? 'ig-video-hd' : 'ig-photo-hd',
          quality: isVideo ? 'High Quality Video (Reel)' : 'Original Resolution Photo',
          format: isVideo ? 'mp4' : 'jpg',
          sizeBytes: isVideo ? 1024 * 1024 * 14.2 : 1024 * 1024 * 1.8, // 14.2MB or 1.8MB
          url: isVideo 
            ? `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/instagram_reel.mp4`
            : `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/instagram_post.jpg`,
          type: isVideo ? 'video' : 'photo'
        }
      ],
      sourceUrl: url
    };
  }
}
