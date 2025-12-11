import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUserPrompt, buildSystemPrompt } from "@/utils/helper";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_GEMINI_RAF!);

export const generateVerdictFromGemini = async (
    dispute: Dispute,
    category: DisputeCategory = 'general',
    tone: VerdictTone = 'neutral'
) => {
    try {
        const systemPrompt = buildSystemPrompt(category, tone);

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });

        const userPrompt = buildUserPrompt(dispute);
        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating verdict from Gemini:", error);
        throw error;
    }
};