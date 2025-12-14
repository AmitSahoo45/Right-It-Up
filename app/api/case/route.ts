import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCase, checkQuota, getClientIp } from '@/lib/db';
import type { CreateCaseRequest, CreateCaseResponse } from '@/types';

export async function POST(request: Request): Promise<NextResponse<CreateCaseResponse>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const clientIp = getClientIp(request);

        const body: CreateCaseRequest = await request.json();

        if (!body.party_a_name?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Your name is required' },
                { status: 400 }
            );
        }

        if (!body.party_a_argument?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Your argument is required' },
                { status: 400 }
            );
        }

        if (body.party_a_argument.length < 20) {
            return NextResponse.json(
                { success: false, error: 'Argument must be at least 20 characters' },
                { status: 400 }
            );
        }

        if (body.party_a_argument.length > 5000) {
            return NextResponse.json(
                { success: false, error: 'Argument must be under 5000 characters' },
                { status: 400 }
            );
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

        const evidenceText = (body.party_a_evidence_text || []).filter(e => e.trim());
        const evidenceImages = (body.party_a_evidence_images || []).slice(0, 5); // Max 5 images

        const newCase = await createCase(
            {
                category: body.category || 'general',
                tone: body.tone || 'neutral',
                party_a_name: body.party_a_name.trim(),
                party_a_argument: body.party_a_argument.trim(),
                party_a_evidence_text: evidenceText,
                party_a_evidence_images: evidenceImages
            },
            user?.id || null,
            clientIp
        );

        const origin = request.headers.get('origin') ||
            // if NEXT_PUBLIC_ENVIRONMENT is set to 'development', use localhost else use production URL
            (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? 'http://localhost:3000' : 'https://rightitup.vercel.app');
        const shareUrl = `${origin}/case/${newCase.code}`;

        return NextResponse.json({
            success: true,
            code: newCase.code,
            share_url: shareUrl
        });

    } catch (error) {
        console.error('Error creating case:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create case. Please try again.' },
            { status: 500 }
        );
    }
}
