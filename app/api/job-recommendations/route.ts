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
    queries: z.array(z.string()).describe("List of 3 distinct high-volume search queries. Focus on single-skill titles (e.g. 'React Developer') rather than complex strings."),
    location: z.string().optional().describe("Location for the job search (e.g., 'London', 'Remote')"),
});

const RankedJobSchema = z.object({
    id: z.union([z.string(), z.number()]).describe("The ID of the job from the source API"),
    reason: z.string().describe("Why this job is a good match for the candidate"),
    matchScore: z.number().min(0).max(100).describe("Match score from 0-100"),
});

const RankingResponseSchema = z.object({
    recommendations: z.array(RankedJobSchema).describe("Top 10 recommended jobs"),
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
        Analyze this resume summary and generate 3 DISTINCT search queries for a job board.
        RESUME: ${resumeText.slice(0, 3000)}...
        
        The user wants diverse options (e.g. if they know React and Flutter, search for "React Developer" AND "Flutter Developer" separately, not just "Software Engineer").
        
        Return a JSON object with:
        - 'queries': Array of 3 strings. 
            1. High-volume skill-based title (e.g. "React Developer" NOT "Full Stack React Node").
            2. Alternative skill-based title (e.g. "Flutter Developer").
            3. Broad role (e.g. "Frontend Developer").
        - 'location': infer from resume if possible, otherwise leave empty or "Remote".
        `;

        const searchParamsResult = await generateObject({
            model: google('gemini-2.5-flash'),
            prompt: searchPrompt,
            schema: SearchParamsSchema,
        });

        const { queries, location } = searchParamsResult.object;
        console.log("Job Search Queries:", { queries, location });

        // 4. Fetch Candidates from FindWork AND Jobicy (Parallel)
        const fetchFindWork = async (searchTerms: string) => {
            const apiUrl = new URL('https://findwork.dev/api/jobs/');
            apiUrl.searchParams.set('search', searchTerms);
            if (location) apiUrl.searchParams.set('location', location);
            apiUrl.searchParams.set('sort_by', 'relevance');

            console.log(`Fetching FindWork jobs for: ${searchTerms}`);
            try {
                const res = await fetch(apiUrl.toString(), {
                    headers: { 'Authorization': `Token ${findWorkKey}` }
                });
                if (!res.ok) {
                    console.error(`FindWork API Error for ${searchTerms}: ${res.status}`);
                    return [];
                }
                const data = await res.json();
                const results = data.results || [];

                // Map FindWork results to ensure consistent structure
                return results.map((job: any) => ({
                    id: `fw-${job.id}`,
                    role: job.role,
                    company_name: job.company_name,
                    location: job.location,
                    remote: job.remote,
                    url: job.url, // Ensure this exists
                    date_posted: job.date_posted,
                    keywords: job.keywords || []
                }));
            } catch (error) {
                console.error("FindWork fetch error:", error);
                return [];
            }
        };

        const fetchJobicy = async (searchTerms: string) => {
            // Jobicy uses 'tag' for keywords and 'geo' for location
            const apiUrl = new URL('https://jobicy.com/api/v2/remote-jobs');
            apiUrl.searchParams.set('tag', searchTerms);
            apiUrl.searchParams.set('count', '20');

            console.log(`Fetching Jobicy jobs for: ${searchTerms}`);
            try {
                const res = await fetch(apiUrl.toString());
                if (!res.ok) {
                    console.error(`Jobicy API Error: ${res.status}`);
                    return [];
                }
                const data = await res.json();

                // Jobicy returns { jobs: [...] } (success) or { ... }
                // Based on documentation, it might return a list or { jobs: ... }
                // We'll handle both defensively.
                const jobs = Array.isArray(data) ? data : (data.jobs || []);

                // Normalize to match FindWork structure so AI can read it uniformly
                return jobs.map((job: any) => ({
                    id: `jobicy-${job.id}`, // Jobicy IDs are usually numeric strings
                    role: job.jobTitle,
                    company_name: job.companyName,
                    location: job.jobGeo || 'Remote',
                    remote: true, // Jobicy is all remote
                    url: job.url,
                    date_posted: job.pubDate,
                    keywords: [job.jobIndustry, job.jobType] // Map metadata to keywords
                }));
            } catch (error) {
                console.error("Jobicy fetch error:", error);
                return [];
            }
        };

        const fetchAllSources = async (query: string) => {
            const [fwJobs, jobicyJobs] = await Promise.all([
                fetchFindWork(query),
                fetchJobicy(query)
            ]);
            // Filter out jobs without valid URLs
            const validJobs = [...fwJobs, ...jobicyJobs].filter(job => job.url && job.url.startsWith('http'));
            console.log(`Fetched ${validJobs.length} valid jobs (with URLs) for query: ${query}`);
            return validJobs;
        };

        const resultsArray = await Promise.all(queries.map(q => fetchAllSources(q)));

        // Flatten and Deduplicate
        const allJobs = resultsArray.flat();
        const seenIds = new Set();
        let candidateJobs = allJobs.filter(job => {
            if (seenIds.has(job.id)) return false;
            seenIds.add(job.id);
            return true;
        });

        console.log(`Found ${candidateJobs.length} total unique jobs from ${queries.length} queries across FindWork and Jobicy.`);

        // Limit to top 20 for analysis
        candidateJobs = candidateJobs.slice(0, 20);

        // 5. Emergency Fallback: If < 2 jobs found, try broad search WITHOUT location
        if (candidateJobs.length < 2) {
            console.log("Low results found. Attempting emergency fallback (Broad Query + No Location)...");

            // Use the last query (assumed to be the broad one) or a generic fallback
            const broadQuery = queries[queries.length - 1] || "Software Developer";

            // API call without location
            const apiUrl = new URL('https://findwork.dev/api/jobs/');
            apiUrl.searchParams.set('search', broadQuery);
            apiUrl.searchParams.set('sort_by', 'relevance');

            try {
                const res = await fetch(apiUrl.toString(), {
                    headers: { 'Authorization': `Token ${findWorkKey}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const newJobs = data.results || [];
                    console.log(`Emergency fallback found ${newJobs.length} jobs.`);

                    // Add new jobs, avoiding duplicates
                    newJobs.forEach((job: any) => {
                        if (!seenIds.has(job.id)) {
                            candidateJobs.push(job);
                            seenIds.add(job.id);
                        }
                    });
                }
            } catch (err) {
                console.error("Emergency fallback failed:", err);
            }
        }

        if (candidateJobs.length === 0) {
            console.log("No jobs found from any query.");
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
        Select the top 10 jobs that best match the candidate.
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
            const originalJob = candidateJobs.find((j: any) => String(j.id) === String(rec.id));
            if (!originalJob) {
                console.warn(`Could not find original job for ranked ID: ${rec.id}`);
                return null;
            }
            return {
                ...originalJob,
                matchScore: rec.matchScore,
                reason: rec.reason
            };
        }).filter(Boolean);

        console.log(`Sending ${finalRecommendations.length} recommendations to frontend.`);

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
