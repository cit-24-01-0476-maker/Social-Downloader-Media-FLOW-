import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    // Await params for modern Next.js App Router compatibility
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await db.downloadJob.findUnique({
      where: { id }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        platform: job.platform,
        url: job.url,
        status: job.status,
        progress: job.progress,
        downloadUrl: job.downloadUrl,
        errorMessage: job.errorMessage,
        fileSize: job.fileSize,
        contentType: job.contentType,
        title: job.title,
        creatorName: job.creatorName,
        thumbnail: job.thumbnail,
        duration: job.duration,
        createdAt: job.createdAt
      }
    });
  } catch (error: any) {
    console.error('[MediaFlow API] Get job error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching job status' },
      { status: 500 }
    );
  }
}
