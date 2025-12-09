import { generateVerdictFromAnthropic } from "./llms/claude";
import { generateVerdictFromGemini } from "./llms/gemini";
import { generateVerdictFromGroq } from "./llms/groq";

export const generateVerdict = async (dispute: Dispute, provider: AIProvider = 'gemini') => {
    switch (provider) {
        case 'gemini':
            return generateVerdictFromGemini(dispute);
        case 'anthropic':
            return generateVerdictFromAnthropic(dispute);
        case 'groq':
            return generateVerdictFromGroq(dispute);

        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}

let callCount = 0;
export async function generateVerdictBalanced(dispute: Dispute) {
    const providers: AIProvider[] = ['anthropic', 'gemini', 'groq'];
    const provider = providers[callCount % providers.length];
    callCount++;
    return generateVerdict(dispute, provider);
}