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