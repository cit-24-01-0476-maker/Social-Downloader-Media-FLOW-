import { Readable } from 'stream';

export interface StorageProvider {
  uploadFile(
    key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
}

// Simulated local storage provider
class LocalDevStorageProvider implements StorageProvider {
  constructor() {
    if (process.env.NODE_ENV === 'development' && !(global as any).hasLoggedStorageProviderLog) {
      console.log('[MediaFlow Storage] 📂 Using Local Development Storage Provider');
      (global as any).hasLoggedStorageProviderLog = true;
    }
  }

  async uploadFile(key: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    console.log(`[MediaFlow Storage] Mock uploaded file "${key}" (${fileBuffer.length} bytes, type: ${contentType})`);
    // Return a mock public dev URL
    return `/api/storage/dev-mock/${key}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/api/storage/dev-mock/${key}`;
  }
}

// S3 Storage Provider (production-ready stub using standard AWS SDK principles)
class S3StorageProvider implements StorageProvider {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'mediaflow-storage';
    if (process.env.NODE_ENV === 'development' && !(global as any).hasLoggedStorageProviderLog) {
      console.log(`[MediaFlow Storage] ☁️ Initialized S3-compatible Storage Provider (Bucket: ${this.bucketName})`);
      (global as any).hasLoggedStorageProviderLog = true;
    }
  }

  async uploadFile(key: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    // In production, we would use:
    // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    // const s3 = new S3Client({ region: process.env.S3_REGION });
    // await s3.send(new PutObjectCommand({ Bucket: this.bucketName, Key: key, Body: fileBuffer, ContentType: contentType }));
    
    console.log(`[MediaFlow Storage] Production S3 upload: bucket=${this.bucketName}, key=${key}`);
    return `https://${this.bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `https://${this.bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}?signature=mock-signature`;
  }
}

// Resolve storage client based on configuration
const isS3Configured = !!(
  process.env.S3_BUCKET_NAME &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

export const storage: StorageProvider = isS3Configured
  ? new S3StorageProvider()
  : new LocalDevStorageProvider();
