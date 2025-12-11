import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate Limiting and Input Validation Utilities
 * Provides protection against abuse and ensures data integrity
 */

// In-memory store for rate limiting (resets on server restart)
// For production, consider using Redis or similar persistent store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, CLEANUP_INTERVAL);

interface RateLimitConfig {
  limit: number;           // Max requests per window
  windowMs?: number;       // Time window in milliseconds (default: 60000 = 1 minute)
  keyPrefix?: string;      // Optional prefix for the rate limit key
}

/**
 * Get client IP address from request headers
 * Supports common proxy headers (Cloudflare, nginx, etc.)
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 * Returns NextResponse with 429 status if limit exceeded, or null if allowed
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const { limit, windowMs = 60000, keyPrefix = '' } = config;
  const ip = getClientIP(request);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired - start new window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000))
        }
      }
    );
  }

  // Increment counter
  record.count++;
  return null;
}

/**
 * Validate UUID v4 format
 * Returns true if valid, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;

  // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is 8, 9, a, or b
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Also allow UUIDs without the version/variant constraints (some systems generate these)
  const uuidLooseRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return uuidV4Regex.test(uuid) || uuidLooseRegex.test(uuid);
}

/**
 * Validate and bound pagination parameters
 * Returns validated limit and offset with any error message
 */
export function validatePagination(
  limitParam: string | null,
  offsetParam: string | null,
  maxLimit: number = 100,
  maxOffset: number = 10000
): { limit: number; offset: number; error?: string } {
  let limit = 50; // Default
  let offset = 0; // Default
  let error: string | undefined;

  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (isNaN(parsed) || parsed < 1) {
      error = 'Invalid limit parameter';
      limit = 50;
    } else if (parsed > maxLimit) {
      error = `Limit exceeds maximum (${maxLimit})`;
      limit = maxLimit;
    } else {
      limit = parsed;
    }
  }

  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10);
    if (isNaN(parsed) || parsed < 0) {
      error = error ? `${error}; Invalid offset parameter` : 'Invalid offset parameter';
      offset = 0;
    } else if (parsed > maxOffset) {
      error = error ? `${error}; Offset exceeds maximum (${maxOffset})` : `Offset exceeds maximum (${maxOffset})`;
      offset = maxOffset;
    } else {
      offset = parsed;
    }
  }

  return { limit, offset, error };
}

/**
 * Sanitize string for logging to prevent log injection attacks
 * Removes newlines, control characters, and limits length
 */
export function sanitizeForLog(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove control characters (except space)
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Replace newlines with space
    .replace(/[\r\n]+/g, ' ')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validate integer parameter within bounds
 */
export function validateIntParam(
  value: string | null,
  defaultValue: number,
  min: number,
  max: number
): { value: number; error?: string } {
  if (!value) return { value: defaultValue };

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return { value: defaultValue, error: 'Invalid integer parameter' };
  }
  if (parsed < min) {
    return { value: min, error: `Value below minimum (${min})` };
  }
  if (parsed > max) {
    return { value: max, error: `Value exceeds maximum (${max})` };
  }

  return { value: parsed };
}
