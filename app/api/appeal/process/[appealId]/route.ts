import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateAppealVerdict } from '@/lib/appealAi';

interface RouteParams {
    params: Promise<{ appealId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { appealId } = await params;

        const supabase = await createClient();

        // Get appeal data
        const { data: appeal, error: appealError } = await supabase
            .from('appeals')
            .select('*')
            .eq('id', appealId)
            .single();

        if (appealError || !appeal) {
            return NextResponse.json(
                { success: false, error: 'Appeal not found' },
                { status: 404 }
            );
        }

        if (appeal.status !== 'pending') {
            return NextResponse.json(
                { success: false, error: `Appeal already ${appeal.status}` },
                { status: 400 }
            );
        }

        // Update status to processing
        await supabase
            .from('appeals')
            .update({ status: 'processing' })
            .eq('id', appealId);

        // Get full case data
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('*')
            .eq('id', appeal.case_id)
            .single();

        if (caseError || !caseData) {
            await supabase
                .from('appeals')
                .update({ status: 'rejected', change_summary: 'Case data not found' })
                .eq('id', appealId);

            return NextResponse.json(
                { success: false, error: 'Case not found' },
                { status: 404 }
            );
        }

        // Build context for AI evaluation
        const appealContext = {
            originalDispute: {
                category: caseData.category,
                tone: caseData.tone,
                partyA: {
                    name: caseData.party_a_name,
                    argument: caseData.party_a_argument,
                    evidence: caseData.party_a_evidence_text?.join('\n') || undefined
                },
                partyB: {
                    name: caseData.party_b_name,
                    argument: caseData.party_b_argument,
                    evidence: caseData.party_b_evidence_text?.join('\n') || undefined
                }
            },
            originalVerdict: {
                winner: appeal.original_winner,
                confidence: appeal.original_verdict.confidence,
                summary: appeal.original_verdict.summary,
                reasoning: appeal.original_verdict.reasoning,
                partyAScore: appeal.original_party_a_score,
                partyBScore: appeal.original_party_b_score
            },
            appeal: {
                appealingParty: appeal.appealing_party as 'partyA' | 'partyB',
                appellantName: appeal.appealing_party === 'partyA'
                    ? caseData.party_a_name
                    : caseData.party_b_name,
                reason: appeal.reason,
                newEvidence: appeal.new_evidence_text || undefined
            }
        };

        console.log(`[Appeal] Processing appeal ${appealId} for case ${caseData.code}`);

        // Generate appeal verdict
        let appealVerdict;
        try {
            appealVerdict = await generateAppealVerdict(appealContext);
        } catch (aiError) {
            console.error('[Appeal] AI generation failed:', aiError);

            await supabase
                .from('appeals')
                .update({
                    status: 'rejected',
                    change_summary: 'Failed to process appeal. Please try again later.'
                })
                .eq('id', appealId);

            return NextResponse.json(
                { success: false, error: 'Failed to process appeal' },
                { status: 500 }
            );
        }

        const verdictChanged = appealVerdict.newVerdict.winner !== appeal.original_winner;

        const appealVerdictSnapshot = {
            winner: appealVerdict.newVerdict.winner,
            confidence: appealVerdict.newVerdict.confidence,
            summary: appealVerdict.newVerdict.summary,
            reasoning: appealVerdict.newVerdict.reasoning,
            advice: appealVerdict.newVerdict.advice,
            party_a_analysis: appealVerdict.newAnalysis.partyA,
            party_b_analysis: appealVerdict.newAnalysis.partyB
        };

        const { error: updateError } = await supabase
            .from('appeals')
            .update({
                appeal_verdict: appealVerdictSnapshot,
                new_winner: appealVerdict.newVerdict.winner,
                new_party_a_score: appealVerdict.newAnalysis.partyA.score,
                new_party_b_score: appealVerdict.newAnalysis.partyB.score,
                verdict_changed: verdictChanged,
                change_summary: appealVerdict.appealAssessment.changeSummary,
                status: 'completed',
                processed_at: new Date().toISOString()
            })
            .eq('id', appealId);

        if (updateError) {
            console.error('[Appeal] Update error:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to save appeal result' },
                { status: 500 }
            );
        }

        console.log(`[Appeal] Completed: ${appealId}, verdict changed: ${verdictChanged}`);

        return NextResponse.json({
            success: true,
            appealId,
            verdictChanged,
            newWinner: appealVerdict.newVerdict.winner,
            changeSummary: appealVerdict.appealAssessment.changeSummary,
            newEvidenceImpact: appealVerdict.appealAssessment.newEvidenceImpact
        });

    } catch (error) {
        console.error('[Appeal] Process error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}   