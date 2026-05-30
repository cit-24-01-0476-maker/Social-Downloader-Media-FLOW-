import { PlatformAdapter, PlatformMetadata, DownloadOptionsResponse } from './types';

export class TiktokAdapter implements PlatformAdapter {
  // Matches tiktok videos: e.g. https://www.tiktok.com/@username/video/123456789
  // Also supports vm.tiktok.com mobile share URLs
  private desktopRegex = /tiktok\.com\/@([a-zA-Z0-9_\.]+)\/video\/(\d+)/i;
  private mobileRegex = /(vm|vt)\.tiktok\.com\/([a-zA-Z0-9]+)/i;

  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl.includes('tiktok.com');
  }

  validate(url: string): boolean {
    if (!this.detect(url)) return false;
    
    // Block administrative subdomains or dashboards
    if (url.includes('ads.tiktok.com') || url.includes('business.tiktok.com')) {
      return false;
    }

    return this.desktopRegex.test(url) || this.mobileRegex.test(url);
  }

  async getMetadata(url: string): Promise<PlatformMetadata | null> {
    if (!this.validate(url)) return null;

    let username = 'tiktok_creator';
    let videoId = '12345';

    const deskMatch = url.match(this.desktopRegex);
    if (deskMatch) {
      username = deskMatch[1];
      videoId = deskMatch[2];
    } else {
      const mobMatch = url.match(this.mobileRegex);
      if (mobMatch) {
        videoId = mobMatch[1];
      }
    }

    // Reject known private handles
    if (username.toLowerCase().includes('private') || username.toLowerCase().includes('secret')) {
      return {
        title: 'Private Post (Access Restricted)',
        thumbnail: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=400',
        creatorName: `@${username}`,
        type: 'video',
        platform: 'tiktok',
        isPublic: false,
        isPrivateProfile: true
      };
    }

    // Try fetching the actual video details using the public TikTok oEmbed API
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || 'TikTok Post',
          thumbnail: data.thumbnail_url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400',
          creatorName: data.author_name || `@${username}`,
          type: 'video',
          platform: 'tiktok',
          isPublic: true
        };
      }
    } catch (e) {
      console.warn('[MediaFlow TikTok Adapter] oEmbed fetch failed, using fallback mock:', e);
    }

    // Fallback: High fidelity mock metadata
    const sampleCaptions = [
      'Epic Sunset over Colombo Skyline 🌅 #srilanka #travel #vibes',
      'How to center a div in 2026! 😂 #webdev #programming #coding',
      'Life hack: coding on a Saturday morning ☕💻 #developer #setup',
      'When your agentic AI writes better code than you 🤖⚡ #artificialintelligence'
    ];

    const charCodeSum = videoId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const captionIndex = charCodeSum % sampleCaptions.length;

    return {
      title: sampleCaptions[captionIndex],
      thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=400',
      creatorName: `@${username}`,
      duration: 15 + (charCodeSum % 45), // 15 to 60 seconds
      type: 'video',
      platform: 'tiktok',
      isPublic: true
    };
  }

  async getDownloadOptions(url: string, userConsent: boolean): Promise<DownloadOptionsResponse> {
    if (!userConsent) {
      return { allowed: false, reason: 'Consent is required to proceed.' };
    }

    const metadata = await this.getMetadata(url);
    if (!metadata) {
      return { allowed: false, reason: 'Invalid or unreachable TikTok URL.' };
    }

    if (!metadata.isPublic) {
      return {
        allowed: false,
        reason: 'This TikTok profile or post is private. MediaFlow does not bypass user privacy protections.'
      };
    }

    // We do NOT support bypasses or watermark removal. We provide the public URL.
    return {
      allowed: true,
      options: [
        {
          id: 'tt-original',
          quality: 'Original Quality (With Watermark)',
          format: 'mp4',
          sizeBytes: 1024 * 1024 * 8.4, // 8.4MB
          url: `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/tiktok_${metadata.creatorName}.mp4`,
          type: 'video'
        }
      ],
      sourceUrl: url
    };
  }
}
