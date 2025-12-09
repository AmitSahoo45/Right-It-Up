interface Dispute {
    category: string;
    partyA: { name: string; argument: string; evidence?: string[] };
    partyB: { name: string; argument: string; evidence?: string[] };
}

type AIProvider = 'anthropic' | 'groq' | 'gemini';