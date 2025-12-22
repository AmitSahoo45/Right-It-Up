import { AIProvider, GenerateVerdictOptions, Dispute, DisputeCategory, VerdictTone } from "@/types";
import { generateVerdictFromAnthropic } from "./llms/claude";
import { generateVerdictFromGemini } from "./llms/gemini";
import { generateVerdictFromGroq } from "./llms/groq";

export interface GenerateVerdictWithImagesOptions extends GenerateVerdictOptions {
    partyAImages?: string[];
    partyBImages?: string[];
}

export const generateVerdict = async ({
    dispute,
    provider = 'gemini',
    category = 'general',
    tone = 'neutral',
    partyAImages = [],
    partyBImages = []
}: GenerateVerdictWithImagesOptions) => {
    const cleanDispute: Dispute = {
        ...dispute,
        partyA: {
            ...dispute.partyA,
            evidence: dispute.partyA.evidence?.filter(e => !e.startsWith('[Image:')) || []
        },
        partyB: {
            ...dispute.partyB,
            evidence: dispute.partyB.evidence?.filter(e => !e.startsWith('[Image:')) || []
        }
    };

    switch (provider) {
        case 'gemini':
            return generateVerdictFromGemini(cleanDispute, category, tone, partyAImages, partyBImages);
        case 'anthropic':
            return generateVerdictFromAnthropic(cleanDispute, category, tone);
        case 'groq':
            return generateVerdictFromGroq(cleanDispute, category, tone);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}

let callCount = 0;
export async function generateVerdictBalanced({
    dispute,
    category = 'general',
    tone = 'neutral',
    partyAImages = [],
    partyBImages = []
}: Omit<GenerateVerdictWithImagesOptions, 'provider'>) {
    const hasImages = partyAImages.length > 0 || partyBImages.length > 0;

    if (hasImages) {
        return generateVerdict({ dispute, provider: 'gemini', category, tone, partyAImages, partyBImages });
    }

    const providers: AIProvider[] = ['gemini', 'groq', 'anthropic'];
    const provider = providers[callCount % providers.length];
    callCount++;
    return generateVerdict({ dispute, provider, category, tone, partyAImages, partyBImages });
}