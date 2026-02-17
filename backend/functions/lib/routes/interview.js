"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
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
        const generateWithRetry = async (retries = 3, delay = 1000) => {
            var _a, _b;
            try {
                return await (0, ai_1.generateObject)({
                    model: (0, google_1.google)("gemini-2.5-flash"),
                    schema: zod_1.z.object({
                        questions: zod_1.z.array(zod_1.z.string()),
                    }),
                    prompt: `
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
                         Avoid utilizing special characters like * or / that might confuse the TTS.`}
                    
                    Return a list of questions/problems.
                  `,
                });
            }
            catch (error) {
                if (retries > 0 && (((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("429")) || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("Quota")))) {
                    console.log(`Rate limit hit, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };
        const result = await generateWithRetry();
        res.json({ questions: result.object.questions });
    }
    catch (error) {
        console.error("Generation Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: `Failed to generate questions: ${errorMessage}` });
    }
});
exports.default = router;
//# sourceMappingURL=interview.js.map