export interface PlatformMetadata {
  title: string;
  thumbnail: string;
  creatorName: string;
  duration?: number; // in seconds
  type: 'video' | 'photo' | 'audio' | 'mixed';
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram';
  isPublic: boolean;
  isPrivateProfile?: boolean;
}

export interface DownloadOption {
  id: string;
  quality: string; // e.g. "1080p", "720p", "Original Photo"
  format: string;  // e.g. "mp4", "jpg", "mp3"
  sizeBytes?: number;
  url: string;     // Simulated safe legal resource url
  type: 'video' | 'audio' | 'photo';
}

export interface DownloadOptionsResponse {
  allowed: boolean;
  reason?: string; // e.g. "Private profile requires login, which we do not support"
  options?: DownloadOption[];
  sourceUrl?: string; // Fallback link if direct download is disabled by platform ToS
}

export interface PlatformAdapter {
  detect(url: string): boolean;
  validate(url: string): boolean;
  getMetadata(url: string, browser?: string): Promise<PlatformMetadata | null>;
  getDownloadOptions(
    url: string,
    userConsent: boolean,
    browser?: string
  ): Promise<DownloadOptionsResponse>;
}
