interface Dispute {
    category: string;
    partyA: { name: string; argument: string; evidence?: string[] };
    partyB: { name: string; argument: string; evidence?: string[] };
}

interface NavbarProps {
    user: User | null
}

type AIProvider = 'anthropic' | 'groq' | 'gemini';