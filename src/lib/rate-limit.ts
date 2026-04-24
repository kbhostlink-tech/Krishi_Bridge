/**
 * In-memory rate limiter.
 * Tracks attempts per key (e.g., email for login) within a sliding window.
 * Default: 5 login attempts per email per 15 minutes, progressive delay.
 * Bidding: 30 bids per user per 5 minutes (separate config).
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Default limits (for login, auth, general)
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_ATTEMPTS = 10;
const DEFAULT_LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

// Configurable limits per rate-limit category
interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  lockoutAttempts: number;
  lockoutMs: number;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  bid: {
    windowMs: 5 * 60 * 1000,       // 5-minute window
    maxAttempts: 30,                 // 30 bids per 5 min (generous for active auctions)
    lockoutAttempts: 60,             // lockout at 60 attempts (extreme abuse)
    lockoutMs: 5 * 60 * 1000,       // 5-minute lockout
  },
};

function getConfig(key: string): RateLimitConfig {
  // Extract category from key (e.g., "bid:userId" → "bid")
  const category = key.split(":")[0];
  return RATE_LIMIT_CONFIGS[category] || {
    windowMs: DEFAULT_WINDOW_MS,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    lockoutAttempts: DEFAULT_LOCKOUT_ATTEMPTS,
    lockoutMs: DEFAULT_LOCKOUT_MS,
  };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    const config = getConfig(key);
    if (now - entry.firstAttempt > config.lockoutMs) {
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
  const config = getConfig(key);

  if (!entry || now - entry.firstAttempt > config.windowMs) {
    // Window expired or new entry
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
  }

  // Check lockout (extreme abuse → lockout)
  if (entry.attempts >= config.lockoutAttempts) {
    const lockoutEnd = entry.lastAttempt + config.lockoutMs;
    if (now < lockoutEnd) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: lockoutEnd - now,
      };
    }
    // Lockout expired, reset
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
    return { allowed: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
  }

  // Within window
  if (entry.attempts >= config.maxAttempts) {
    const windowEnd = entry.firstAttempt + config.windowMs;
    // Progressive delay: 1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, entry.attempts - config.maxAttempts), 16000);
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
    remaining: config.maxAttempts - entry.attempts,
    retryAfterMs: 0,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

