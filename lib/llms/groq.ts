import Groq from "groq-sdk";
import { buildUserPrompt, buildSystemPrompt } from "@/utils/helper";
import { Dispute, DisputeCategory, VerdictTone } from "@/types";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_API_GROQ_KEY! });

export const generateVerdictFromGroq = async (
    dispute: Dispute,
    category: DisputeCategory = 'general',
    tone: VerdictTone = 'neutral'
) => {
    try {
        // const userPrompt = buildUserPrompt(dispute);
        // const systemPrompt = buildSystemPrompt(category, tone);

        // const response = await groq.chat.completions.create({
        //     model: "llama-3.3-70b-versatile",
        //     messages: [
        //         { role: "system", content: systemPrompt },
        //         { role: "user", content: userPrompt }
        //     ],
        //     temperature: 0.7,
        //     response_format: { type: "json_object" }
        // });

        // return JSON.parse(response.choices[0].message.content || "{}");

        return {}; // Placeholder return since Groq SDK usage is commented out
    } catch (error) {
        console.error("Error generating verdict from Groq:", error);
        throw error;
    }
};