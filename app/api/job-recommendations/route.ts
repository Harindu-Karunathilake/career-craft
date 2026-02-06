import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { doc, getDoc, collection, query, limit, orderBy, getDocs } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';
import { adminStorage } from '@/lib/firebase-admin';
import { decryptBuffer } from '@/lib/encryption-server';
import { extractTextFromBuffer } from '@/lib/pdf2text-server';

// Force dynamic to ensure we always get fresh data
export const dynamic = 'force-dynamic';

const SearchParamsSchema = z.object({
    keywords: z.string().describe("Search keywords for the job API (e.g., 'React Developer', 'Data Scientist')"),
    location: z.string().optional().describe("Location for the job search (e.g., 'London', 'Remote')"),
});

const RankedJobSchema = z.object({
    id: z.number().describe("The ID of the job from the source API"),
    reason: z.string().describe("Why this job is a good match for the candidate"),
    matchScore: z.number().min(0).max(100).describe("Match score from 0-100"),
});

const RankingResponseSchema = z.object({
    recommendations: z.array(RankedJobSchema).describe("Top 3 recommended jobs"),
});

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const findWorkKey = process.env.FINDWORK_API_KEY;

        if (!apiKey || !findWorkKey) {
            return new Response(JSON.stringify({ error: 'Configuration Error', details: 'Missing API Keys' }), { status: 500 });
        }

        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return new Response(JSON.stringify({ error: 'Bad Request', details: 'Missing userId' }), { status: 400 });
        }

        // 1. Fetch Latest Resume
        const resumesRef = collection(firebaseDb, "users", userId, "resumes");
        const resumeQ = query(resumesRef, orderBy("createdAt", "desc"), limit(1));
        const resumeSnapshot = await getDocs(resumeQ);

        if (resumeSnapshot.empty) {
            return new Response(JSON.stringify({ error: 'No Resume', details: 'Please upload a resume first.' }), { status: 400 });
        }

        const resumeData = resumeSnapshot.docs[0].data();
        const storagePath = resumeData.resumeUrl || resumeData.fileUrl || resumeData.storagePath;

        if (!storagePath) {
            return new Response(JSON.stringify({ error: 'Data Error', details: 'Resume path missing' }), { status: 500 });
        }

        // 2. Download & Process Resume
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const bucket = adminStorage().bucket(bucketName);
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();

        if (!exists) {
            return new Response(JSON.stringify({ error: 'File Not Found', details: 'Resume file not found in storage' }), { status: 404 });
        }

        const [fileBuffer] = await file.download();
        const decryptedBuffer = await decryptBuffer(fileBuffer);
        const resumeText = await extractTextFromBuffer(decryptedBuffer);

        // 3. Generate Search Queries with AI
        const searchPrompt = `
        Analyze this resume summary and generate the best search parameters for a job board API.
        RESUME: ${resumeText.slice(0, 3000)}...
        
        Return a JSON object with 'keywords' (e.g. "Frontend Developer React") and 'location' (infer from resume if possible, otherwise leave empty or "Remote" if they seem to prefer it).
        `;

        const searchParamsResult = await generateObject({
            model: google('gemini-2.5-flash'),
            prompt: searchPrompt,
            schema: SearchParamsSchema,
        });

        const { keywords, location } = searchParamsResult.object;

        // 4. Fetch Candidates from FindWork API
        const apiUrl = new URL('https://findwork.dev/api/jobs/');
        apiUrl.searchParams.set('search', keywords);
        if (location) apiUrl.searchParams.set('location', location);
        apiUrl.searchParams.set('sort_by', 'relevance');

        const jobsRes = await fetch(apiUrl.toString(), {
            headers: { 'Authorization': `Token ${findWorkKey}` }
        });

        if (!jobsRes.ok) {
            throw new Error(`FindWork API Error: ${jobsRes.statusText}`);
        }

        const jobsData = await jobsRes.json();
        let candidateJobs = jobsData.results || [];

        // Limit to top 15 for analysis to save tokens/time
        candidateJobs = candidateJobs.slice(0, 15);

        if (candidateJobs.length === 0) {
            return new Response(JSON.stringify({ recommendations: [] }), { status: 200 });
        }

        // 5. Rank Candidates with AI
        const rankingPrompt = `
        You are a career coach.
        
        CANDIDATE RESUME:
        ${resumeText.slice(0, 2000)}

        JOB CANDIDATES:
        ${JSON.stringify(candidateJobs.map((j: any) => ({
            id: j.id,
            role: j.role,
            company: j.company_name,
            skills: j.keywords,
            remote: j.remote
        })))}

        TASK:
        Select the top 3 jobs that best match the candidate.
        Calculate a match score (0-100) and provide a concise reason why.
        Return JSON with 'recommendations' array.
        `;

        const rankingResult = await generateObject({
            model: google('gemini-2.5-flash'),
            prompt: rankingPrompt,
            schema: RankingResponseSchema,
        });

        const rankedRecs = rankingResult.object.recommendations;

        // Merge AI details back with full job details
        const finalRecommendations = rankedRecs.map(rec => {
            const originalJob = candidateJobs.find((j: any) => j.id === rec.id);
            if (!originalJob) return null;
            return {
                ...originalJob,
                matchScore: rec.matchScore,
                reason: rec.reason
            };
        }).filter(Boolean);

        return new Response(JSON.stringify({ recommendations: finalRecommendations }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Job Recommendation Error:", error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }), { status: 500 });
    }
}
