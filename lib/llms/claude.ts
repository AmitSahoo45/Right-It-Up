import Anthropic from "@anthropic-ai/sdk";


import { buildUserPrompt } from "@/utils/helper";

export const generateVerdictFromAnthropic = async (dispute: Dispute) => {
    try {
        const client = new Anthropic();

        const userPrompt = buildUserPrompt(dispute);

        const response = await client.messages.create({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 2000,
            system: JUDGE_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating verdict from Anthropic:", error);
        throw error;
    }
}