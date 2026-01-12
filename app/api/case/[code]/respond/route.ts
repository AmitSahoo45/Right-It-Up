import { NextResponse, after } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    getCaseByCode,
    getCaseWithVerdict,
    submitResponse,
    updateCaseStatus,
    canBothPartiesAffordVerdict,
    recordUsage,
    saveVerdict,
} from '@/lib/db';
import { updateBothPartiesStats } from '@/lib/db-profile';
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
import {
    validateHoneypot,
    extractHoneypotData,
    logBotDetection,
    createFakeSuccessResponse
} from '@/lib/honeypot/honeypot';
import { rateLimitVerdict, getRateLimitHeaders } from '@/lib/ratelimit';
import type { RespondCaseRequest, RespondCaseResponse, Dispute, AIVerdictResponse, Case } from '@/types';

// Async verdict generation - runs in background after response is sent
async function generateVerdictAsync({
    caseId,
    caseCode,
    updatedCase,
    partyBUserId,
    partyBIp
}: {
    caseId: string;
    caseCode: string;
    updatedCase: Case;
    partyBUserId: string | null;
    partyBIp: string;
}) {
    try {
        if (!updatedCase.party_b_name || !updatedCase.party_b_argument) {
            throw new Error('Party B response data missing after submission');
        }

        const dispute: Dispute = {
            category: updatedCase.category,
            partyA: {
                name: updatedCase.party_a_name,
                argument: updatedCase.party_a_argument,
                evidence: updatedCase.party_a_evidence_text
            },
            partyB: {
                name: updatedCase.party_b_name,
                argument: updatedCase.party_b_argument,
                evidence: updatedCase.party_b_evidence_text
            },
            tone: updatedCase.tone
        };

        const partyAImages = updatedCase.party_a_evidence_images || [];
        const partyBImages = updatedCase.party_b_evidence_images || [];

        const aiResponse: AIVerdictResponse = await generateVerdict({
            dispute,
            category: updatedCase.category,
            tone: updatedCase.tone,
            partyAImages,
            partyBImages
        });

        await saveVerdict(caseId, {
            party_a_score: aiResponse.analysis.partyA.score,
            party_b_score: aiResponse.analysis.partyB.score,
            party_a_analysis: {
                strengths: aiResponse.analysis.partyA.strengths || [],
                weaknesses: aiResponse.analysis.partyA.weaknesses || [],
                fallacies: aiResponse.analysis.partyA.fallacies || [],
                evidenceQuality: aiResponse.analysis.partyA.evidenceQuality,
                keyEvidence: aiResponse.analysis.partyA.keyEvidence || []
            },
            party_b_analysis: {
                strengths: aiResponse.analysis.partyB.strengths || [],
                weaknesses: aiResponse.analysis.partyB.weaknesses || [],
                fallacies: aiResponse.analysis.partyB.fallacies || [],
                evidenceQuality: aiResponse.analysis.partyB.evidenceQuality,
                keyEvidence: aiResponse.analysis.partyB.keyEvidence || []
            },
            winner: aiResponse.verdict.winner,
            confidence: aiResponse.verdict.confidence,
            summary: aiResponse.verdict.summary,
            reasoning: aiResponse.verdict.reasoning,
            advice: aiResponse.verdict.advice,
            evidence_impact: aiResponse.verdict.evidenceImpact,
            ai_provider: 'gemini'
        });

        await recordUsage(
            caseId,
            updatedCase.party_a_id,
            updatedCase.party_a_ip ?? null
        );
        await recordUsage(
            caseId,
            partyBUserId,
            partyBIp
        );

        try {
            const partyAHadEvidence = (updatedCase.party_a_evidence_text?.length || 0) > 0 ||
                (updatedCase.party_a_evidence_images?.length || 0) > 0;
            const partyBHadEvidence = (updatedCase.party_b_evidence_text?.length || 0) > 0 ||
                (updatedCase.party_b_evidence_images?.length || 0) > 0;

            await updateBothPartiesStats({
                caseId: caseId,
                caseCode: caseCode,
                category: updatedCase.category,
                tone: updatedCase.tone,
                winner: aiResponse.verdict.winner,

                partyAUserId: updatedCase.party_a_id,
                partyAName: updatedCase.party_a_name,
                partyAScore: aiResponse.analysis.partyA.score,
                partyAHadEvidence,
                partyAFallacies: aiResponse.analysis.partyA.fallacies?.length || 0,

                partyBUserId: partyBUserId,
                partyBName: updatedCase.party_b_name!,
                partyBScore: aiResponse.analysis.partyB.score,
                partyBHadEvidence,
                partyBFallacies: aiResponse.analysis.partyB.fallacies?.length || 0,
            });

        } catch (statsError) {
            console.error('Failed to update user stats:', statsError);
        }

        await updateCaseStatus(caseId, 'complete');
        console.log(`Verdict generated successfully for case ${caseCode}`);

    } catch (aiError) {
        console.error('AI verdict generation failed:', aiError);
        // Set status to 'error' instead of rolling back to 'pending_response'
        // This prevents Party B from resubmitting when their response is already saved
        await updateCaseStatus(caseId, 'pending_response');
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse<RespondCaseResponse>> {
    const clientIp = getClientIp(request);

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

        // Use secure RPC to get case data
        const caseResult = await getCaseWithVerdict(code);

        if (!caseResult) {
            return NextResponse.json(
                { success: false, error: 'Case not found' },
                { status: 404 }
            );
        }

        const caseData = caseResult.case;

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

        const honeypotData = extractHoneypotData(body as unknown as Record<string, unknown>);
        const honeypotResult = validateHoneypot(honeypotData);
        if (honeypotResult.isBot) {
            logBotDetection(clientIp, `/api/case/${code}/respond`, honeypotResult);
            return NextResponse.json(
                createFakeSuccessResponse('response') as RespondCaseResponse,
                { status: 200 }
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

        // Server-side validation: minimum 3 evidence images required
        const MIN_EVIDENCE_IMAGES = 3;
        if (evidenceImages.length < MIN_EVIDENCE_IMAGES) {
            return NextResponse.json(
                { success: false, error: `At least ${MIN_EVIDENCE_IMAGES} evidence screenshots are required` },
                { status: 400 }
            );
        }


        // Use the secure RPC to submit response (pass code, not caseId)
        const submitResult = await submitResponse(
            caseData.id,
            {
                party_b_name: sanitizedName,
                party_b_argument: sanitizedArgument,
                party_b_evidence_text: evidenceText,
                party_b_evidence_images: evidenceImages
            },
            user?.id || null,
            clientIp,
            code  // Pass the case code for the secure RPC
        );

        if (!submitResult.success) {
            return NextResponse.json(
                { success: false, error: submitResult.error || 'Failed to submit response' },
                { status: 400 }
            );
        }

        // Re-fetch the updated case data
        const updatedCaseResult = await getCaseWithVerdict(code);
        if (!updatedCaseResult) {
            throw new Error('Case disappeared after response submission');
        }

        const updatedCase = updatedCaseResult.case;

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

        // Generate verdict asynchronously using after() to keep the function alive
        // This allows the response to return immediately while verdict generates in background
        // The after() API ensures the background task completes even after the response is sent
        after(
            generateVerdictAsync({
                caseId: caseData.id,
                caseCode: code,
                updatedCase,
                partyBUserId: user?.id || null,
                partyBIp: clientIp
            })
        );

        // Return immediately with 'analyzing' status
        // Frontend will redirect to case page which shows AnalyzingView with polling
        return NextResponse.json({
            success: true,
            status: 'analyzing'
        }, {
            headers: getRateLimitHeaders(rateLimit)
        });

    } catch (error) {
        console.error('Error responding to case:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit response. Please try again.' },
            { status: 500 }
        );
    }
}