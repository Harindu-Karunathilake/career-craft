import { Router } from "express";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import * as admin from "firebase-admin";
import { decryptBuffer } from "../lib/encryption";
import { extractTextFromBuffer } from "../lib/pdf";


const router = Router();

// Retrieve Firestore instance
const db = admin.firestore();
const storage = admin.storage();

const SearchParamsSchema = z.object({
    queries: z.array(z.string()).describe("List of 3 distinct high-volume search queries."),
    location: z.string().optional().describe("Location for the job search"),
});

const RankedJobSchema = z.object({
    id: z.union([z.string(), z.number()]),
    reason: z.string(),
    matchScore: z.number().min(0).max(100),
});

const RankingResponseSchema = z.object({
    recommendations: z.array(RankedJobSchema),
});

router.post("/", async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const findWorkKey = process.env.FINDWORK_API_KEY;

        if (!apiKey || !findWorkKey) {
            res.status(500).json({ error: "Configuration Error", details: "Missing API Keys" });
            return;
        }

        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ error: "Bad Request", details: "Missing userId" });
            return;
        }

        // 1. Fetch Latest Resume
        const resumesRef = db.collection("users").doc(userId).collection("resumes");
        const resumeSnapshot = await resumesRef.orderBy("createdAt", "desc").limit(1).get();

        if (resumeSnapshot.empty) {
            res.status(400).json({ error: "No Resume", details: "Please upload a resume first." });
            return;
        }

        const resumeData = resumeSnapshot.docs[0].data();
        const storagePath = resumeData.resumeUrl || resumeData.fileUrl || resumeData.storagePath;

        if (!storagePath) {
            res.status(500).json({ error: "Data Error", details: "Resume path missing" });
            return;
        }

        // 2. Download & Process Resume
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();

        if (!exists) {
            res.status(404).json({ error: "File Not Found", details: "Resume file not found in storage" });
            return;
        }

        const [fileBuffer] = await file.download();
        const decryptedBuffer = await decryptBuffer(fileBuffer);
        const resumeText = await extractTextFromBuffer(decryptedBuffer);

        // 3. Generate Search Queries with AI
        const searchPrompt = `
        Analyze this resume summary and generate 3 DISTINCT search queries for a job board.
        RESUME: ${resumeText.slice(0, 3000)}...
        
        The user wants diverse options.
        Return a JSON object with:
        - 'queries': Array of 3 strings. 
        - 'location': infer from resume if possible, otherwise leave empty or "Remote".
        `;

        const searchParamsResult = await generateObject({
            model: google("gemini-2.5-flash"),
            prompt: searchPrompt,
            schema: SearchParamsSchema,
        });

        const { queries, location } = searchParamsResult.object;
        console.log("Job Search Queries:", { queries, location });

        // 4. Fetch Candidates
        const fetchFindWork = async (searchTerms: string) => {
            const apiUrl = new URL("https://findwork.dev/api/jobs/");
            apiUrl.searchParams.set("search", searchTerms);
            if (location) apiUrl.searchParams.set("location", location);
            apiUrl.searchParams.set("sort_by", "relevance");

            try {
                const res = await fetch(apiUrl.toString(), {
                    headers: { "Authorization": `Token ${findWorkKey}` }
                });
                if (!res.ok) return [];
                const data: any = await res.json();
                return (data.results || []).map((job: any) => ({
                    id: `fw-${job.id}`,
                    role: job.role,
                    company_name: job.company_name,
                    location: job.location,
                    remote: job.remote,
                    url: job.url,
                    date_posted: job.date_posted,
                    keywords: job.keywords || []
                }));
            } catch (error) {
                console.error("FindWork fetch error:", error);
                return [];
            }
        };

        const fetchJobicy = async (searchTerms: string) => {
            const apiUrl = new URL("https://jobicy.com/api/v2/remote-jobs");
            apiUrl.searchParams.set("tag", searchTerms);
            apiUrl.searchParams.set("count", "20");

            try {
                const res = await fetch(apiUrl.toString());
                if (!res.ok) return [];
                const data: any = await res.json();
                const jobs = Array.isArray(data) ? data : (data.jobs || []);

                return jobs.map((job: any) => ({
                    id: `jobicy-${job.id}`,
                    role: job.jobTitle,
                    company_name: job.companyName,
                    location: job.jobGeo || "Remote",
                    remote: true,
                    url: job.url,
                    date_posted: job.pubDate,
                    keywords: [job.jobIndustry, job.jobType]
                }));
            } catch (error) {
                console.error("Jobicy fetch error:", error);
                return [];
            }
        };

        const fetchAllSources = async (query: string) => {
            const [fwJobs, jobicyJobs] = await Promise.all([fetchFindWork(query), fetchJobicy(query)]);
            return [...fwJobs, ...jobicyJobs].filter(job => job.url && job.url.startsWith("http"));
        };

        const resultsArray = await Promise.all(queries.map(q => fetchAllSources(q)));
        const allJobs = resultsArray.flat();

        let candidateJobs = Array.from(new Map(allJobs.map(job => [job.id, job])).values());

        candidateJobs = candidateJobs.slice(0, 20);

        // Fallback logic could be added here similar to frontend

        if (candidateJobs.length === 0) {
            res.json({ recommendations: [] });
            return;
        }

        // 5. Rank Candidates with AI
        const rankingPrompt = `
        You are a career coach.
        CANDIDATE RESUME: ${resumeText.slice(0, 2000)}
        JOB CANDIDATES: ${JSON.stringify(candidateJobs.map((j: any) => ({
            id: j.id, role: j.role, company: j.company_name, skills: j.keywords, remote: j.remote
        })))}
        TASK: Select top 10 jobs. Calculate match score (0-100) and provide reason.
        `;

        const rankingResult = await generateObject({
            model: google("gemini-2.5-flash"),
            prompt: rankingPrompt,
            schema: RankingResponseSchema,
        });

        const rankedRecs = rankingResult.object.recommendations;
        const finalRecommendations = rankedRecs.map(rec => {
            const originalJob = candidateJobs.find((j: any) => String(j.id) === String(rec.id));
            if (!originalJob) return null;
            return { ...originalJob, matchScore: rec.matchScore, reason: rec.reason };
        }).filter(Boolean);

        res.json({ recommendations: finalRecommendations });

    } catch (error: any) {
        console.error("Job Recommendation Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

export default router;
