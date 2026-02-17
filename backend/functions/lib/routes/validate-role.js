"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
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
        const generateWithRetry = async (retries = 3, delay = 1000) => {
            var _a, _b;
            try {
                return await (0, ai_1.generateObject)({
                    model: (0, google_1.google)("gemini-2.5-flash"),
                    schema: zod_1.z.object({
                        isValid: zod_1.z.boolean(),
                        message: zod_1.z.string(),
                    }),
                    prompt: `
            Analyze the job role: "${role}".
            Determine if this job role is a valid and recognized role within the Information Technology (IT), Software Engineering, Data Science, or tech industry.
            Strictly reject clearly non-technical roles unless tech-related (e.g. "Project Manager").
            Return 'isValid' (boolean) and 'message' (string).
          `,
                });
            }
            catch (error) {
                if (retries > 0 && (((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes("429")) || ((_b = error === null || error === void 0 ? void 0 : error.message) === null || _b === void 0 ? void 0 : _b.includes("Quota")))) {
                    console.log(`Rate limit hit (validation), retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };
        const result = await generateWithRetry();
        res.json(result.object);
    }
    catch (error) {
        console.error("Validation Error:", error);
        // Fail open
        res.json({
            isValid: true,
            message: "Validation service unavailable, proceeding with caution."
        });
    }
});
exports.default = router;
//# sourceMappingURL=validate-role.js.map