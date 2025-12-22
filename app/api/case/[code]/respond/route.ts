import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    getCaseByCode,
    submitResponse,
    updateCaseStatus,
    canBothPartiesAffordVerdict,
    recordUsage,
    saveVerdict,
} from '@/lib/db';
import { getClientIp } from '@/lib/utils';
import { generateVerdict } from '@/lib/ai';
import {
    sanitizeTextOnly,
    sanitizeName,
    sanitizeEvidenceText,
    sanitizeUrls,
    sanitizeCaseCode,
    detectPromptInjection,
    safeLogExcerpt,
} from '@/lib/security';
import { rateLimitVerdict, getRateLimitHeaders, getClientIpFromRequest } from '@/lib/ratelimit';
import type { RespondCaseRequest, RespondCaseResponse, Dispute, AIVerdictResponse } from '@/types';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse<RespondCaseResponse>> {
    const clientIp = getClientIpFromRequest(request);
    const { code: rawCode } = await params;

    const code = sanitizeCaseCode(rawCode);
    if (!code) {
        return NextResponse.json(
            { success: false, error: 'Invalid case code format' },
            { status: 400 }
        );
    }

    const rateLimit = await rateLimitVerdict(clientIp);
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, error: 'Too many submissions. Please wait before trying again.' },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimit)
            }
        );
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const caseData = await getCaseByCode(code);

        if (!caseData) {
            return NextResponse.json(
                { success: false, error: 'Case not found' },
                { status: 404 }
            );
        }

        if (caseData.status === 'expired') {
            return NextResponse.json(
                { success: false, error: 'This case has expired' },
                { status: 410 }
            );
        }

        if (caseData.status === 'complete') {
            return NextResponse.json(
                { success: false, error: 'This case already has a verdict', verdict_url: `/verdict/${code}` },
                { status: 400 }
            );
        }

        if (caseData.status !== 'pending_response') {
            return NextResponse.json(
                { success: false, error: 'This case is not accepting responses' },
                { status: 400 }
            );
        }

        if (user && caseData.party_a_id === user.id) {
            return NextResponse.json(
                { success: false, error: 'You cannot respond to your own case' },
                { status: 403 }
            );
        }

        if (!user && caseData.party_a_ip === clientIp) {
            return NextResponse.json(
                { success: false, error: 'You cannot respond to your own case' },
                { status: 403 }
            );
        }

        let body: RespondCaseRequest;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid request body' },
                { status: 400 }
            );
        }

        const sanitizedName = sanitizeName(body.party_b_name);
        if (!sanitizedName || sanitizedName.length < 1) {
            return NextResponse.json(
                { success: false, error: 'Your name is required' },
                { status: 400 }
            );
        }

        const sanitizedArgument = sanitizeTextOnly(body.party_b_argument, 5000);
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

        if (sanitizedArgument.length > 5000) {
            return NextResponse.json(
                { success: false, error: 'Argument must be under 5000 characters' },
                { status: 400 }
            );
        }

        if (detectPromptInjection(sanitizedArgument))
            console.warn(`Potential prompt injection detected from IP ${clientIp}: ${safeLogExcerpt(sanitizedArgument)}`);

        const evidenceText = sanitizeEvidenceText(body.party_b_evidence_text || []);
        const evidenceImages = sanitizeUrls(body.party_b_evidence_images || []).slice(0, 5);

        await submitResponse(
            caseData.id,
            {
                party_b_name: sanitizedName,
                party_b_argument: sanitizedArgument,
                party_b_evidence_text: evidenceText,
                party_b_evidence_images: evidenceImages
            },
            user?.id || null,
            clientIp
        );

        const updatedCase = await getCaseByCode(code);
        if (!updatedCase) {
            throw new Error('Case disappeared after response submission');
        }

        const quotaCheck = await canBothPartiesAffordVerdict(updatedCase);

        if (!quotaCheck.canProceed) {
            await updateCaseStatus(caseData.id, 'blocked_quota');

            return NextResponse.json({
                success: false,
                status: 'blocked_quota',
                error: quotaCheck.message,
                quota_issue: quotaCheck.blockedParty || undefined
            }, { status: 402 });
        }

        await updateCaseStatus(caseData.id, 'analyzing');

        try {
            const dispute: Dispute = {
                category: updatedCase.category,
                partyA: {
                    name: updatedCase.party_a_name,
                    argument: updatedCase.party_a_argument,
                    evidence: updatedCase.party_a_evidence_text
                },
                partyB: {
                    name: updatedCase.party_b_name!,
                    argument: updatedCase.party_b_argument!,
                    evidence: updatedCase.party_b_evidence_text
                },
                tone: updatedCase.tone
            };

            const partyAImages = updatedCase.party_a_evidence_images || [];
            const partyBImages = updatedCase.party_b_evidence_images || [];

            console.log(`Generating verdict with ${partyAImages.length} Party A images and ${partyBImages.length} Party B images`);

            const aiResponse: AIVerdictResponse = await generateVerdict({
                dispute,
                category: updatedCase.category,
                tone: updatedCase.tone,
                partyAImages,
                partyBImages
            });

            await saveVerdict(caseData.id, {
                party_a_score: aiResponse.analysis.partyA.score,
                party_b_score: aiResponse.analysis.partyB.score,
                party_a_analysis: {
                    strengths: aiResponse.analysis.partyA.strengths,
                    weaknesses: aiResponse.analysis.partyA.weaknesses,
                    fallacies: aiResponse.analysis.partyA.fallacies
                },
                party_b_analysis: {
                    strengths: aiResponse.analysis.partyB.strengths,
                    weaknesses: aiResponse.analysis.partyB.weaknesses,
                    fallacies: aiResponse.analysis.partyB.fallacies
                },
                winner: aiResponse.verdict.winner,
                confidence: aiResponse.verdict.confidence,
                summary: aiResponse.verdict.summary,
                reasoning: aiResponse.verdict.reasoning,
                advice: aiResponse.verdict.advice,
                ai_provider: 'gemini'
            });

            await recordUsage(
                caseData.id,
                updatedCase.party_a_id,
                updatedCase.party_a_ip || ''
            );
            await recordUsage(
                caseData.id,
                user?.id || null,
                clientIp
            );

            await updateCaseStatus(caseData.id, 'complete');
            return NextResponse.json({
                success: true,
                status: 'complete',
                verdict_url: `/verdict/${code}`
            }, {
                headers: getRateLimitHeaders(rateLimit)
            });

        } catch (aiError) {
            console.error('AI verdict generation failed:', aiError);

            await updateCaseStatus(caseData.id, 'pending_response');

            return NextResponse.json({
                success: false,
                error: 'Failed to generate verdict. Please try again.'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error responding to case:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit response. Please try again.' },
            { status: 500 }
        );
    }
}