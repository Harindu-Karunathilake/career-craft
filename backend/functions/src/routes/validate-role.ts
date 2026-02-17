import { Router } from "express";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "Configuration Error" });
            return;
        }

        const { role } = req.body;

        if (!role) {
            res.status(400).json({ error: "Role is required" });
            return;
        }

        const generateWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
            try {
                return await generateObject({
                    model: google("gemini-2.5-flash"),
                    schema: z.object({
                        isValid: z.boolean(),
                        message: z.string(),
                    }),
                    prompt: `
            Analyze the job role: "${role}".
            Determine if this job role is a valid and recognized role within the Information Technology (IT), Software Engineering, Data Science, or tech industry.
            Strictly reject clearly non-technical roles unless tech-related (e.g. "Project Manager").
            Return 'isValid' (boolean) and 'message' (string).
          `,
                });
            } catch (error: any) {
                if (retries > 0 && (error?.message?.includes("429") || error?.message?.includes("Quota"))) {
                    console.log(`Rate limit hit (validation), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const result = await generateWithRetry();

        res.json(result.object);

    } catch (error) {
        console.error("Validation Error:", error);
        // Fail open
        res.json({
            isValid: true,
            message: "Validation service unavailable, proceeding with caution."
        });
    }
});

export default router;
