import { createClient } from '@/utils/supabase/server';
import type {
    Case,
    Verdict,
    QuotaCheck,
    CreateCaseRequest,
    RespondCaseRequest,
    CaseStatus,
    PartyAnalysis,
    SaveVerdictData
} from '@/types';

export { getClientIp, formatDate, getTimeRemaining } from './utils';

// ============================================
// CASE CODE GENERATION (Now handled by DB)
// ============================================

// Note: generateCaseCode is now handled server-side by the create_case RPC
// Keeping this for backwards compatibility if needed
export const generateCaseCode = async (): Promise<string> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('generate_case_code');

    if (error) throw new Error(`Failed to generate case code: ${error.message}`);
    return data;
}

// ============================================
// CASE CREATION (Using secure RPC)
// ============================================

export const createCase = async (
    data: CreateCaseRequest,
    userId: string | null,
    clientIp: string
): Promise<{ code: string; id: string }> => {
    const supabase = await createClient();

    // Use the secure create_case RPC
    const { data: result, error } = await supabase.rpc('create_case', {
        p_party_a_name: data.party_a_name,
        p_party_a_argument: data.party_a_argument,
        p_category: data.category || 'general',
        p_tone: data.tone || 'neutral',
        p_party_a_evidence_text: data.party_a_evidence_text || [],
        p_party_a_evidence_images: data.party_a_evidence_images || [],
        p_party_a_ip: userId ? null : clientIp
    });

    if (error) throw new Error(`Failed to create case: ${error.message}`);

    if (!result || !result.success) {
        throw new Error('Failed to create case: RPC returned unsuccessful result');
    }

    return {
        code: result.code,
        id: result.case_id
    };
}

// ============================================
// CASE RETRIEVAL
// ============================================

export const getCaseByCode = async (code: string): Promise<Case | null> => {
    const supabase = await createClient();

    // Use the secure RPC for case retrieval
    const { data, error } = await supabase.rpc('get_case_with_verdict', {
        p_code: code
    });

    if (error) {
        throw new Error(`Failed to get case: ${error.message}`);
    }

    if (!data || data.length === 0) {
        return null;
    }

    return data[0].case_data as Case;
}

export const getCaseWithVerdict = async (code: string): Promise<{ case: Case; verdict: Verdict | null } | null> => {
    const supabase = await createClient();

    // Use the secure RPC
    const { data, error } = await supabase.rpc('get_case_with_verdict', {
        p_code: code
    });

    if (error) {
        throw new Error(`Failed to get case: ${error.message}`);
    }

    if (!data || data.length === 0) {
        return null;
    }

    const row = data[0];
    return {
        case: row.case_data as Case,
        verdict: row.verdict_data as Verdict | null
    };
}

// ============================================
// PARTY B RESPONSE (Using secure RPC)
// ============================================

export const submitResponse = async (
    caseId: string,
    data: RespondCaseRequest,
    userId: string | null,
    clientIp: string,
    caseCode: string
): Promise<{ success: boolean; error?: string }> => {
    const supabase = await createClient();

    // Use the secure submit_party_b_response RPC
    const { data: result, error } = await supabase.rpc('submit_party_b_response', {
        p_code: caseCode,
        p_party_b_name: data.party_b_name,
        p_party_b_argument: data.party_b_argument,
        p_party_b_evidence_text: data.party_b_evidence_text || [],
        p_party_b_evidence_images: data.party_b_evidence_images || [],
        p_party_b_ip: userId ? null : clientIp
    });

    if (error) {
        throw new Error(`Failed to submit response: ${error.message}`);
    }

    if (!result || !result.success) {
        return {
            success: false,
            error: result?.error || 'Failed to submit response'
        };
    }

    return { success: true };
}

// Legacy function signature for backwards compatibility
// Note: caseId is now ignored, caseCode is required
export const submitResponseLegacy = async (
    caseId: string,
    data: RespondCaseRequest,
    userId: string | null,
    clientIp: string
): Promise<void> => {
    // This is kept for any code that still uses the old signature
    // It will fail since we don't have the code
    throw new Error('submitResponseLegacy is deprecated. Use submitResponse with caseCode parameter.');
}

