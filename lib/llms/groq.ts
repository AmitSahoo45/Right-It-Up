import Groq from "groq-sdk";


import { buildUserPrompt } from "@/utils/helper";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_API_GROQ_KEY! });

export const generateVerdictFromGroq = async (dispute: Dispute) => {
    try {
        const userPrompt = buildUserPrompt(dispute);

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: JUDGE_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content || "{}");
    }
    catch (error) {
        console.error("Error generating verdict from Groq:", error);
        throw error;
    }
}