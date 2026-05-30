import { PlatformAdapter, PlatformMetadata, DownloadOptionsResponse } from './types';

export class YoutubeAdapter implements PlatformAdapter {
  // Regex supporting standard videos, mobile share links, and Shorts
  private urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|shorts\/|v\/|playlist\?list=)?([a-zA-Z0-9_-]{11})/;

  detect(url: string): boolean {
    const cleanUrl = url.trim().toLowerCase();
    return cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
  }

  validate(url: string): boolean {
    if (!this.detect(url)) return false;
    
    // Reject YouTube private lists or Studio dashboards
    if (url.includes('studio.youtube.com') || url.includes('/dashboard')) {
      return false;
    }

    // Verify it matches core patterns
    return this.urlRegex.test(url);
  }

  private extractVideoId(url: string): string | null {
    const match = url.match(this.urlRegex);
    return match ? match[5] : null;
  }

  async getMetadata(url: string): Promise<PlatformMetadata | null> {
    if (!this.validate(url)) return null;

    const videoId = this.extractVideoId(url);
    if (!videoId) return null;

    // Reject known private/restricted placeholder IDs for simulation
    if (videoId === 'privatevideo' || videoId.startsWith('priv_')) {
      return {
        title: 'Private Video (Restricted)',
        thumbnail: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=400',
        creatorName: 'Unknown Creator',
        type: 'video',
        platform: 'youtube',
        isPublic: false,
        isPrivateProfile: true
      };
    }

    // Try fetching the actual video details using the public YouTube oEmbed API
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || 'YouTube Video',
          thumbnail: data.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400',
          creatorName: data.author_name || 'YouTube Creator',
          type: 'video',
          platform: 'youtube',
          isPublic: true
        };
      }
    } catch (e) {
      console.warn('[MediaFlow YouTube Adapter] oEmbed fetch failed, using fallback mock:', e);
    }

    // Fallback Mock high-fidelity metadata based on video ID
    const sampleTitles = [
      'Stunning Aerial Drone Tour of Sri Lanka Highlands',
      'Building a Modern Next.js SaaS Boilerplate in 1 Hour',
      'Relaxing Lo-Fi Beats for Coding & Concentration',
      'The Future of Agentic AI: Hands-on with DeepMind Agents'
    ];

    const sampleCreators = ['TravelSriLanka', 'TechWithOsh', 'LoFiVibes', 'DeepTech Lab'];
    
    // Use stable random mapping based on ID length or character codes for realism
    const charCodeSum = videoId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const titleIndex = charCodeSum % sampleTitles.length;
    const creatorIndex = charCodeSum % sampleCreators.length;
    const duration = 120 + (charCodeSum % 600); // 2 to 12 minutes

    return {
      title: sampleTitles[titleIndex],
      thumbnail: `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400`,
      creatorName: sampleCreators[creatorIndex],
      duration,
      type: 'video',
      platform: 'youtube',
      isPublic: true
    };
  }

  async getDownloadOptions(url: string, userConsent: boolean): Promise<DownloadOptionsResponse> {
    if (!userConsent) {
      return { allowed: false, reason: 'Consent is required to proceed with processing.' };
    }

    const metadata = await this.getMetadata(url);
    if (!metadata) {
      return { allowed: false, reason: 'Unable to resolve video metadata. The URL may be invalid.' };
    }

    if (!metadata.isPublic) {
      return { 
        allowed: false, 
        reason: 'This video is private, age-restricted, or contains DRM locks. MediaFlow is legally forbidden from bypassing these protections.' 
      };
    }

    // Capture standard legal streams for owner download
    const videoId = this.extractVideoId(url);
    
    return {
      allowed: true,
      options: [
        {
          id: 'yt-1080p',
          quality: '1080p HD (Video Only)',
          format: 'mp4',
          sizeBytes: 1024 * 1024 * 48, // 48MB
          url: `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/${videoId}_1080p.mp4`,
          type: 'video'
        },
        {
          id: 'yt-720p',
          quality: '720p HD (Video + Audio)',
          format: 'mp4',
          sizeBytes: 1024 * 1024 * 22, // 22MB
          url: `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/${videoId}_720p.mp4`,
          type: 'video'
        },
        {
          id: 'yt-audio',
          quality: 'High Quality Audio (M4A)',
          format: 'm4a',
          sizeBytes: 1024 * 1024 * 4.5, // 4.5MB
          url: `https://mediaflow-dev.s3.amazonaws.com/mock-downloads/${videoId}.m4a`,
          type: 'audio'
        }
      ],
      sourceUrl: url
    };
  }
}
