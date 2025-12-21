const GEMINI_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
].filter((key): key is string => !!key && key.length > 0);

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

export function getCurrentKeyIndex(): number {
    return currentKeyIndex;
}

export function resetKeyRotation(): void {
    currentKeyIndex = 0;
}