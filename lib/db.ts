import { createClient } from '@/utils/supabase/server';
import type {
    Case,
    Verdict,
    QuotaCheck,
    CreateCaseRequest,
    RespondCaseRequest,
    CaseStatus
} from '@/types';

export { getClientIp, formatDate, getTimeRemaining } from './utils';

export const generateCaseCode = async (): Promise<string> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('generate_case_code');

    if (error) throw new Error(`Failed to generate case code: ${error.message}`);
    return data;
}

export const createCase = async (
    data: CreateCaseRequest,
    userId: string | null,
    clientIp: string
): Promise<{ code: string; id: string }> => {
    const supabase = await createClient();
    const code = await generateCaseCode();

    const { data: newCase, error } = await supabase
        .from('cases')
        .insert({
            code,
            category: data.category,
            tone: data.tone,
            party_a_id: userId,
            party_a_name: data.party_a_name,
            party_a_argument: data.party_a_argument,
            party_a_evidence_text: data.party_a_evidence_text || [],
            party_a_evidence_images: data.party_a_evidence_images || [],
            party_a_ip: userId ? null : clientIp,
            status: 'pending_response'
        })
        .select('id, code')
        .single();

    if (error) throw new Error(`Failed to create case: ${error.message}`);
    return newCase;
}

export const getCaseByCode = async (code: string): Promise<Case | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('code', code)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Failed to get case: ${error.message}`);
    }

    return data;
}

export const getCaseWithVerdict = async (code: string): Promise<{ case: Case; verdict: Verdict | null } | null> => {
    const supabase = await createClient();

    const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('code', code)
        .single();

    if (caseError) {
        if (caseError.code === 'PGRST116') return null;
        throw new Error(`Failed to get case: ${caseError.message}`);
    }

    const { data: verdictData } = await supabase
        .from('verdicts')
        .select('*')
        .eq('case_id', caseData.id)
        .single();

    return { case: caseData, verdict: verdictData || null };
}

export const submitResponse = async (
    caseId: string,
    data: RespondCaseRequest,
    userId: string | null,
    clientIp: string
): Promise<void> => {
    const supabase = await createClient();

    const { error } = await supabase
        .from('cases')
        .update({
            party_b_id: userId,
            party_b_name: data.party_b_name,
            party_b_argument: data.party_b_argument,
            party_b_evidence_text: data.party_b_evidence_text || [],
            party_b_evidence_images: data.party_b_evidence_images || [],
            party_b_ip: userId ? null : clientIp,
            responded_at: new Date().toISOString()
        })
        .eq('id', caseId)
        .eq('status', 'pending_response');

    if (error) throw new Error(`Failed to submit response: ${error.message}`);
}

export async function updateCaseStatus(caseId: string, status: CaseStatus): Promise<void> {
    const supabase = await createClient();

    // ============================================
    // OLD WAY - kept for reference
    // const updateData: Partial<Case> = { status };
    // if (status === 'complete') {
    //     updateData.completed_at = new Date().toISOString();
    // }

    // const { error } = await supabase
    //     .from('cases')
    //     .update(updateData)
    //     .eq('id', caseId);
    // ============================================

    const { error } = await supabase.rpc('update_case_status', {
        p_case_id: caseId,
        p_status: status
    });

    if (error) throw new Error(`Failed to update case status: ${error.message}`);
}

// ============================================
// VERDICT OPERATIONS
// ============================================

export const saveVerdict = async (
    caseId: string,
    verdictData: Omit<Verdict, 'id' | 'case_id' | 'created_at' | 'receipt_image_url' | 'ruling_image_url'>
): Promise<Verdict> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('verdicts')
        .insert({
            case_id: caseId,
            ...verdictData
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

export const checkGuestQuota = async (ip: string): Promise<QuotaCheck> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('check_guest_quota', { p_ip: ip });

    if (error) throw new Error(`Failed to check guest quota: ${error.message}`);

    return data[0] || { can_use: false, remaining: 0, used: 1 };
}

export const checkQuota = async (userId: string | null, ip: string): Promise<QuotaCheck> => {
    if (userId) {
        return checkUserQuota(userId);
    }
    return checkGuestQuota(ip);
}


export const recordUsage = async (
    caseId: string,
    userId: string | null,
    ip: string
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
        caseData.party_a_ip || ''
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
        caseData.party_b_ip || ''
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