import { GoogleGenAI } from "@google/genai";
import { getNextKey, rotateToNextKey, getTotalKeys } from "./llms/gemini-keys";
import { APPEAL_SYSTEM_PROMPT, buildAppealUserPrompt } from "@/constants/appealPrompt";
import type { AppealVerdictResponse } from "@/types/appeals";

interface AppealContext {
    originalDispute: {
        category: string;
        tone: string;
        partyA: { name: string; argument: string; evidence?: string };
        partyB: { name: string; argument: string; evidence?: string };
    };
    originalVerdict: {
        winner: string;
        confidence: number;
        summary: string;
        reasoning: string;
        partyAScore: number;
        partyBScore: number;
    };
    appeal: {
        appealingParty: 'partyA' | 'partyB';
        appellantName: string;
        reason: string;
        newEvidence?: string;
    };
}

export const generateAppealVerdict = async (
    context: AppealContext
): Promise<AppealVerdictResponse> => {
    const totalKeys = getTotalKeys();
    let lastError: Error | null = null;

    const userPrompt = buildAppealUserPrompt(context);

    for (let attempt = 0; attempt < totalKeys; attempt++) {
        const apiKey = attempt === 0 ? getNextKey() : rotateToNextKey();

        try {
            const genAI = new GoogleGenAI({ apiKey });

            const results = await genAI.models.generateContent({
                model: "gemini-2.5-flash",
                config: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                },
                contents: `${APPEAL_SYSTEM_PROMPT}\n\n${userPrompt}`
            });

            const aiResponseText = results.text;

            if (!aiResponseText) {
                throw new Error("Empty response from Gemini");
            }

            return parseAppealResponse(aiResponseText);

        } catch (error) {
            lastError = error as Error;
            console.warn(`[Appeal] Gemini key ${attempt + 1}/${totalKeys} failed:`,
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

    console.error("[Appeal] All Gemini API keys exhausted");
    throw lastError || new Error("All Gemini API keys failed");
};

function parseAppealResponse(responseText: string): AppealVerdictResponse {
    let cleaned = responseText.trim();

    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
        const parsed = JSON.parse(cleaned);

        if (!parsed.newAnalysis || !parsed.newVerdict || !parsed.appealAssessment) {
            throw new Error('Missing required fields in appeal response');
        }

        // Ensure scores add up to 100
        const partyAScore = parsed.newAnalysis.partyA?.score || 50;
        const partyBScore = parsed.newAnalysis.partyB?.score || 50;

        if (partyAScore + partyBScore !== 100) {
            const total = partyAScore + partyBScore;
            parsed.newAnalysis.partyA.score = Math.round((partyAScore / total) * 100);
            parsed.newAnalysis.partyB.score = 100 - parsed.newAnalysis.partyA.score;
        }

        // Ensure defaults
        parsed.newAnalysis.partyA.fallacies = parsed.newAnalysis.partyA.fallacies || [];
        parsed.newAnalysis.partyB.fallacies = parsed.newAnalysis.partyB.fallacies || [];
        parsed.newAnalysis.partyA.gaslighting = parsed.newAnalysis.partyA.gaslighting || {
            detected: false, severity: 'none', patterns: [], explanation: ''
        };
        parsed.newAnalysis.partyB.gaslighting = parsed.newAnalysis.partyB.gaslighting || {
            detected: false, severity: 'none', patterns: [], explanation: ''
        };

        return parsed as AppealVerdictResponse;
    } catch (parseError) {
        console.error('[Appeal] Parse error:', parseError, '\nRaw:', cleaned.slice(0, 500));
        throw new Error('Failed to parse appeal verdict response');
    }
}