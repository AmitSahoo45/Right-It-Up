import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Security headers
    headers: async () => [
        {
            // Apply to all routes
            source: '/:path*',
            headers: [
                // Prevent clickjacking attacks
                {
                    key: 'X-Frame-Options',
                    value: 'DENY',
                },
                // Prevent MIME type sniffing
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff',
                },
                // Control referrer information
                {
                    key: 'Referrer-Policy',
                    value: 'strict-origin-when-cross-origin',
                },
                // XSS protection (legacy, but still useful for older browsers)
                {
                    key: 'X-XSS-Protection',
                    value: '1; mode=block',
                },
                // DNS prefetch control
                {
                    key: 'X-DNS-Prefetch-Control',
                    value: 'on',
                },
                // Permissions policy (formerly Feature-Policy)
                {
                    key: 'Permissions-Policy',
                    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                },
                // Strict Transport Security (HSTS)
                // Only enable this if you're certain HTTPS is always available
                {
                    key: 'Strict-Transport-Security',
                    value: 'max-age=31536000; includeSubDomains',
                },
                // Content Security Policy
                // Adjust these values based on your actual needs
                {
                    key: 'Content-Security-Policy',
                    value: [
                        "default-src 'self'",
                        // Scripts: self + inline (needed for Next.js) + eval (needed for some deps)
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                        // Styles: self + inline (needed for styled-jsx and Tailwind)
                        "style-src 'self' 'unsafe-inline'",
                        // Images: self + data URIs + Supabase storage + blob for html2canvas
                        "img-src 'self' data: blob: https://*.supabase.co",
                        // Fonts: self + Google Fonts
                        "font-src 'self' https://fonts.gstatic.com",
                        // Connect: self + Supabase + your API endpoints
                        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
                        // Frame ancestors: none (prevent embedding)
                        "frame-ancestors 'none'",
                        // Form actions: self only
                        "form-action 'self'",
                        // Base URI: self only
                        "base-uri 'self'",
                        // Object sources: none
                        "object-src 'none'",
                        // Upgrade insecure requests
                        "upgrade-insecure-requests",
                    ].join('; '),
                },
            ],
        },
        {
            // Stricter headers for API routes
            source: '/api/:path*',
            headers: [
                // No caching for API routes
                {
                    key: 'Cache-Control',
                    value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
                },
                {
                    key: 'Pragma',
                    value: 'no-cache',
                },
                {
                    key: 'Expires',
                    value: '0',
                },
            ],
        },
    ],

    // Disable x-powered-by header (don't reveal we're using Next.js)
    poweredByHeader: false,

    // Enable React strict mode for catching potential issues
    reactStrictMode: true,

    // Image optimization configuration
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },

    // Redirect HTTP to HTTPS in production (if not handled by Vercel)
    async redirects() {
        return [];
    },
};

export default nextConfig;