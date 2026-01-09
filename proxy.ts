import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// General API rate limit for routes WITHOUT their own rate limiting
const apiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
});

function getClientIp(request: NextRequest): string {
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp)
        return vercelIp.split(',')[0].trim();

    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp)
        return cfIp;

    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded)
        return forwarded.split(',')[0].trim();

    const realIp = request.headers.get('x-real-ip');
    if (realIp)
        return realIp;

    return '0.0.0.0';
}

// Routes that have their own dedicated rate limiting in API handlers
// These should NOT be rate limited at middleware level to avoid double-counting
const ROUTES_WITH_OWN_RATE_LIMITING = [
    '/api/case',           // Uses rateLimitCaseCreation (5/min)
    '/respond',            // Uses rateLimitVerdict (3/min)
];

function hasOwnRateLimiting(pathname: string): boolean {
    return ROUTES_WITH_OWN_RATE_LIMITING.some(route => 
        pathname === route || pathname.includes(route)
    );
}

export const proxy = async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const clientIp = getClientIp(request);

    if (pathname.startsWith('/api/')) {
        // Skip middleware rate limiting for routes that have their own limiters
        // This prevents double-counting against users
        if (!hasOwnRateLimiting(pathname)) {
            try {
                const { success, reset } = await apiLimiter.limit(clientIp);
                if (!success) {
                    return NextResponse.json(
                        { success: false, error: 'Too many requests. Please slow down.' },
                        {
                            status: 429,
                            headers: {
                                'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('Rate limit check failed:', error);
            }
        }
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}