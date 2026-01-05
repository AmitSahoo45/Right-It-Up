import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCase, checkQuota } from '@/lib/db';
import { getClientIp } from '@/lib/utils';
import {
    sanitizeTextOnly,
    sanitizeName,
    sanitizeEvidenceText,
    sanitizeUrls,
    detectPromptInjection,
    safeLogExcerpt
} from '@/lib/security';
import {
    validateHoneypot,
    extractHoneypotData,
    generateFakeSuccessResponse,
    logBotDetection
} from '@/lib/honeypot';
import { rateLimitCaseCreation, getRateLimitHeaders, getClientIpFromRequest } from '@/lib/ratelimit';
import type { CreateCaseRequest, CreateCaseResponse } from '@/types';

export async function POST(request: Request): Promise<NextResponse<CreateCaseResponse>> {
    const clientIp = getClientIpFromRequest(request);

    const rateLimit = await rateLimitCaseCreation(clientIp);
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, error: 'Too many cases created. Please wait before creating another.' },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimit)
            }
        );
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const rawBody = await request.json();

        // Extract and validate honeypot fields
        const { honeypotData, cleanBody } = extractHoneypotData(rawBody);
        const honeypotResult = validateHoneypot(honeypotData);

        if (honeypotResult.isBot) {
            // Log the bot detection for monitoring
            logBotDetection(clientIp, honeypotResult, 'POST /api/case');

            // Return fake success to avoid revealing detection
            return NextResponse.json(
                generateFakeSuccessResponse('case') as CreateCaseResponse,
                { status: 200 }
            );
        }

        const body = cleanBody as CreateCaseRequest;

        const sanitizedName = sanitizeName(body.party_a_name);
        if (!sanitizedName || sanitizedName.length < 1) {
            return NextResponse.json(
                { success: false, error: 'Your name is required' },
                { status: 400 }
            );
        }

        const sanitizedArgument = sanitizeTextOnly(body.party_a_argument, 5000);
        if (!sanitizedArgument) {
            return NextResponse.json(
                { success: false, error: 'Your argument is required' },
                { status: 400 }
            );
        }

        if (sanitizedArgument.length < 20) {
            return NextResponse.json(
                { success: false, error: 'Argument must be at least 20 characters' },
                { status: 400 }
            );
        }

        if (detectPromptInjection(sanitizedArgument)) {
            console.warn(`Potential prompt injection detected from IP ${clientIp}: ${safeLogExcerpt(sanitizedArgument)}`);
        }

        const quota = await checkQuota(user?.id || null, clientIp);
        if (!quota.can_use) {
            const message = user
                ? 'You have used all 5 verdicts for today. Try again tomorrow!'
                : 'You have used your free verdict. Sign in to get 5 verdicts per day!';

            return NextResponse.json(
                { success: false, error: message },
                { status: 429 }
            );
        }

        const evidenceText = sanitizeEvidenceText(body.party_a_evidence_text || []);
        const evidenceImages = sanitizeUrls(body.party_a_evidence_images || []).slice(0, 5);

        const validCategories = ['general', 'relationship', 'roommate', 'sports', 'tech'];
        const validTones = ['neutral', 'genz', 'professional', 'savage', 'wholesome'];

        const category = validCategories.includes(body.category) ? body.category : 'general';
        const tone = validTones.includes(body.tone) ? body.tone : 'neutral';

        // Uses secure create_case RPC internally
        const newCase = await createCase(
            {
                category,
                tone,
                party_a_name: sanitizedName,
                party_a_argument: sanitizedArgument,
                party_a_evidence_text: evidenceText,
                party_a_evidence_images: evidenceImages
            },
            user?.id || null,
            clientIp
        );

        const origin = request.headers.get('origin') ||
            (process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : 'https://rightitup.vercel.app');
        const shareUrl = `${origin}/case/${newCase.code}`;

        return NextResponse.json({
            success: true,
            code: newCase.code,
            share_url: shareUrl
        }, {
            headers: getRateLimitHeaders(rateLimit)
        });

    } catch (error) {
        console.error('Error creating case:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create case. Please try again.' },
            { status: 500 }
        );
    }
}