export type AppealStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type AppealingParty = 'partyA' | 'partyB';

export interface Appeal {
    id: string;
    case_id: string;
    appealing_party: AppealingParty;
    appellant_id: string | null;
    reason: string;
    new_evidence_text: string | null;
    new_evidence_images: string[];
    original_verdict: AppealVerdictSnapshot;
    original_winner: string;
    original_party_a_score: number;
    original_party_b_score: number;
    appeal_verdict: AppealVerdictSnapshot | null;
    new_winner: string | null;
    new_party_a_score: number | null;
    new_party_b_score: number | null;
    verdict_changed: boolean;
    change_summary: string | null;
    status: AppealStatus;
    created_at: string;
    processed_at: string | null;
}

export interface AppealVerdictSnapshot {
    winner: string;
    confidence: number;
    summary: string;
    reasoning: string;
    advice: string;
    party_a_analysis: PartyAnalysisSnapshot;
    party_b_analysis: PartyAnalysisSnapshot;
}

export interface PartyAnalysisSnapshot {
    score: number;
    strengths: string[];
    weaknesses: string[];
    fallacies?: FallacyDetection[];
    gaslighting?: GaslightingDetection;
}

export interface FallacyDetection {
    name: string;
    explanation: string;
    quote?: string;
}

export interface GaslightingDetection {
    detected: boolean;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    patterns: string[];
    explanation?: string;
}

export interface AppealVerdictResponse {
    newAnalysis: {
        partyA: PartyAnalysisSnapshot;
        partyB: PartyAnalysisSnapshot;
    };
    newVerdict: {
        winner: string;
        confidence: number;
        summary: string;
        reasoning: string;
        advice: string;
    };
    appealAssessment: {
        meritorious: boolean;
        newEvidenceImpact: 'none' | 'minor' | 'significant' | 'decisive';
        changeSummary: string;
    };
}