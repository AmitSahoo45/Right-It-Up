import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "@/utils/helper";
import { Dispute, DisputeCategory, VerdictTone } from "@/types";
import { getNextKey, rotateToNextKey, getTotalKeys } from "./gemini-keys";

const OCR_EXTRACTION_PROMPT = `
## CRITICAL: Image Evidence Analysis Instructions

You are analyzing uploaded images as legal evidence. For EACH image, you MUST:

### 1. TEXT EXTRACTION (OCR)
- Extract ALL visible text from the image verbatim
- For chat screenshots: capture sender names, timestamps, and full message content
- For receipts: extract dates, amounts, item descriptions, merchant names
- For documents: extract headers, body text, signatures, dates
- Preserve the original formatting/structure where meaningful

### 2. IMAGE TYPE DETECTION
Identify and handle these common evidence types:

**Chat Screenshots (WhatsApp, iMessage, SMS, Instagram, etc.):**
- Extract each message with: [Sender] [Time]: "Message content"
- Note who sent what - this is CRITICAL for determining facts
- Capture any reactions, read receipts, or timestamps
- Note if messages appear edited or deleted

**Receipts & Invoices:**
- Date of transaction
- Merchant/vendor name
- Itemized list with prices
- Total amount
- Payment method if visible

**Social Media Posts:**
- Platform identified
- Post content and caption
- Likes/comments/shares counts
- Date posted
- Any visible comments

**Documents & Contracts:**
- Document type/title
- Key clauses or terms
- Signatures present
- Dates

**Photos/Screenshots of Physical Items:**
- Describe what's shown
- Note condition, location, context
- Any visible text or labels

### 3. EVIDENCE WEIGHT ASSESSMENT
For each image, assess:
- Authenticity indicators (does it look genuine or potentially edited?)
- Relevance to the dispute
- Corroboration with text arguments
- Any contradictions with claims made

### 4. OUTPUT FORMAT
For each image, structure your analysis as:
[IMAGE N ANALYSIS]
- Type: [chat/receipt/document/photo/other]
- Extracted Text: "[verbatim text]"
- Key Evidence Points: [bullet points]
- Relevance: [how this supports/contradicts claims]
`;

// ============================================
// IMAGE FETCHING & PROCESSING
// ============================================

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

// ============================================
// MULTIMODAL CONTENT BUILDER WITH OCR
// ============================================

