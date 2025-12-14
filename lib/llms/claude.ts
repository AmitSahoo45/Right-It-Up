import Anthropic from "@anthropic-ai/sdk";
import { buildUserPrompt, buildSystemPrompt } from "@/utils/helper";
import { Dispute, DisputeCategory, VerdictTone } from "@/types";

export const generateVerdictFromAnthropic = async (
    dispute: Dispute,
    category: DisputeCategory = 'general',
    tone: VerdictTone = 'neutral'
) => {
    try {
        const client = new Anthropic();
        const userPrompt = buildUserPrompt(dispute);
        const systemPrompt = buildSystemPrompt(category, tone);

        const response = await client.messages.create({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating verdict from Anthropic:", error);
        throw error;
    }
};