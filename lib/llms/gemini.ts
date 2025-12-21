import { GoogleGenAI } from "@google/genai";
import { buildUserPrompt, buildSystemPrompt } from "@/utils/helper";
import { Dispute, DisputeCategory, VerdictTone } from "@/types";
import { getNextKey, rotateToNextKey, getTotalKeys } from "./gemini-keys";

export const generateVerdictFromGemini = async (
    dispute: Dispute,
    category: DisputeCategory = 'general',
    tone: VerdictTone = 'neutral'
) => {
    const totalKeys = getTotalKeys();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
        const apiKey = attempt === 0 ? getNextKey() : rotateToNextKey();
        
        try {
            const genAI = new GoogleGenAI({ apiKey });
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
            
            if (!aiResponseText) {
                throw new Error("Empty response from Gemini");
            }

            return JSON.parse(aiResponseText);
            
        } catch (error) {
            lastError = error as Error;
            console.warn(`Gemini key ${attempt + 1}/${totalKeys} failed:`, 
                (error as Error).message?.substring(0, 100));
            
            const errorMsg = (error as Error).message?.toLowerCase() || '';
            if (errorMsg.includes('rate') || 
                errorMsg.includes('quota') || 
                errorMsg.includes('429') ||
                errorMsg.includes('resource exhausted')) {
                continue;
            }
            
            continue;
        }
    }

    console.error("All Gemini API keys exhausted");
    throw lastError || new Error("All Gemini API keys failed");
};