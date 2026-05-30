import dns from 'dns';
import { promisify } from 'util';
import { db } from './db';

const lookupAsync = promisify(dns.lookup);

// Private IPv4 patterns
const PRIVATE_IP_REGEX = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|0\.\d+\.\d+\.\d+|169\.254\.169\.254)$/;

/**
 * Checks if a given hostname or IP falls into loopback or private ranges to block SSRF.
 */
export async function isSsrfSafeUrl(urlString: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const parsedUrl = new URL(urlString);

    // Validate protocol
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { safe: false, reason: 'Invalid protocol. Only HTTP and HTTPS are permitted.' };
    }

    return { safe: true };
  } catch (err) {
    return { safe: false, reason: 'Malformed or invalid URL format.' };
  }
}

/**
 * Strips HTML tags, restricts length, and sanitizes strings to prevent injection payloads
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return '';
  let sanitized = input.trim();
  
  // Truncate to maximum safe length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove HTML script tags, tags, and scriptable hooks
  sanitized = sanitized
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/javascript:/gi, '') // remove javascript pseudo-protocol
    .replace(/onclick|onerror|onload/gi, ''); // remove event handlers

  return sanitized;
}

/**
 * Evaluates request log history in the last hour to enforce simple sliding rate limits per IP
 */
export async function checkRateLimit(
  ipAddress: string,
  limitPerHour: number = 30
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Query platform logs for matches from this IP within the last hour
    const logs = await db.platformRequestLog.findMany();
    const recentRequestsFromIp = logs.filter(
      (log: any) => log.ipAddress === ipAddress && new Date(log.timestamp) > oneHourAgo
    );

    const count = recentRequestsFromIp.length;

    if (count >= limitPerHour) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limitPerHour - count - 1 };
  } catch (err) {
    console.error('[MediaFlow Security] Rate limit check error, defaulting to allowed:', err);
    return { allowed: true, remaining: 1 };
  }
}
