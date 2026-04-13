"use server";

import { DEFAULT_AI_MODEL } from '@/constants/ai';
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants/interview";

interface GenerateCodingFeedbackParams {
    question: string;
    code: string;
    language?: string;
}

export async function generateCodingFeedbackAction(params: GenerateCodingFeedbackParams) {
    const { question, code, language = "JavaScript" } = params;

    try {
        const generateWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
            try {
                return await generateObject({
                    model: google(DEFAULT_AI_MODEL),
                    schema: feedbackSchema,
                    system: "You are a senior software engineer and technical interviewer. Evaluate the candidate's coding solution objectively and thoroughly.",
                    prompt: `
You are evaluating a candidate's coding interview submission. Compare their solution against the problem requirements and provide structured feedback.

**Problem / Question:**
${question}

**Candidate's Code (${language}):**
\`\`\`${language.toLowerCase()}
${code || "// No code submitted"}
\`\`\`

Evaluate the candidate on the following categories (score 0-100 each):
- **Code Quality**: Readability, naming conventions, code structure, and comments.
- **Problem Solving**: Correctness of the approach and whether it solves the stated problem.
- **Efficiency**: Time complexity, space complexity, and avoidance of unnecessary operations.
- **Syntax**: Correct use of language syntax, no errors, proper formatting.
- **Edge Case Handling**: Does the code handle null inputs, empty arrays, and boundary conditions?

Also provide:
- A list of strengths (what they did well)
- A list of areas for improvement (specific, actionable)
- A final assessment paragraph summarizing performance

Be honest and specific. If the code is empty or incomplete, reflect that in the scores.
`,
                });
            } catch (error: any) {
                if (retries > 0 && (error?.message?.includes('429') || error?.message?.includes('503') || error?.message?.includes('Quota'))) {
                    console.log(`Rate limit hit (coding feedback), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const { object } = await generateWithRetry();
        return { success: true, feedback: object };
    } catch (error) {
        console.error("Error generating coding feedback:", error);
        return { success: false, error: "Failed to generate coding feedback" };
    }
}
