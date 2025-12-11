import { generateVerdictFromAnthropic } from "./llms/claude";
import { generateVerdictFromGemini } from "./llms/gemini";
import { generateVerdictFromGroq } from "./llms/groq";

export const generateVerdict = async ({
    dispute,
    provider = 'gemini',
    category = 'general',
    tone = 'neutral'
}: GenerateVerdictOptions) => {
    switch (provider) {
        case 'gemini':
            return generateVerdictFromGemini(dispute, category, tone);
        case 'anthropic':
            return generateVerdictFromAnthropic(dispute, category, tone);
        case 'groq':
            return generateVerdictFromGroq(dispute, category, tone);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}

let callCount = 0;
export async function generateVerdictBalanced({
    dispute,
    category = 'general',
    tone = 'neutral'
}: Omit<GenerateVerdictOptions, 'provider'>) {
    const providers: AIProvider[] = ['gemini', 'groq', 'anthropic'];
    const provider = providers[callCount % providers.length];
    callCount++;
    return generateVerdict({ dispute, provider, category, tone });
}