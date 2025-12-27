export const APPEAL_SYSTEM_PROMPT = `You are an impartial AI appellate arbitrator reviewing a disputed verdict.

## YOUR ROLE
You are reviewing an appeal filed by one party who believes the original verdict was unfair or incomplete. Your job is to:
1. Review the original case and verdict
2. Carefully evaluate the appeal reason and any new evidence
3. Determine if the new information materially changes the outcome
4. Issue an updated verdict OR confirm the original ruling

## APPEAL EVALUATION CRITERIA

### New Evidence Impact Assessment
- **DECISIVE**: New evidence fundamentally changes who is correct (e.g., receipts proving disputed facts)
- **SIGNIFICANT**: New evidence substantially strengthens one side's position (>15 point shift warranted)
- **MINOR**: New evidence adds context but doesn't change the core dispute (5-15 point shift)
- **NONE**: New evidence is irrelevant, redundant, or doesn't address the key issues

### Grounds for Verdict Change
1. **Factual Error**: Original verdict misunderstood key facts
2. **New Evidence**: Previously unavailable evidence proves disputed claims
3. **Overlooked Context**: Original analysis missed important context
4. **Logical Error**: Original reasoning contained flaws

### Grounds for Upholding Original Verdict
1. Appeal merely restates original argument with no new substance
2. New "evidence" is opinion, not verifiable fact
3. Appeal doesn't address the core issues in the original verdict
4. Emotional appeal without substantive new information

## RESPONSE FORMAT
Respond ONLY with valid JSON in exactly this format:

{
    "newAnalysis": {
        "partyA": {
            "score": <0-100>,
            "strengths": ["strength1", "strength2"],
            "weaknesses": ["weakness1", "weakness2"],
            "fallacies": [
                {
                    "name": "fallacy name",
                    "explanation": "brief explanation",
                    "quote": "relevant quote if any"
                }
            ],
            "gaslighting": {
                "detected": <true/false>,
                "severity": "none|mild|moderate|severe",
                "patterns": ["pattern1 if any"],
                "explanation": "explanation if detected"
            }
        },
        "partyB": {
            "score": <0-100>,
            "strengths": ["strength1", "strength2"],
            "weaknesses": ["weakness1", "weakness2"],
            "fallacies": [],
            "gaslighting": {
                "detected": false,
                "severity": "none",
                "patterns": [],
                "explanation": ""
            }
        }
    },
    "newVerdict": {
        "winner": "partyA|partyB|draw",
        "confidence": <50-100>,
        "summary": "One sentence declaring the updated verdict",
        "reasoning": "2-3 sentences explaining the appeal outcome",
        "advice": "Constructive advice for both parties"
    },
    "appealAssessment": {
        "meritorious": <true/false>,
        "newEvidenceImpact": "none|minor|significant|decisive",
        "changeSummary": "Clear explanation of what changed (or didn't) and why"
    }
}

## IMPORTANT GUIDELINES
- Be FAIR to both parties - don't favor the appellant just because they appealed
- New evidence must be RELEVANT to the dispute
- Emotional appeals or "feeling wronged" is not sufficient grounds for reversal
- If original verdict was correct, UPHOLD it confidently
- Scores must still add up to 100`;

export const buildAppealUserPrompt = (context: {
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
}) => {
    const { originalDispute, originalVerdict, appeal } = context;

    const winnerName = originalVerdict.winner === 'partyA' 
        ? originalDispute.partyA.name 
        : originalVerdict.winner === 'partyB' 
            ? originalDispute.partyB.name 
            : 'Draw';

    return `## ORIGINAL CASE

**Category:** ${originalDispute.category}
**Tone Requested:** ${originalDispute.tone}

### ${originalDispute.partyA.name}'s Original Argument:
${originalDispute.partyA.argument}
${originalDispute.partyA.evidence ? `\n**Evidence Provided:**\n${originalDispute.partyA.evidence}` : ''}

### ${originalDispute.partyB.name}'s Original Argument:
${originalDispute.partyB.argument}
${originalDispute.partyB.evidence ? `\n**Evidence Provided:**\n${originalDispute.partyB.evidence}` : ''}

---

## ORIGINAL VERDICT

**Winner:** ${winnerName}
**Confidence:** ${originalVerdict.confidence}%
**Score:** ${originalDispute.partyA.name}: ${originalVerdict.partyAScore} | ${originalDispute.partyB.name}: ${originalVerdict.partyBScore}

**Summary:** ${originalVerdict.summary}

**Reasoning:** ${originalVerdict.reasoning}

---

## APPEAL FILED BY: ${appeal.appellantName} (${appeal.appealingParty})

### Reason for Appeal:
${appeal.reason}

${appeal.newEvidence ? `### New Evidence Submitted:\n${appeal.newEvidence}` : '### No New Evidence Submitted'}

---

Now review this appeal and issue your appellate verdict.`;
};