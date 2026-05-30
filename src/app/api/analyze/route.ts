import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, getPlatformAdapter } from '@/lib/platforms';
import { isSsrfSafeUrl, sanitizeInput } from '@/lib/security';
import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';

  let rawUrl = '';
  try {
    const body = await req.json();
    rawUrl = body.url || '';
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request body.', code: 'UNSUPPORTED_URL' },
      { status: 400 }
    );
  }

  // 1. Sanitize the URL string
  const url = sanitizeInput(rawUrl, 1000);
  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL is required.', code: 'UNSUPPORTED_URL' },
      { status: 400 }
    );
  }

  try {
    // 2. Perform SSRF Prevention
    const ssrfCheck = await isSsrfSafeUrl(url);
    if (!ssrfCheck.safe) {
      await db.platformRequestLog.create({
        data: {
          ipAddress: clientIp,
          url,
          success: false,
          action: 'ANALYZE',
          reason: ssrfCheck.reason || 'Blocked by SSRF Shield'
        }
      });

      throw new AppError('UNSUPPORTED_URL', ssrfCheck.reason || 'Blocked by SSRF Shield', 400);
    }

    // 3. Platform Detection and Validation
    const { platform, normalizedUrl } = detectPlatform(url);
    if (platform === 'unknown') {
      throw new AppError(
        'UNSUPPORTED_URL',
        'Unsupported URL. MediaFlow supports public YouTube, TikTok, Facebook, and Instagram links.',
        400
      );
    }

    const adapter = getPlatformAdapter(platform);
    if (!adapter || !adapter.validate(normalizedUrl)) {
      throw new AppError(
        'UNSUPPORTED_URL',
        `Invalid ${platform.toUpperCase()} URL format. Please paste a valid public link.`,
        400
      );
    }

    // 4. Retrieve Public Metadata and Formats
    console.log(`[MediaFlow API] Extracting metadata for platform "${platform}" from URL: ${normalizedUrl}`);
    const metadata = await adapter.extract(normalizedUrl);

    // Save successful analysis audit log
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        platform,
        url: normalizedUrl,
        success: true,
        action: 'ANALYZE'
      }
    });

    return NextResponse.json({
      success: true,
      metadata
    });

  } catch (error: any) {
    // Audit failed request log
    await db.platformRequestLog.create({
      data: {
        ipAddress: clientIp,
        url,
        success: false,
        action: 'ANALYZE',
        reason: error.message || 'Metadata extraction failed'
      }
    });

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }

    // Unhandled exception fallback
    console.error('[MediaFlow API Internal Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to access public metadata. Please check if the content is private, restricted, or offline.',
        code: 'FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}
