interface Dispute {
    category: string;
    partyA: { name: string; argument: string; evidence?: string[] };
    partyB: { name: string; argument: string; evidence?: string[] };
    tone?: VerdictTone;
}

interface NavbarProps {
    user: User | null
}

type AIProvider = 'anthropic' | 'groq' | 'gemini';

type VerdictTone = 'genz' | 'professional' | 'savage' | 'wholesome' | 'neutral';

type DisputeCategory = 'relationship' | 'roommate' | 'sports' | 'tech' | 'general';

interface VerdictAnalysis {
    partyA: {
        strengths: string[];
        weaknesses: string[];
        score: number;
        fallacies: string[];
    };
    partyB: {
        strengths: string[];
        weaknesses: string[];
        score: number;
        fallacies: string[];
    };
}

interface Verdict {
    analysis: VerdictAnalysis;
    verdict: {
        winner: 'partyA' | 'partyB' | 'draw';
        confidence: number;
        summary: string;
        reasoning: string;
        advice: string;
    };
}

interface GenerateVerdictOptions {
    dispute: Dispute;
    provider?: AIProvider;
    category?: DisputeCategory;
    tone?: VerdictTone;
}