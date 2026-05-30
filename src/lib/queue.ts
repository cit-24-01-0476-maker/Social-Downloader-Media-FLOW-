import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from './db';
import { downloadVideoLocal, getVideoInfo } from './downloader';

// Queue Name
const QUEUE_NAME = 'media-downloads';

// Redis connection configurations
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let redisConnection: IORedis | null = null;
let downloadQueue: Queue | null = null;
let queueWorker: Worker | null = null;

// Determine if Redis is available and configured
const isRedisConfigured = process.env.USE_REDIS === 'true' || !!process.env.REDIS_HOST;

// Simulates a download job execution in-memory (fallback mode)
// Simulates a download job execution in-memory (fallback mode)
async function processDownloadJob(jobId: string, url: string, platform: string, formatId: string = 'best', browser: string = 'none') {
  console.log(`[MediaFlow Queue] 🚀 Processing download job ${jobId} for ${url} (${platform}, format: ${formatId}, browser: ${browser})`);

  try {
    // 1. Mark as processing
    await db.downloadJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', progress: 10 }
    });

    const info = await getVideoInfo(url, browser);
    if (!info) {
      throw new Error('Could not retrieve metadata. The content may be restricted or invalid.');
    }

    // Determine type (audio vs video)
    const isAudio = formatId === 'mp3';

    // Update job with metadata
    await db.downloadJob.update({
      where: { id: jobId },
      data: {
        title: info.title,
        creatorName: info.uploader,
        thumbnail: info.thumbnail,
        duration: info.duration || 0,
        contentType: isAudio ? 'audio' : 'video',
        progress: 30
      }
    });

    // 2. Perform the actual download via yt-dlp
    console.log(`[MediaFlow Queue] Downloading video for job ${jobId}...`);
    const downloadUrl = await downloadVideoLocal(url, formatId, browser);
    
    // We update progress to 90
    await db.downloadJob.update({
      where: { id: jobId },
      data: { progress: 90 }
    });

    // 3. Mark as completed
    await db.downloadJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        downloadUrl,
        fileSize: info.formats?.[0]?.filesize || 0
      }
    });

    console.log(`[MediaFlow Queue] ✅ Job ${jobId} finished successfully`);
  } catch (error: any) {
    console.error(`[MediaFlow Queue] ❌ Job ${jobId} failed:`, error.message);
    await db.downloadJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        progress: 0,
        errorMessage: error.message || 'An unexpected error occurred during processing'
      }
    });
  }
}

if (isRedisConfigured) {
  try {
    redisConnection = new IORedis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

    downloadQueue = new Queue(QUEUE_NAME, { connection: redisConnection as any });

    // Core worker process that performs actual downloading in production
    queueWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { jobId, url, platform, formatId, browser } = job.data;
        await processDownloadJob(jobId, url, platform, formatId || 'best', browser || 'none');
      },
      { connection: redisConnection as any }
    );

    console.log('[MediaFlow Queue] 📡 BullMQ initialized successfully with Redis connection.');
  } catch (redisError) {
    console.error('[MediaFlow Queue] 🚨 Redis connection failed, falling back to In-Memory processor:', redisError);
    downloadQueue = null;
    queueWorker = null;
  }
}

/**
 * Pushes a job onto the download queue or runs it in fallback memory
 */
export async function enqueueDownloadJob(jobId: string, url: string, platform: string, formatId: string = 'best', browser: string = 'none') {
  if (downloadQueue) {
    try {
      await downloadQueue.add('download-task', { jobId, url, platform, formatId, browser });
      console.log(`[MediaFlow Queue] Added job ${jobId} to BullMQ`);
      return;
    } catch (e) {
      console.warn('[MediaFlow Queue] Failed to queue via BullMQ, running in simulation mode:', e);
    }
  }

  // Fallback to asynchronous in-memory processing (doesn't block HTTP thread)
  processDownloadJob(jobId, url, platform, formatId, browser);
}
