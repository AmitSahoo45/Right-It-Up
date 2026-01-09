import { User } from '@supabase/supabase-js';

export * from './profile';

// ============================================
// DATABASE TYPES
// ============================================

export type CaseStatus = 'pending_response' | 'blocked_quota' | 'analyzing' | 'complete' | 'expired';
export type AIProvider = 'anthropic' | 'groq' | 'gemini';
export type VerdictTone = 'genz' | 'professional' | 'savage' | 'wholesome' | 'neutral';
export type DisputeCategory = 'relationship' | 'roommate' | 'sports' | 'tech' | 'general';
export type VerdictWinner = 'partyA' | 'partyB' | 'draw';
export type EvidenceQuality = 'strong' | 'moderate' | 'weak' | 'none';
export type GaslightingSeverity = 'none' | 'mild' | 'moderate' | 'severe';

// ============================================
// LOGICAL FALLACY TYPES
// ============================================

export interface DetectedFallacy {
    name: string;
    instance: string;  // Quote or paraphrase showing where fallacy occurred
    impact: string;    // How it weakens their argument
}

// Legacy fallacy type (string array) for backwards compatibility
export type FallacyEntry = string | DetectedFallacy;

// ============================================
// GASLIGHTING DETECTION TYPES
// ============================================

export interface GaslightingAnalysis {
    detected: boolean;
    severity: GaslightingSeverity;
    instances: string[];
    explanation: string;
}

// ============================================
// PARTY ANALYSIS (ENHANCED)
// ============================================

export interface PartyAnalysis {
    strengths: string[];
    weaknesses: string[];
    fallacies: FallacyEntry[];  // Can be string[] (legacy) or DetectedFallacy[]
    gaslighting?: GaslightingAnalysis;
    evidenceQuality?: EvidenceQuality;
    keyEvidence?: string[];
}

export interface SaveVerdictData {
    party_a_score: number;
    party_b_score: number;
    party_a_analysis: PartyAnalysis;
    party_b_analysis: PartyAnalysis;
    winner: 'partyA' | 'partyB' | 'draw';
    confidence: number;
    summary: string;
    reasoning: string;
    advice: string;
    evidence_impact?: string;
    ai_provider: string;
}

export interface Case {
    id: string;
    code: string;
    category: DisputeCategory;
    tone: VerdictTone;
    status: CaseStatus;

    // Party A
    party_a_id: string | null;
    party_a_name: string;
    party_a_argument: string;
    party_a_evidence_text: string[];
    party_a_evidence_images: string[];
    party_a_ip: string | null;

    // Party B
    party_b_id: string | null;
    party_b_name: string | null;
    party_b_argument: string | null;
    party_b_evidence_text: string[];
    party_b_evidence_images: string[];
    party_b_ip: string | null;

    // Timestamps
    created_at: string;
    responded_at: string | null;
    completed_at: string | null;
    expires_at: string;
}

export interface Verdict {
    id: string;
    case_id: string;

    party_a_score: number;
    party_b_score: number;
    party_a_analysis: PartyAnalysis;
    party_b_analysis: PartyAnalysis;

    winner: VerdictWinner;
    confidence: number;
    summary: string;
    reasoning: string;
    advice: string;
    evidence_impact?: string;

    ai_provider: AIProvider;
    receipt_image_url: string | null;
    ruling_image_url: string | null;

    created_at: string;
}

export interface VerdictUsage {
    id: string;
    user_id: string | null;
    guest_ip: string | null;
    case_id: string;
    used_at: string;
}

export interface QuotaCheck {
    can_use: boolean;
    remaining: number;
    used: number;
}

// ============================================
// API TYPES
// ============================================

// Create case request
export interface CreateCaseRequest {
    category: DisputeCategory;
    tone: VerdictTone;
    party_a_name: string;
    party_a_argument: string;
    party_a_evidence_text?: string[];
    party_a_evidence_images?: string[];
}

// Create case response
export interface CreateCaseResponse {
    success: boolean;
    code?: string;
    share_url?: string;
    error?: string;
}

// Respond to case request
export interface RespondCaseRequest {
    party_b_name: string;
    party_b_argument: string;
    party_b_evidence_text?: string[];
    party_b_evidence_images?: string[];
}

// Respond to case response
export interface RespondCaseResponse {
    success: boolean;
    status?: CaseStatus;
    verdict_url?: string;
    error?: string;
    quota_issue?: 'party_a' | 'party_b';
}

