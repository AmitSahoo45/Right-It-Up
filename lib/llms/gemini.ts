import { GoogleGenAI } from "@google/genai";
import { buildUserPrompt, buildSystemPrompt } from "@/utils/helper";
import { Dispute, DisputeCategory, VerdictTone } from "@/types";

const genAI = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_API_GEMINI_ITS!
});

export const generateVerdictFromGemini = async (
    dispute: Dispute,
    category: DisputeCategory = 'general',
    tone: VerdictTone = 'neutral'
) => {
    try {
        const systemPrompt = buildSystemPrompt(category, tone);
        const userPrompt = buildUserPrompt(dispute, true, systemPrompt);

        const results = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            },
            contents: userPrompt
        });

        const aiResponseText = results.text;
        
        if (!aiResponseText)
            throw new Error("Empty response from Gemini");

        const aiResponse = JSON.parse(aiResponseText);

        return aiResponse;
    } catch (error) {
        console.error("Error generating verdict from Gemini:", error);
        throw error;
    }
};