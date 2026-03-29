/**
 * In-memory rate limiter.
 * Tracks attempts per key (e.g., email for login) within a sliding window.
 * 5 login attempts per email per 15 minutes, progressive delay.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_ATTEMPTS = 10;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstAttempt > LOCKOUT_MS) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    // Window expired or new entry
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
  }

  // Check lockout (10+ failed attempts → 30 min lockout)
  if (entry.attempts >= LOCKOUT_ATTEMPTS) {
    const lockoutEnd = entry.lastAttempt + LOCKOUT_MS;
    if (now < lockoutEnd) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: lockoutEnd - now,
      };
    }
    // Lockout expired, reset
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
  }

  // Within window
  if (entry.attempts >= MAX_ATTEMPTS) {
    const windowEnd = entry.firstAttempt + WINDOW_MS;
    // Progressive delay: 1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, entry.attempts - MAX_ATTEMPTS), 16000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(delay, windowEnd - now),
    };
  }

  entry.attempts++;
  entry.lastAttempt = now;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.attempts,
    retryAfterMs: 0,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