async function buildMultimodalContent(
    dispute: Dispute,
    systemPrompt: string,
    partyAImages: string[],
    partyBImages: string[]
): Promise<Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>> {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    // Start with system prompt and OCR instructions
    let textContent = `${systemPrompt}

${OCR_EXTRACTION_PROMPT}

═══════════════════════════════════════════════════════════════
                        DISPUTE DETAILS
═══════════════════════════════════════════════════════════════

## Dispute Category: ${dispute.category}

## ${dispute.partyA.name}'s Written Argument:
${dispute.partyA.argument}
${dispute.partyA.evidence?.length ? `\nText Evidence Submitted:\n${dispute.partyA.evidence.filter(e => !e.startsWith('[Image:')).map((e, i) => `  ${i + 1}. ${e}`).join("\n")}` : ""}
`;

    // Process Party A images with enhanced context
    if (partyAImages.length > 0) {
        textContent += `

═══════════════════════════════════════════════════════════════
              ${dispute.partyA.name.toUpperCase()}'s IMAGE EVIDENCE (${partyAImages.length} image${partyAImages.length > 1 ? 's' : ''})
═══════════════════════════════════════════════════════════════

IMPORTANT: Extract ALL text from these images. These are submitted by ${dispute.partyA.name} to support their case.
`;
        parts.push({ text: textContent });
        textContent = "";

        for (let i = 0; i < partyAImages.length; i++) {
            const imageData = await fetchImageAsBase64(partyAImages[i]);
            if (imageData) {
                parts.push({ 
                    text: `\n┌─────────────────────────────────────────────────────────────┐
│  ${dispute.partyA.name}'s Evidence Image ${i + 1} of ${partyAImages.length}
│  Analyze this image thoroughly. Extract ALL visible text.
└─────────────────────────────────────────────────────────────┘\n` 
                });
                parts.push({
                    inlineData: {
                        mimeType: imageData.mimeType,
                        data: imageData.base64
                    }
                });
            } else {
                parts.push({ 
                    text: `\n[WARNING] [${dispute.partyA.name}\'s Evidence Image ${i + 1}: Failed to load - Consider this when evaluating evidence completeness]\n` 
                });
            }
        }
    }

    // Party B section
    textContent += `

═══════════════════════════════════════════════════════════════
                    ${dispute.partyB.name.toUpperCase()}'s RESPONSE
═══════════════════════════════════════════════════════════════

## ${dispute.partyB.name}'s Written Argument:
${dispute.partyB.argument}
${dispute.partyB.evidence?.length ? `\nText Evidence Submitted:\n${dispute.partyB.evidence.filter(e => !e.startsWith('[Image:')).map((e, i) => `  ${i + 1}. ${e}`).join("\n")}` : ""}
`;

    // Process Party B images with enhanced context
    if (partyBImages.length > 0) {
        textContent += `

═══════════════════════════════════════════════════════════════
              ${dispute.partyB.name.toUpperCase()}'s IMAGE EVIDENCE (${partyBImages.length} image${partyBImages.length > 1 ? 's' : ''})
═══════════════════════════════════════════════════════════════

IMPORTANT: Extract ALL text from these images. These are submitted by ${dispute.partyB.name} to support their case.
`;
        parts.push({ text: textContent });
        textContent = "";

        for (let i = 0; i < partyBImages.length; i++) {
            const imageData = await fetchImageAsBase64(partyBImages[i]);
            if (imageData) {
                parts.push({ 
                    text: `\n┌─────────────────────────────────────────────────────────────┐
│  ${dispute.partyB.name}'s Evidence Image ${i + 1} of ${partyBImages.length}
│  Analyze this image thoroughly. Extract ALL visible text.
└─────────────────────────────────────────────────────────────┘\n` 
                });
                parts.push({
                    inlineData: {
                        mimeType: imageData.mimeType,
                        data: imageData.base64
                    }
                });
            } else {
                parts.push({ 
                    text: `\n[WARNING] [${dispute.partyB.name}\'s Evidence Image ${i + 1}: Failed to load - Consider this when evaluating evidence completeness]\n` 
                });
            }
        }
    }

    // Final verdict instructions
    textContent += `

═══════════════════════════════════════════════════════════════
                    VERDICT INSTRUCTIONS
═══════════════════════════════════════════════════════════════

## Your Analysis Must Include:

1. **For each image submitted:**
   - Type of image (chat screenshot, receipt, document, photo, etc.)
   - Full text extraction (OCR) - BE THOROUGH
   - How the extracted content supports or contradicts each party's claims

2. **Cross-reference image evidence with written arguments:**
   - Do the screenshots confirm what was claimed?
   - Are there contradictions between images and statements?
   - Does one party's evidence disprove the other's claims?

3. **Evidence-based verdict:**
   - Weight image evidence heavily - it's harder to fabricate than written claims
   - Note if either party lacks supporting evidence for key claims
   - Identify if screenshots show different context than described

## CRITICAL REMINDERS:
- Extract EVERY piece of text from chat screenshots - who said what matters!
- Timestamps in screenshots can prove or disprove claims about "when"
- Screenshots showing read receipts/delivery status are meaningful
- If an image clearly contradicts a written claim, this is MAJOR evidence

Now analyze this dispute thoroughly and render your verdict as JSON.`;

    if (textContent.trim()) {
        parts.push({ text: textContent });
    }

    return parts;
}

// ============================================
// TEXT-ONLY PROMPT (No Images)
// ============================================

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

// ============================================
// MAIN VERDICT GENERATION
// ============================================

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

    const hasImages = partyAImages.length > 0 || partyBImages.length > 0;

    for (let attempt = 0; attempt < totalKeys; attempt++) {
        const apiKey = attempt === 0 ? getNextKey() : rotateToNextKey();

        try {
            const genAI = new GoogleGenAI({ apiKey });
            const systemPrompt = buildSystemPrompt(category, tone);

            let contents: string | Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;

            if (hasImages) {
                console.log(`[OCR] Processing ${partyAImages.length} Party A images and ${partyBImages.length} Party B images with enhanced OCR`);
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