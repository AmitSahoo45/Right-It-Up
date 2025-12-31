import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCaseWithVerdict, getClientIp } from '@/lib/db';
import { sanitizeCaseCode } from '@/lib/security';
import type { GetCaseResponse } from '@/types';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse<GetCaseResponse>> {
    try {
        const { code: rawCode } = await params;
        
        // Validate and sanitize case code (supports both old and new formats)
        const code = sanitizeCaseCode(rawCode);
        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Invalid case code format' },
                { status: 400 }
            );
        }
        
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const clientIp = getClientIp(request);
        
        // Get case with verdict using secure RPC
        const result = await getCaseWithVerdict(code);
        
        if (!result) {
            return NextResponse.json(
                { success: false, error: 'Case not found' },
                { status: 404 }
            );
        }
        
        const { case: caseData, verdict } = result;
        
        // Determine if current user is Party A or Party B
        const isPartyA = user 
            ? caseData.party_a_id === user.id
            : caseData.party_a_ip === clientIp;
            
        const isPartyB = user
            ? caseData.party_b_id === user.id
            : caseData.party_b_ip === clientIp;
        
        // Build response based on case status and user's role
        const response: GetCaseResponse = {
            success: true,
            case: {
                ...caseData,
                // Hide Party A's argument from Party B until verdict is ready
                party_a_argument: (caseData.status === 'complete' || isPartyA) 
                    ? caseData.party_a_argument 
                    : '[Hidden until verdict]',
                party_a_evidence_text: (caseData.status === 'complete' || isPartyA)
                    ? caseData.party_a_evidence_text
                    : [],
                party_a_evidence_images: (caseData.status === 'complete' || isPartyA)
                    ? caseData.party_a_evidence_images
                    : [],
                // Hide Party B's argument from Party A until verdict is ready
                party_b_argument: (caseData.status === 'complete' || isPartyB)
                    ? caseData.party_b_argument
                    : caseData.party_b_argument ? '[Hidden until verdict]' : null,
                party_b_evidence_text: (caseData.status === 'complete' || isPartyB)
                    ? caseData.party_b_evidence_text
                    : [],
                party_b_evidence_images: (caseData.status === 'complete' || isPartyB)
                    ? caseData.party_b_evidence_images
                    : []
            },
            verdict: verdict || undefined,
            is_party_a: isPartyA,
            is_party_b: isPartyB
        };
        
        return NextResponse.json(response);
        
    } catch (error) {
        console.error('Error getting case:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get case details' },
            { status: 500 }
        );
    }
}