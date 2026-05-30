import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, getPlatformAdapter } from '@/lib/platforms';
import { isSsrfSafeUrl, sanitizeInput, checkRateLimit } from '@/lib/security';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  // Capture client IP (falling back to a generic identifier for local dev)
  const clientIp = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';

  let rawUrl = '';
  let browser = 'none';
  try {
    const body = await req.json();
    rawUrl = body.url || '';
    browser = sanitizeInput(body.browser || 'none', 100);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  // 1. Sanitize the URL string
  const url = sanitizeInput(rawUrl, 1000);
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // 2. Perform Rate Limiting (Bypassed as per unlimited requests request)
  const rateLimitResult = { allowed: true };

  // 3. Perform SSRF Prevention
  const ssrfCheck = await isSsrfSafeUrl(url);
  if (!ssrfCheck.safe) {
    // Audit log for security alerts
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        url,
        success: false,
        action: 'ANALYZE',
        reason: ssrfCheck.reason || 'Blocked by SSRF Shield'
      }
    });

    await db.abuseFlag.create({
      data: {
        target: clientIp,
        reason: `SSRF Violation attempt with URL: ${url}`
      }
    });

    return NextResponse.json({ error: ssrfCheck.reason }, { status: 400 });
  }

  // 4. Platform Detection and Validation
  const platform = detectPlatform(url);
  if (!platform) {
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        url,
        success: false,
        action: 'ANALYZE',
        reason: 'Unsupported platform'
      }
    });
    return NextResponse.json(
      { error: 'Unsupported URL. MediaFlow supports public YouTube, TikTok, Facebook, and Instagram links.' },
      { status: 400 }
    );
  }

  const adapter = getPlatformAdapter(platform);
  if (!adapter || !adapter.validate(url)) {
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        platform,
        url,
        success: false,
        action: 'ANALYZE',
        reason: 'Invalid URL format'
      }
    });
    return NextResponse.json(
      { error: `Invalid ${platform.toUpperCase()} URL format. Please paste a valid public link.` },
      { status: 400 }
    );
  }

  // 5. Retrieve Public Metadata
  try {
    const metadata = await adapter.getMetadata(url, browser);
    if (!metadata) {
      throw new Error('Public metadata could not be fetched.');
    }

    // We removed isPublic checks to allow unrestricted downloads as per requirements.

    // Save successful analysis audit log
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        platform,
        url,
        success: true,
        action: 'ANALYZE'
      }
    });

    const downloadOptions = await adapter.getDownloadOptions(url, true, browser);

    return NextResponse.json({
      success: true,
      platform,
      metadata,
      options: downloadOptions.options || []
    });
  } catch (error: any) {
    console.error('[MediaFlow API] Metadata fetch error:', error);
    
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        platform,
        url,
        success: false,
        action: 'ANALYZE',
        reason: error.message || 'Metadata extraction failed'
      }
    });

    return NextResponse.json(
      { error: error.message || 'Unable to access public metadata. Please check if the content is private or offline.' },
      { status: 500 }
    );
  }
}
