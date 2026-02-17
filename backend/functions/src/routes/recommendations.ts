import { Router } from "express";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import * as admin from "firebase-admin";
import { decryptBuffer } from "../lib/encryption";
import { extractTextFromBuffer } from "../lib/pdf";

const router = Router();
const db = admin.firestore();
const storage = admin.storage();

const RecommendationSchema = z.object({
    courseId: z.string(),
    reason: z.string(),
    matchScore: z.number().min(0).max(100),
});

const ResponseSchema = z.object({
    recommendations: z.array(RecommendationSchema),
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
        const storagePath = resumeData?.resumeUrl || resumeData?.fileUrl || resumeData?.storagePath;

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
        const decryptedBuffer = await decryptBuffer(fileBuffer);
        const resumeText = await extractTextFromBuffer(decryptedBuffer);

        // 3. Fetch Available Courses
        const coursesSnap = await db.collection("courses").where("published", "==", true).get();
        const availableCourses = coursesSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                description: data.description,
                sections: data.chapters?.map((c: any) => c.title).join(", ") || ""
            };
        });

        if (availableCourses.length === 0) {
            res.json({ recommendations: [] });
            return;
        }

        // 4. Format History
        const interviewContext = interviewHistory && Array.isArray(interviewHistory)
            ? interviewHistory.map((i: any) =>
                `- Role: ${i.role}, Topic: ${i.topic}, Score: ${i.averageScore || "N/A"}/100. Weaknesses: ${i.weaknesses?.join(", ") || "None listed"}`
            ).join("\n")
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

        const result = await generateObject({
            model: google("gemini-2.5-flash"),
            prompt: prompt,
            schema: ResponseSchema,
        });

        res.json(result.object);

    } catch (error: any) {
        console.error("Recommendation API Error:", error);
        res.status(500).json({ error: error.message, details: error.stack });
    }
});

export default router;
