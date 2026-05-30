import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enqueueDownloadJob } from '@/lib/queue';
import { isSsrfSafeUrl, sanitizeInput, checkRateLimit } from '@/lib/security';
import { detectPlatform, getPlatformAdapter } from '@/lib/platforms';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';

  let url = '';
  let platform = '';
  let consent = false;

  let formatId = 'best';
  let browser = 'none';

  try {
    const body = await req.json();
    url = sanitizeInput(body.url || '', 1000);
    platform = sanitizeInput(body.platform || '', 100);
    formatId = sanitizeInput(body.formatId || 'best', 100);
    browser = sanitizeInput(body.browser || 'none', 100);
    consent = !!body.consent;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  // Consent check removed to support unrestricted downloading.

  // 2. Perform Rate Limiting (Bypassed as per unlimited request)
  const rateLimitResult = { allowed: true };

  // 3. SSRF Protection
  const ssrfCheck = await isSsrfSafeUrl(url);
  if (!ssrfCheck.safe) {
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        url,
        success: false,
        action: 'DOWNLOAD',
        reason: ssrfCheck.reason || 'Blocked by SSRF Shield'
      }
    });
    return NextResponse.json({ error: ssrfCheck.reason }, { status: 400 });
  }

  // 4. Platform Adapter Validation (Auto-detecting and bypass strict matches)
  const detectedPlatform = detectPlatform(url) || 'generic';
  platform = detectedPlatform; // Override requested platform with actual detected platform

  const adapter = getPlatformAdapter(platform);
  if (!adapter || !adapter.validate(url)) {
    return NextResponse.json({ error: 'URL validation failed.' }, { status: 400 });
  }

  try {
    // 5. Create Job Record
    const job = await db.downloadJob.create({
      data: {
        platform,
        url,
        status: 'PENDING',
        progress: 0
      }
    });

    // 6. Record user legal consent binding
    await db.consentRecord.create({
      data: {
        jobId: job.id,
        ipAddress: clientIp,
        consentText: 'I confirm I own this content or have permission to download it.'
      }
    });

    // 7. Enqueue task to background queue
    await enqueueDownloadJob(job.id, url, platform, formatId, browser);

    // Save successful log
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        platform,
        url,
        success: true,
        action: 'DOWNLOAD'
      }
    });

    return NextResponse.json({
      success: true,
      jobId: job.id
    });
  } catch (error: any) {
    console.error('[MediaFlow API] Job creation error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize processing job. Please try again later.' },
      { status: 500 }
    );
  }
}
