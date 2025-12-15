import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    getCaseByCode,
    submitResponse,
    updateCaseStatus,
    canBothPartiesAffordVerdict,
    recordUsage,
    saveVerdict,
    getClientIp
} from '@/lib/db';
import { generateVerdict } from '@/lib/ai';
import type { RespondCaseRequest, RespondCaseResponse, Dispute, AIVerdictResponse } from '@/types';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse<RespondCaseResponse>> {
    try {
        const { code } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const clientIp = getClientIp(request);
        
        // Get the case
        const caseData = await getCaseByCode(code);
        
        if (!caseData) {
            return NextResponse.json(
                { success: false, error: 'Case not found' },
                { status: 404 }
            );
        }
        
        // Check case status
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
        
        // Prevent Party A from responding to their own case
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
        
        // Parse request body
        const body: RespondCaseRequest = await request.json();
        
        // Validate required fields
        if (!body.party_b_name?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Your name is required' },
                { status: 400 }
            );
        }
        
        if (!body.party_b_argument?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Your argument is required' },
                { status: 400 }
            );
        }
        
        if (body.party_b_argument.length < 20) {
            return NextResponse.json(
                { success: false, error: 'Argument must be at least 20 characters' },
                { status: 400 }
            );
        }
        
        if (body.party_b_argument.length > 5000) {
            return NextResponse.json(
                { success: false, error: 'Argument must be under 5000 characters' },
                { status: 400 }
            );
        }
        
        // Submit the response first (to lock in Party B's data)
        const evidenceText = (body.party_b_evidence_text || []).filter(e => e.trim());
        const evidenceImages = (body.party_b_evidence_images || []).slice(0, 5);
        
        await submitResponse(
            caseData.id,
            {
                party_b_name: body.party_b_name.trim(),
                party_b_argument: body.party_b_argument.trim(),
                party_b_evidence_text: evidenceText,
                party_b_evidence_images: evidenceImages
            },
            user?.id || null,
            clientIp
        );
        
        // Refresh case data with Party B's info
        const updatedCase = await getCaseByCode(code);
        if (!updatedCase) {
            throw new Error('Case disappeared after response submission');
        }
        
        // Check if both parties can afford the verdict
        const quotaCheck = await canBothPartiesAffordVerdict(updatedCase);
        
        if (!quotaCheck.canProceed) {
            // Update status to blocked
            await updateCaseStatus(caseData.id, 'blocked_quota');
            
            return NextResponse.json({
                success: false,
                status: 'blocked_quota',
                error: quotaCheck.message,
                quota_issue: quotaCheck.blockedParty || undefined
            }, { status: 402 }); // Payment Required (quota)
        }
        
        // Both parties have quota - proceed with verdict generation
        await updateCaseStatus(caseData.id, 'analyzing');
        
        try {
            // Build dispute object for AI
            const dispute: Dispute = {
                category: updatedCase.category,
                partyA: {
                    name: updatedCase.party_a_name,
                    argument: updatedCase.party_a_argument,
                    evidence: [
                        ...updatedCase.party_a_evidence_text,
                        ...updatedCase.party_a_evidence_images.map(url => `[Image: ${url}]`)
                    ]
                },
                partyB: {
                    name: updatedCase.party_b_name!,
                    argument: updatedCase.party_b_argument!,
                    evidence: [
                        ...updatedCase.party_b_evidence_text,
                        ...updatedCase.party_b_evidence_images.map(url => `[Image: ${url}]`)
                    ]
                },
                tone: updatedCase.tone
            };
            
            // Generate verdict from AI
            const aiResponse: AIVerdictResponse = await generateVerdict({
                dispute,
                category: updatedCase.category,
                tone: updatedCase.tone
            });
            
            // Save verdict to database
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
                ai_provider: 'gemini' // Default, can be made dynamic
            });

            // Record usage for BOTH parties
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

            // Mark case as complete
            await updateCaseStatus(caseData.id, 'complete');
            
            return NextResponse.json({
                success: true,
                status: 'complete',
                verdict_url: `/verdict/${code}`
            });
            
        } catch (aiError) {
            console.error('AI verdict generation failed:', aiError);
            
            // Revert status to pending so they can try again
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
