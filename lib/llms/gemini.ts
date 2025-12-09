import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUserPrompt } from "@/util/helper";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_GEMINI_RAF!);

export const generateVerdictFromGemini = async (dispute: Dispute) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: JUDGE_SYSTEM_PROMPT
        });

        const userPrompt = buildUserPrompt(dispute);

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonStr);
    }
    catch (error) {
        console.error("Error generating verdict from Gemini:", error);
        throw error;
    }
}