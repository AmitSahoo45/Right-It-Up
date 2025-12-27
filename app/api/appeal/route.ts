import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sanitizeTextOnly } from '@/lib/security';
import { checkRateLimit, strictLimiter, getClientIpFromRequest, getRateLimitHeaders } from '@/lib/ratelimit';

export async function POST(request: Request) {
    const clientIp = getClientIpFromRequest(request);

    // Rate limit: 5 appeals per minute using strictLimiter
    const rateLimit = await checkRateLimit(strictLimiter, `appeal:${clientIp}`);
    if (!rateLimit.success) {
        return NextResponse.json(
            { success: false, error: 'Rate limit exceeded. Please try again later.' },
            { status: 429, headers: getRateLimitHeaders(rateLimit) }
        );
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in to submit an appeal' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { caseCode, appealingParty, reason, newEvidenceText, newEvidenceImages } = body;

        // Validate required fields
        if (!caseCode || !appealingParty || !reason) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: caseCode, appealingParty, reason' },
                { status: 400 }
            );
        }

        if (!['partyA', 'partyB'].includes(appealingParty)) {
            return NextResponse.json(
                { success: false, error: 'Invalid appealing party' },
                { status: 400 }
            );
        }

        // Sanitize inputs
        const sanitizedReason = sanitizeTextOnly(reason, 2000);
        const sanitizedEvidence = newEvidenceText ? sanitizeTextOnly(newEvidenceText, 5000) : null;

        if (!sanitizedReason || sanitizedReason.length < 20) {
            return NextResponse.json(
                { success: false, error: 'Appeal reason must be at least 20 characters' },
                { status: 400 }
            );
        }

        // Get case data
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select(`
                id, code, status, category, tone,
                party_a_id, party_b_id,
                party_a_name, party_b_name,
                party_a_argument, party_b_argument,
                party_a_evidence_text, party_b_evidence_text,
                party_a_appealed, party_b_appealed,
                appeal_count
            `)
            .eq('code', caseCode)
            .single();

        if (caseError || !caseData) {
            return NextResponse.json(
                { success: false, error: 'Case not found' },
                { status: 404 }
            );
        }

        // Verify case is complete
        if (caseData.status !== 'complete') {
            return NextResponse.json(
                { success: false, error: 'Can only appeal completed cases' },
                { status: 400 }
            );
        }

        // Verify user is the correct party
        const isPartyA = appealingParty === 'partyA' && caseData.party_a_id === user.id;
        const isPartyB = appealingParty === 'partyB' && caseData.party_b_id === user.id;

        if (!isPartyA && !isPartyB) {
            return NextResponse.json(
                { success: false, error: 'You can only appeal as your own party' },
                { status: 403 }
            );
        }

        // Check if party already appealed
        if ((appealingParty === 'partyA' && caseData.party_a_appealed) ||
            (appealingParty === 'partyB' && caseData.party_b_appealed)) {
            return NextResponse.json(
                { success: false, error: 'You have already used your appeal for this case' },
                { status: 400 }
            );
        }

        // Get original verdict
        const { data: verdictData, error: verdictError } = await supabase
            .from('verdicts')
            .select('*')
            .eq('case_id', caseData.id)
            .single();

        if (verdictError || !verdictData) {
            return NextResponse.json(
                { success: false, error: 'Original verdict not found' },
                { status: 404 }
            );
        }

        // Build original verdict snapshot
        const originalVerdictSnapshot = {
            winner: verdictData.winner,
            confidence: verdictData.confidence,
            summary: verdictData.summary,
            reasoning: verdictData.reasoning,
            advice: verdictData.advice,
            party_a_analysis: verdictData.party_a_analysis,
            party_b_analysis: verdictData.party_b_analysis
        };

        // Insert appeal
        const { data: appealData, error: appealError } = await supabase
            .from('appeals')
            .insert({
                case_id: caseData.id,
                appealing_party: appealingParty,
                appellant_id: user.id,
                reason: sanitizedReason,
                new_evidence_text: sanitizedEvidence,
                new_evidence_images: newEvidenceImages || [],
                original_verdict: originalVerdictSnapshot,
                original_winner: verdictData.winner,
                original_party_a_score: verdictData.party_a_score,
                original_party_b_score: verdictData.party_b_score,
                status: 'pending'
            })
            .select('id')
            .single();

        if (appealError) {
            console.error('[Appeal] Insert error:', appealError);

            if (appealError.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'You have already submitted an appeal for this case' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { success: false, error: 'Failed to submit appeal' },
                { status: 500 }
            );
        }

        // Update case appeal tracking
        const updateField = appealingParty === 'partyA' ? 'party_a_appealed' : 'party_b_appealed';
        await supabase
            .from('cases')
            .update({
                [updateField]: true,
                appeal_count: (caseData.appeal_count || 0) + 1
            })
            .eq('id', caseData.id);

        console.log(`[Appeal] Submitted: ${appealData.id} for case ${caseCode} by ${appealingParty}`);

        return NextResponse.json({
            success: true,
            appealId: appealData.id,
            message: 'Appeal submitted successfully. Processing will begin shortly.'
        });

    } catch (error) {
        console.error('[Appeal] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}