import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "@/utils/helper";
import { Dispute, DisputeCategory, VerdictTone } from "@/types";
import { getNextKey, rotateToNextKey, getTotalKeys } from "./gemini-keys";

// Fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10000) 
        });

        if (!response.ok) {
            console.warn(`Failed to fetch image: ${url} - Status: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const mimeType = validMimeTypes.find(t => contentType.includes(t)) || 'image/jpeg';

        return { base64, mimeType };
    } catch (error) {
        console.warn(`Error fetching image ${url}:`, (error as Error).message);
        return null;
    }
}

// Build multimodal content for Gemini with images
async function buildMultimodalContent(
    dispute: Dispute,
    systemPrompt: string,
    partyAImages: string[],
    partyBImages: string[]
): Promise<Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>> {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    let textContent = `${systemPrompt}

## Dispute Category: ${dispute.category}

## ${dispute.partyA.name}'s Argument:
${dispute.partyA.argument}
${dispute.partyA.evidence?.length ? `\nText Evidence:\n${dispute.partyA.evidence.filter(e => !e.startsWith('[Image:')).map((e, i) => `${i + 1}. ${e}`).join("\n")}` : ""}
`;

    if (partyAImages.length > 0) {
        textContent += `\n${dispute.partyA.name} provided ${partyAImages.length} image(s) as evidence:\n`;
        parts.push({ text: textContent });
        textContent = ""; // Reset for next text block

        for (let i = 0; i < partyAImages.length; i++) {
            const imageData = await fetchImageAsBase64(partyAImages[i]);
            if (imageData) {
                parts.push({ text: `\n[${dispute.partyA.name}'s Evidence Image ${i + 1}]:` });
                parts.push({
                    inlineData: {
                        mimeType: imageData.mimeType,
                        data: imageData.base64
                    }
                });
            } else {
                parts.push({ text: `\n[${dispute.partyA.name}'s Evidence Image ${i + 1}: Failed to load]` });
            }
        }
    }

    textContent += `

## ${dispute.partyB.name}'s Argument:
${dispute.partyB.argument}
${dispute.partyB.evidence?.length ? `\nText Evidence:\n${dispute.partyB.evidence.filter(e => !e.startsWith('[Image:')).map((e, i) => `${i + 1}. ${e}`).join("\n")}` : ""}
`;

    if (partyBImages.length > 0) {
        textContent += `\n${dispute.partyB.name} provided ${partyBImages.length} image(s) as evidence:\n`;
        parts.push({ text: textContent });
        textContent = ""; 

        for (let i = 0; i < partyBImages.length; i++) {
            const imageData = await fetchImageAsBase64(partyBImages[i]);
            if (imageData) {
                parts.push({ text: `\n[${dispute.partyB.name}'s Evidence Image ${i + 1}]:` });
                parts.push({
                    inlineData: {
                        mimeType: imageData.mimeType,
                        data: imageData.base64
                    }
                });
            } else {
                parts.push({ text: `\n[${dispute.partyB.name}'s Evidence Image ${i + 1}: Failed to load]` });
            }
        }
    }

    // Final instructions
    textContent += `

## Important Instructions for Image Analysis:
- Carefully examine ALL uploaded images as they contain crucial evidence
- Extract and consider any text, screenshots, receipts, or chat messages visible in the images
- Reference specific details from images in your analysis when relevant
- If an image shows a conversation/chat, analyze the tone, context, and content
- Treat image evidence with the same weight as written arguments

Analyze this dispute and render your verdict as JSON.`;

    if (textContent.trim()) {
        parts.push({ text: textContent });
    }

    return parts;
}

export interface GenerateVerdictWithImagesOptions {
    dispute: Dispute;
    category?: DisputeCategory;
    tone?: VerdictTone;
    partyAImages?: string[];
    partyBImages?: string[];
}

export const generateVerdictFromGemini = async (
    dispute: Dispute,
    category: DisputeCategory = 'general',
    tone: VerdictTone = 'neutral',
    partyAImages: string[] = [],
    partyBImages: string[] = []
) => {
    const totalKeys = getTotalKeys();
    let lastError: Error | null = null;

    // Check if we have images to process
    const hasImages = partyAImages.length > 0 || partyBImages.length > 0;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
        const apiKey = attempt === 0 ? getNextKey() : rotateToNextKey();

        try {
            const genAI = new GoogleGenAI({ apiKey });
            const systemPrompt = buildSystemPrompt(category, tone);

            let contents: string | Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;

            if (hasImages) {
                console.log(`Processing ${partyAImages.length} Party A images and ${partyBImages.length} Party B images`);
                contents = await buildMultimodalContent(dispute, systemPrompt, partyAImages, partyBImages);
            } else {
                contents = buildTextOnlyPrompt(dispute, systemPrompt);
            }

            const results = await genAI.models.generateContent({
                model: "gemini-2.5-flash",
                config: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                },
                contents: contents
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

function buildTextOnlyPrompt(dispute: Dispute, systemPrompt: string): string {
    return `${systemPrompt}
        
## Dispute Category: ${dispute.category}

## ${dispute.partyA.name}'s Argument:
${dispute.partyA.argument}
${dispute.partyA.evidence?.length ? `\nEvidence:\n${dispute.partyA.evidence.map((e, i) => `${i + 1}. ${e}`).join("\n")}` : ""}

## ${dispute.partyB.name}'s Argument:
${dispute.partyB.argument}
${dispute.partyB.evidence?.length ? `\nEvidence:\n${dispute.partyB.evidence.map((e, i) => `${i + 1}. ${e}`).join("\n")}` : ""}

Analyze this dispute and render your verdict as JSON.`;
}