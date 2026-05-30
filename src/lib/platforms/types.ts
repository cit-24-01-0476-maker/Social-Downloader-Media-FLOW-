export interface NormalizedFormat {
  formatId: string;
  label: string;
  ext: string;
  resolution?: string;
  filesize?: number;
  hasVideo: boolean;
  hasAudio: boolean;
  url?: string;
}

export interface NormalizedMetadata {
  id: string;
  platform: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  mediaType: 'video' | 'audio' | 'photo' | 'carousel' | 'unknown';
  formats: NormalizedFormat[];
}

export interface PlatformAdapter {
  detect(url: string): boolean;
  validate(url: string): boolean;
  extract(url: string): Promise<NormalizedMetadata>;
}
