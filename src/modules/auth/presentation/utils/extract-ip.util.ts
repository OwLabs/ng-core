import { Request } from 'express';

/**
 * Extract client IP from request
 *
 * WHY A UTILITY?
 *   This logic was copy-pasted in both controllers
 *   DRY (Don't Repeat Yourself) — extract once, use everywhere
 *
 * WHAT IT HANDLES:
 *   1. X-Forwarded-For header (when behind a reverse proxy like Nginx)
 *   2. Fallback to req.ip (direct connection)
 */
export function extractClientIp(req: Request): string | undefined {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  }

  return (forwardedFor ?? req.ip)?.toString().split(',')[0].trim();
}
