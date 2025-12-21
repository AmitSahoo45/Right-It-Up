const GEMINI_KEYS = [
    process.env.NEXT_PUBLIC_API_GEMINI_RAF,
    process.env.NEXT_PUBLIC_API_GEMINI_MIA,
    process.env.NEXT_PUBLIC_API_GEMINI_ITS,
    process.env.NEXT_PUBLIC_API_GEMINI_ASA,
    process.env.NEXT_PUBLIC_API_GEMINI_AKU,
    process.env.NEXT_PUBLIC_API_GEMINI_RLA,
].filter((key): key is string => !!key);

let currentKeyIndex = 0;

export function getNextKey(): string {
    if (GEMINI_KEYS.length === 0) {
        throw new Error('No Gemini API keys configured');
    }
    const key = GEMINI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
    return key;
}

export function rotateToNextKey(): string {
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
    return GEMINI_KEYS[currentKeyIndex];
}

export function getTotalKeys(): number {
    return GEMINI_KEYS.length;
}