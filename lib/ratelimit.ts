import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});


// Standard API rate limit: 60 requests per minute
export const standardLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:standard',
});

// Strict rate limit for expensive operations: 10 per minute
export const strictLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:strict',
});

// Case creation: 5 per minute
export const caseCreationLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:case',
});

// Verdict generation: 3 per minute (expensive AI calls)
export const verdictLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true,
    prefix: 'ratelimit:verdict',
});

// Auth attempts: 5 per 15 minutes
export const authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
});

// Quota checks: 30 per minute
export const quotaLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:quota',
});

// ============================================
// HELPER TYPES AND FUNCTIONS
// ============================================

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp when limit resets
}

// Check rate limit and return standardized result
export async function checkRateLimit(
    limiter: Ratelimit,
    identifier: string
): Promise<RateLimitResult> {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
}

// Get rate limit headers for HTTP response
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        ...(result.success ? {} : {
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        }),
    };
}

// Get client IP from request (uses verified headers)
export function getClientIpFromRequest(request: Request): string {
    // Vercel's verified IP (cannot be spoofed)
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp) return vercelIp.split(',')[0].trim();

    // Cloudflare
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // Fallback
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();

    return request.headers.get('x-real-ip') || '0.0.0.0';
}

// ============================================
// CONVENIENCE FUNCTIONS FOR API ROUTES
// ============================================

// Rate limit for case creation
export async function rateLimitCaseCreation(ip: string): Promise<RateLimitResult> {
    return checkRateLimit(caseCreationLimiter, ip);
}

// Rate limit for verdict generation
export async function rateLimitVerdict(ip: string): Promise<RateLimitResult> {
    return checkRateLimit(verdictLimiter, ip);
}

// Rate limit for general API calls
export async function rateLimitApi(ip: string): Promise<RateLimitResult> {
    return checkRateLimit(standardLimiter, ip);
}

// ============================================
// REDIS UTILITIES (for other uses)
// ============================================

export { redis };

// Store a value with expiration
export async function setWithExpiry(key: string, value: string, expirySeconds: number): Promise<void> {
    await redis.set(key, value, { ex: expirySeconds });
}

// Get a value
export async function get(key: string): Promise<string | null> {
    return redis.get(key);
}

// Delete a key
export async function del(key: string): Promise<void> {
    await redis.del(key);
}