"use server";

import { DEFAULT_AI_MODEL } from '@/constants/ai';
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants/interview";

interface GenerateFeedbackParams {
    transcript: { role: string; content: string }[];
}

export async function generateFeedbackAction(params: GenerateFeedbackParams) {
    const { transcript } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const generateWithRetry = async (retries = 3, delay = 1000) => {
            try {
                return await generateObject({
                    model: google(DEFAULT_AI_MODEL), // Fallback to standard 1.0 Pro
                    schema: feedbackSchema,
                    prompt: `
            You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
            Transcript:
            ${formattedTranscript}
    
            Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
            - **Communication Skills**: Clarity, articulation, structured responses.
            - **Technical Knowledge**: Understanding of key concepts for the role.
            - **Problem-Solving**: Ability to analyze problems and propose solutions.
            - **Cultural & Role Fit**: Alignment with company values and job role.
            - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
            `,
                    system:
                        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
                });
            } catch (error: any) {
                if (retries > 0 && (error?.message?.includes('429') || error?.message?.includes('Quota'))) {
                    console.log(`Rate limit hit (feedback), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const { object } = await generateWithRetry();

        return { success: true, feedback: object };
    } catch (error) {
        console.error("Error generating feedback:", error);
        return { success: false, error: "Failed to generate feedback" };
    }
}
