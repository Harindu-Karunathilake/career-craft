import { Router } from "express";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const router = Router();

// Define schema outside to avoid deep type instantiation error
const schema: z.ZodSchema<{ questions: string[] }> = z.object({
    questions: z.array(z.string()),
});


router.post("/generate", async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "Configuration Error" });
            return;
        }

        const { role, experience, topic, type, questionCount, interviewMode } = req.body;
        console.log("API /generate RECEIVED:", { role, type, interviewMode });


        // Retry logic for rate limits
        const generateWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
            try {
                const prompt: string = `
                    Prepare ${questionCount} ${interviewMode === "coding" ? "coding problems" : (type || "technical") + " interview questions"} for a ${role} position.
                    Experience Level: ${experience}.
                    Focus Topic: ${topic}.
                    
                    ${type === "coding" || interviewMode === "coding" ?
                        `IMPORTANT: The user has selected a LIVE CODING ASSESSMENT. 
                         Generate ${questionCount} strictly practical CODING CHALLENGES.
                         
                         CRITICAL RULES:
                         1. EVERY question must start with "Write a function...", "Create a component...", or "Implement...".
                         2. Do NOT ask "Explain..." or "What is..." questions.
                         3. Output PURE PROBLEM STATEMENTS.
                         
                         Example Format: "Write a function that flattens a nested array of integers."
                         
                         Forbidden Phrasing: "How would you...", "Explain the difference...", "Describe..."`
                        :
                        `The questions will be read by a voice assistant, so keep them concise and conversational.
                         Avoid utilizing special characters like * or / that might confuse the TTS.`
                    }
                    
                    Return a list of questions/problems.
                  `;

                return await generateObject({
                    model: google("gemini-2.5-flash"),
                    schema,
                    prompt,
                });
            } catch (error: any) {
                if (retries > 0 && (error?.message?.includes("429") || error?.message?.includes("Quota"))) {
                    console.log(`Rate limit hit, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const result = await generateWithRetry();

        res.json({ questions: result.object.questions });

    } catch (error: any) {
        console.error("Generation Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to generate questions: ${errorMessage}` });
    }
});

export default router;
