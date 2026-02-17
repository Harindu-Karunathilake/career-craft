"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
const zod_1 = require("zod");
const admin = require("firebase-admin");
const encryption_1 = require("../lib/encryption");
const pdf_1 = require("../lib/pdf");
const router = (0, express_1.Router)();
const db = admin.firestore();
const storage = admin.storage();
const RecommendationSchema = zod_1.z.object({
    courseId: zod_1.z.string(),
    reason: zod_1.z.string(),
    matchScore: zod_1.z.number().min(0).max(100),
});
const ResponseSchema = zod_1.z.object({
    recommendations: zod_1.z.array(RecommendationSchema),
});
router.post("/", async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "Configuration Error", details: "Missing AI API Key" });
            return;
        }
        const { resumeId, userId, interviewHistory } = req.body;
        if (!resumeId || !userId) {
            res.status(400).json({ error: "Bad Request", details: "Missing resumeId or userId" });
            return;
        }
        // 1. Fetch Resume Metadata
        const resumeDoc = await db.collection("users").doc(userId).collection("resumes").doc(resumeId).get();
        if (!resumeDoc.exists) {
            res.status(404).json({ error: "Not Found", details: "Resume document not found" });
            return;
        }
        const resumeData = resumeDoc.data();
        const storagePath = (resumeData === null || resumeData === void 0 ? void 0 : resumeData.resumeUrl) || (resumeData === null || resumeData === void 0 ? void 0 : resumeData.fileUrl) || (resumeData === null || resumeData === void 0 ? void 0 : resumeData.storagePath);
        if (!storagePath) {
            res.status(500).json({ error: "Data Error", details: "Resume file path missing in database" });
            return;
        }
        // 2. Download Encrypted File
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (!exists) {
            res.status(404).json({ error: "Not Found", details: `File not found in storage: ${storagePath}` });
            return;
        }
        const [fileBuffer] = await file.download();
        const decryptedBuffer = await (0, encryption_1.decryptBuffer)(fileBuffer);
        const resumeText = await (0, pdf_1.extractTextFromBuffer)(decryptedBuffer);
        // 3. Fetch Available Courses
        const coursesSnap = await db.collection("courses").where("published", "==", true).get();
        const availableCourses = coursesSnap.docs.map(doc => {
            var _a;
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                sections: ((_a = data.chapters) === null || _a === void 0 ? void 0 : _a.map((c) => c.title).join(", ")) || ""
            };
        });
        if (availableCourses.length === 0) {
            res.json({ recommendations: [] });
            return;
        }
        // 4. Format History
        const interviewContext = interviewHistory && Array.isArray(interviewHistory)
            ? interviewHistory.map((i) => { var _a; return `- Role: ${i.role}, Topic: ${i.topic}, Score: ${i.averageScore || "N/A"}/100. Weaknesses: ${((_a = i.weaknesses) === null || _a === void 0 ? void 0 : _a.join(", ")) || "None listed"}`; }).join("\n")
            : "No interview history provided.";
        // 5. Generate Recommendations
        const prompt = `
    You are an expert career counselor.
    CANDIDATE PROFILE:
    RESUME SUMMARY: ${resumeText.slice(0, 3000)} ...
    INTERVIEW HISTORY: ${interviewContext}
    AVAILABLE COURSES: ${JSON.stringify(availableCourses, null, 2)}
    TASK: Select top 3 courses. Prioritize based on weaknesses and skills.
    Return JSON with "recommendations".
    `;
        const result = await (0, ai_1.generateObject)({
            model: (0, google_1.google)("gemini-2.5-flash"),
            prompt: prompt,
            schema: ResponseSchema,
        });
        res.json(result.object);
    }
    catch (error) {
        console.error("Recommendation API Error:", error);
        res.status(500).json({ error: error.message, details: error.stack });
    }
});
exports.default = router;
//# sourceMappingURL=recommendations.js.map