// ============================================
// CASE STATUS UPDATE
// ============================================

export async function updateCaseStatus(caseId: string, status: CaseStatus): Promise<void> {
    const supabase = await createClient();

    // Check if we have an RPC for this, otherwise use direct update for authenticated users
    const { error } = await supabase.rpc('update_case_status', {
        p_case_id: caseId,
        p_status: status
    });

    if (error) {
        // Fallback to direct update if RPC doesn't exist
        const { error: updateError } = await supabase
            .from('cases')
            .update({
                status,
                ...(status === 'complete' ? { completed_at: new Date().toISOString() } : {})
            })
            .eq('id', caseId);

        if (updateError) {
            throw new Error(`Failed to update case status: ${updateError.message}`);
        }
    }
}

// ============================================
// VERDICT OPERATIONS
// ============================================

export const saveVerdict = async (
    caseId: string,
    verdictData: SaveVerdictData
): Promise<Verdict> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('verdicts')
        .insert({
            case_id: caseId,
            party_a_score: verdictData.party_a_score,
            party_b_score: verdictData.party_b_score,
            party_a_analysis: verdictData.party_a_analysis,
            party_b_analysis: verdictData.party_b_analysis,
            winner: verdictData.winner,
            confidence: verdictData.confidence,
            summary: verdictData.summary,
            reasoning: verdictData.reasoning,
            advice: verdictData.advice,
            evidence_impact: verdictData.evidence_impact || null,
            ai_provider: verdictData.ai_provider
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to save verdict: ${error.message}`);
    return data;
}

export const updateVerdictImages = async (
    verdictId: string,
    receiptUrl: string | null,
    rulingUrl: string | null
): Promise<void> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from('verdicts')
        .update({
            receipt_image_url: receiptUrl,
            ruling_image_url: rulingUrl
        })
        .eq('id', verdictId);

    if (error) throw new Error(`Failed to update verdict images: ${error.message}`);
}

// ============================================
// QUOTA OPERATIONS
// ============================================

export const checkUserQuota = async (userId: string): Promise<QuotaCheck> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('check_user_quota', { p_user_id: userId });

    if (error) throw new Error(`Failed to check user quota: ${error.message}`);

    return data[0] || { can_use: false, remaining: 0, used: 5 };
}

export const checkGuestQuota = async (ip: string | null): Promise<QuotaCheck> => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('check_guest_quota', { p_ip: ip });

    if (error) throw new Error(`Failed to check guest quota: ${error.message}`);

    return data[0] || { can_use: false, remaining: 0, used: 1 };
}

export const checkQuota = async (userId: string | null, ip: string | null): Promise<QuotaCheck> => {
    if (userId) {
        return checkUserQuota(userId);
    }
    return checkGuestQuota(ip);
}


export const recordUsage = async (
    caseId: string,
    userId: string | null,
    ip: string | null
): Promise<void> => {
    const supabase = await createClient();

    const { error } = await supabase
        .rpc('record_verdict_usage', {
            p_case_id: caseId,
            p_user_id: userId,
            p_guest_ip: userId ? null : ip
        });

    if (error) throw new Error(`Failed to record usage: ${error.message}`);
}

export const canBothPartiesAffordVerdict = async (caseData: Case): Promise<{
    canProceed: boolean;
    blockedParty: 'party_a' | 'party_b' | null;
    message: string;
}> => {
    // Check Party A
    const partyAQuota = await checkQuota(
        caseData.party_a_id,
        caseData.party_a_ip ?? null
    );

    if (!partyAQuota.can_use) {
        return {
            canProceed: false,
            blockedParty: 'party_a',
            message: caseData.party_a_id
                ? 'Party A has used all their verdicts for today'
                : 'Party A must sign in to unlock this verdict'
        };
    }

    // Checking Party B
    const partyBQuota = await checkQuota(
        caseData.party_b_id,
        caseData.party_b_ip ?? null
    );

    if (!partyBQuota.can_use) {
        return {
            canProceed: false,
            blockedParty: 'party_b',
            message: caseData.party_b_id
                ? 'You have used all your verdicts for today'
                : 'You must sign in to submit your response'
        };
    }

    return { canProceed: true, blockedParty: null, message: 'OK' };
}