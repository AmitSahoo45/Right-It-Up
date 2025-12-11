export function buildUserPrompt(dispute: Dispute): string {
    return `
        ## Dispute Category: ${dispute.category}

        ## ${dispute.partyA.name}'s Argument:
        ${dispute.partyA.argument}
        ${dispute.partyA.evidence?.length ? `\nEvidence:\n${dispute.partyA.evidence.map((e, i) => `${i + 1}. ${e}`).join("\n")}` : ""}

        ## ${dispute.partyB.name}'s Argument:
        ${dispute.partyB.argument}
        ${dispute.partyB.evidence?.length ? `\nEvidence:\n${dispute.partyB.evidence.map((e, i) => `${i + 1}. ${e}`).join("\n")}` : ""}

        Analyze this dispute and render your verdict as JSON.`;
}

export function buildSystemPrompt(category: DisputeCategory = 'general', tone: VerdictTone = 'neutral'): string {
    const persona = JUDGE_PERSONAS[category] || JUDGE_PERSONAS.general;
    const toneModifier = TONE_MODIFIERS[tone] || TONE_MODIFIERS.neutral;

    let systemPrompt = JUDGE_SYSTEM_PROMPT;

    if (persona.systemAddendum) 
        systemPrompt += `\n\n## Specialization: ${persona.name} ${persona.icon}\n${persona.systemAddendum}`;

    systemPrompt += `\n${toneModifier}`;

    return systemPrompt;
}

export function getCaseId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `WR-${year}-${random}`;
}

export function formatDate(date: Date = new Date()): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}