import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> | { filename: string } }
) {
  try {
    // Resolve params modern/legacy compatibility
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const filename = resolvedParams.filename || '';

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Resolve dynamic temp path
    const isServerless = process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';
    const TMP_DIR = isServerless 
      ? path.join(os.tmpdir(), 'mediaflow')
      : path.join(process.cwd(), 'public', 'downloads');

    const filePath = path.join(TMP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`[Downloads Router] File not found: ${filePath}`);
      return NextResponse.json({ error: 'Download file not found or has expired.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    let contentType = 'application/octet-stream';
    if (ext === 'mp4') contentType = 'video/mp4';
    else if (ext === 'mp3') contentType = 'audio/mpeg';
    else if (ext === 'ogg') contentType = 'audio/ogg';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('[Downloads Router] Failed to serve file:', error);
    return NextResponse.json({ error: 'Failed to serve download file.' }, { status: 500 });
  }
}