// Get case response
export interface GetCaseResponse {
    success: boolean;
    case?: Case;
    verdict?: Verdict;
    error?: string;
    is_party_a?: boolean;
    is_party_b?: boolean;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface NavbarProps {
    user: User | null;
    quota?: QuotaCheck;
}

export interface ToneSelectorProps {
    value: VerdictTone;
    onChange: (tone: VerdictTone) => void;
}

export interface CategorySelectorProps {
    value: DisputeCategory;
    onChange: (category: DisputeCategory) => void;
}

export interface EvidenceUploaderProps {
    textEvidence: string[];
    imageEvidence: string[];
    onTextChange: (evidence: string[]) => void;
    onImageChange: (evidence: string[]) => void;
    minImages?: number;
    maxImages?: number;
}

export interface VerdictReceiptProps {
    caseData: Case;
    verdict: Verdict;
}

export interface VerdictRulingProps {
    caseData: Case;
    verdict: Verdict;
}

// ============================================
// AI/LLM TYPES
// ============================================

export interface Dispute {
    category: string;
    partyA: {
        name: string;
        argument: string;
        evidence?: string[];
    };
    partyB: {
        name: string;
        argument: string;
        evidence?: string[];
    };
    tone?: VerdictTone;
}

export interface VerdictAnalysis {
    partyA: PartyAnalysis & { score: number };
    partyB: PartyAnalysis & { score: number };
}

export interface AIVerdictResponse {
    analysis: VerdictAnalysis;
    verdict: {
        winner: VerdictWinner;
        confidence: number;
        summary: string;
        reasoning: string;
        advice: string;
        evidenceImpact?: string;
    };
}

export interface GenerateVerdictOptions {
    dispute: Dispute;
    provider?: AIProvider;
    category?: DisputeCategory;
    tone?: VerdictTone;
    partyAImages?: string[];
    partyBImages?: string[];
}

// ============================================
// FORM TYPES
// ============================================

export interface CaseFormData {
    category: DisputeCategory;
    tone: VerdictTone;
    name: string;
    argument: string;
    evidenceText: string[];
    evidenceImages: string[];
}

export interface ResponseFormData {
    name: string;
    argument: string;
    evidenceText: string[];
    evidenceImages: string[];
}

// ============================================
// CONSTANTS
// ============================================

export const TONE_OPTIONS: { value: VerdictTone; label: string; icon: string; description: string }[] = [
    { value: 'neutral', label: 'Neutral', icon: '⚖️', description: 'Balanced and clear' },
    { value: 'genz', label: 'GenZ', icon: '💅', description: 'No cap, just facts fr fr' },
    { value: 'professional', label: 'Professional', icon: '👔', description: 'Formal legal style' },
    { value: 'savage', label: 'Savage', icon: '🔥', description: 'Brutal honesty mode' },
    { value: 'wholesome', label: 'Wholesome', icon: '🤗', description: 'Kind and empathetic' },
];

export const CATEGORY_OPTIONS: { value: DisputeCategory; label: string; icon: string; description: string }[] = [
    { value: 'general', label: 'General', icon: '⚖️', description: 'Any dispute' },
    { value: 'relationship', label: 'Relationship', icon: '💕', description: 'Love & dating' },
    { value: 'roommate', label: 'Roommate', icon: '🏠', description: 'Living situations' },
    { value: 'sports', label: 'Sports', icon: '🏆', description: 'Athletic debates' },
    { value: 'tech', label: 'Tech/Gaming', icon: '💻', description: 'Digital disputes' },
];

export const JUDGE_PERSONAS: Record<DisputeCategory, { name: string; icon: string; systemAddendum: string }> = {
    relationship: {
        name: "Dr. Harmony",
        icon: "💕",
        systemAddendum: `You specialize in relationship disputes. Consider:
                        - Emotional labor and communication patterns
                        - Relationship dynamics and fairness
                        - Long-term relationship health over "winning"
                        - Both parties' feelings are valid even if actions aren't`,
    },
    roommate: {
        name: "Judge Flatmate",
        icon: "🏠",
        systemAddendum: `You specialize in roommate/housing disputes. Consider:
                        - Lease agreements and house rules
                        - Shared space etiquette norms
                        - Financial fairness (rent, utilities, shared expenses)
                        - Cleanliness and quiet hours standards`,
    },
    sports: {
        name: "Referee Rex",
        icon: "🏆",
        systemAddendum: `You specialize in sports arguments. Consider:
                        - Official rules of the sport in question
                        - Historical precedents and statistics
                        - Fair play principles
                        - Context of recreational vs professional standards`,
    },
    tech: {
        name: "Silicon Judge",
        icon: "💻",
        systemAddendum: `You specialize in tech/gaming disputes. Consider:
                        - Platform terms of service
                        - Gaming community norms and etiquette
                        - Technical accuracy of claims
                        - Online behavior standards`,
    },
    general: {
        name: "Judge Fairness",
        icon: "⚖️",
        systemAddendum: "",
    },
};

// ============================================
// LOGICAL FALLACIES REFERENCE (Enhanced)
// ============================================

export const LOGICAL_FALLACIES = [
    { name: 'Ad Hominem', description: 'Attacking the person instead of their argument', icon: '👤', severity: 'medium' },
    { name: 'Straw Man', description: 'Misrepresenting someone\'s argument to make it easier to attack', icon: '🎃', severity: 'high' },
    { name: 'Appeal to Emotion', description: 'Using feelings instead of facts to persuade', icon: '😢', severity: 'medium' },
    { name: 'False Dichotomy', description: 'Presenting only two options when more exist', icon: '⚖️', severity: 'medium' },
    { name: 'Slippery Slope', description: 'Claiming one thing will inevitably lead to extreme outcomes', icon: '📉', severity: 'medium' },
    { name: 'Appeal to Authority', description: 'Claiming something is true because an authority said so', icon: '👨‍⚖️', severity: 'low' },
    { name: 'Circular Reasoning', description: 'Using the conclusion as a premise', icon: '🔄', severity: 'high' },
    { name: 'Red Herring', description: 'Introducing irrelevant information to distract', icon: '🐟', severity: 'medium' },
    { name: 'Tu Quoque', description: '"You do it too" - deflecting by accusing the other party', icon: '👉', severity: 'medium' },
    { name: 'Moving Goalposts', description: 'Changing the criteria after being proven wrong', icon: '🥅', severity: 'high' },
    { name: 'Whataboutism', description: 'Deflecting with unrelated counter-accusations', icon: '❓', severity: 'medium' },
    { name: 'DARVO', description: 'Deny, Attack, Reverse Victim and Offender', icon: '🔁', severity: 'critical' },
    { name: 'Guilt-Tripping', description: 'Using guilt as a manipulation tactic', icon: '😔', severity: 'medium' },
    { name: 'Appeal to Tradition', description: 'Arguing something is right because it\'s traditional', icon: '📜', severity: 'low' },
    { name: 'Hasty Generalization', description: 'Making broad conclusions from limited examples', icon: '🏃', severity: 'medium' },
    { name: 'Burden of Proof Shifting', description: 'Demanding others disprove rather than proving the claim', icon: '🎭', severity: 'high' },
] as const;

export type LogicalFallacy = typeof LOGICAL_FALLACIES[number]['name'];

// ============================================
// GASLIGHTING SEVERITY REFERENCE
// ============================================

export const GASLIGHTING_SEVERITY_CONFIG = {
    none: {
        label: 'None Detected',
        color: '#10B981', // green
        icon: '✅',
        description: 'No gaslighting indicators found'
    },
    mild: {
        label: 'Mild',
        color: '#F59E0B', // amber
        icon: '⚠️',
        description: '1-2 isolated instances, possibly poor communication'
    },
    moderate: {
        label: 'Moderate',
        color: '#F97316', // orange
        icon: '🚨',
        description: 'Multiple instances forming a clear pattern'
    },
    severe: {
        label: 'Severe',
        color: '#EF4444', // red
        icon: '🚫',
        description: 'Pervasive manipulation and reality distortion'
    }
} as const;

export const HONEYPOT_FIELD_NAMES = {
    website: '_website_url',
    email: '_contact_email',
    phone: '_phone_number',
    timestamp: '_form_timestamp',
} as const;

 
export interface HoneypotData {
    [HONEYPOT_FIELD_NAMES.website]?: string;
    [HONEYPOT_FIELD_NAMES.email]?: string;
    [HONEYPOT_FIELD_NAMES.phone]?: string;
    [HONEYPOT_FIELD_NAMES.timestamp]?: string;
}

export interface HoneypotValidationResult {
    isBot: boolean;
    reason?: string;
    
    // For logging/analytics
    details: {
        filledHoneypots: string[];
        timingMs: number | null;
        timingValid: boolean;
    };
}

export interface UseVerdictPollingOptions {
    code: string;
    enabled: boolean;
    interval?: number;
    maxAttempts?: number;
}

export interface VerdictStatus {
    status: 'pending_response' | 'analyzing' | 'complete' | 'expired' | 'blocked_quota';
    hasVerdict: boolean;
}