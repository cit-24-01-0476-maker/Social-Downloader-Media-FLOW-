import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch recent jobs
    const recentJobs = await db.downloadJob.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch recent security request logs
    const recentLogs = await db.platformRequestLog.findMany({
      take: 15,
      orderBy: { timestamp: 'desc' }
    });

    // 3. Counts for KPI metrics
    const totalJobs = await db.downloadJob.count();
    
    // Custom count based on active database adapter
    const allJobs = await db.downloadJob.findMany();
    const failedJobsCount = allJobs.filter((x: any) => x.status === 'FAILED').length;
    const completedJobsCount = allJobs.filter((x: any) => x.status === 'COMPLETED').length;

    const totalAuditLogs = await db.platformRequestLog.count();
    const blockedRequestsCount = await db.platformRequestLog.count({
      where: { success: false }
    });

    const activeAbuseFlags = await db.abuseFlag.findMany();

    // 4. Calculate Platform distribution stats
    const platformStats = {
      youtube: 0,
      tiktok: 0,
      facebook: 0,
      instagram: 0
    };

    allJobs.forEach((job: any) => {
      const p = job.platform?.toLowerCase();
      if (p in platformStats) {
        platformStats[p as keyof typeof platformStats]++;
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalJobs,
        completedJobs: completedJobsCount,
        failedJobs: failedJobsCount,
        totalAudits: totalAuditLogs,
        blockedRequests: blockedRequestsCount,
        abuseFlagsCount: activeAbuseFlags.length,
        platformStats,
      },
      recentJobs,
      recentLogs: recentLogs.slice(0, 10),
      abuseFlags: activeAbuseFlags.slice(0, 5)
    });
  } catch (error: any) {
    console.error('[MediaFlow API] Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin data panel statistics' },
      { status: 500 }
    );
  }
}
