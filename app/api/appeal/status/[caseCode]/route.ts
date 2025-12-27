import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface RouteParams {
    params: Promise<{ caseCode: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { caseCode } = await params;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get case data
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select(`
                id, code, status,
                party_a_id, party_b_id,
                party_a_name, party_b_name,
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

        // Get appeals for this case
        const { data: appeals, error: appealsError } = await supabase
            .from('appeals')
            .select('*')
            .eq('case_id', caseData.id)
            .order('created_at', { ascending: false });

        if (appealsError) {
            console.error('[Appeal] Fetch error:', appealsError);
        }

        // Determine if current user can appeal
        let canAppealAsPartyA = false;
        let canAppealAsPartyB = false;

        if (user && caseData.status === 'complete') {
            canAppealAsPartyA = caseData.party_a_id === user.id && !caseData.party_a_appealed;
            canAppealAsPartyB = caseData.party_b_id === user.id && !caseData.party_b_appealed;
        }

        return NextResponse.json({
            success: true,
            caseId: caseData.id,
            caseCode: caseData.code,
            status: caseData.status,
            partyAName: caseData.party_a_name,
            partyBName: caseData.party_b_name,
            partyAAppealed: caseData.party_a_appealed || false,
            partyBAppealed: caseData.party_b_appealed || false,
            appealCount: caseData.appeal_count || 0,
            canAppealAsPartyA,
            canAppealAsPartyB,
            appeals: appeals || [],
            userIsPartyA: user?.id === caseData.party_a_id,
            userIsPartyB: user?.id === caseData.party_b_id
        });

    } catch (error) {
        console.error('[Appeal] Status error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}