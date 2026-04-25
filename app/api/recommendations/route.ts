import { z } from 'zod';
import { generateObjectWithFallback } from '@/lib/ai-helper';
import { adminDb } from '@/lib/firebase-admin';
import { getResumeText, readRecsCache, writeRecsCache } from '@/lib/resume-cache';

// Force dynamic to ensure we always get fresh data if needed, valid for API routes
export const dynamic = 'force-dynamic';

// Schema for the recommendation object returned by AI
const RecommendationSchema = z.object({
    courseId: z.string().describe("The ID of the recommended course"),
    reason: z.string().describe("A brief explanation of why this course is recommended for the candidate"),
    matchScore: z.number().min(0).max(100).describe("A score from 0 to 100 indicating how well the course matches the candidate's profile"),
});

const ResponseSchema = z.object({
    recommendations: z.array(RecommendationSchema).describe("List of top 3 recommended courses"),
});

const DUMMY_COURSE_RECOMMENDATIONS = [
    {
        courseId: "dummy-c1",
        reason: "Based on your interest in backend development, this masterclass will solidify your architecture skills.",
        matchScore: 92
    },
    {
        courseId: "dummy-c2",
        reason: "This course covers modern frontend patterns which align with your recent project experience.",
        matchScore: 85
    }
];

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuration Error', details: 'Missing AI API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const { resumeId, userId, interviewHistory } = body;

        if (!resumeId) {
            return new Response(JSON.stringify({ error: 'Bad Request', details: 'Missing resumeId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Bad Request', details: 'Missing userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 1. Fetch Resume Metadata (Admin SDK — no auth session needed server-side)
        const resumeSnap = await adminDb()
            .collection("users").doc(userId)
            .collection("resumes").doc(resumeId)
            .get();

        if (!resumeSnap.exists) {
            return new Response(JSON.stringify({ error: 'Not Found', details: 'Resume document not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const resumeData = resumeSnap.data() as Record<string, any>;
        const storagePath = resumeData.resumeUrl || resumeData.fileUrl || resumeData.storagePath;

        if (!storagePath) {
            return new Response(JSON.stringify({ error: 'Data Error', details: 'Resume file path missing in database' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Check recommendations cache (instant return if < 24 h old)
        const cached = await readRecsCache(userId, "courses", resumeId);
        if (cached) {
            return new Response(JSON.stringify({ recommendations: cached, fromCache: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 3. Get resume text (cached after first extraction — skips PDF download/parse)
        const resumeText = await getResumeText(userId, resumeId, storagePath);

        // 5. Fetch available courses from Firestore (Admin SDK)
        const snapshot = await adminDb()
            .collection('courses')
            .where('published', '==', true)
            .get();

        const availableCourses = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                title: data.title,
                description: data.description,
                sections: data.chapters?.map((c: any) => c.title).join(', ') || ''
            };
        });

        if (availableCourses.length === 0) {
            return new Response(JSON.stringify({ recommendations: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 6. Format interview history
        const interviewContext = interviewHistory && Array.isArray(interviewHistory)
            ? interviewHistory.map((i: any) =>
                `- Role: ${i.role}, Topic: ${i.topic}, Score: ${i.averageScore || 'N/A'}/100. Weaknesses: ${i.weaknesses?.join(', ') || 'None listed'}`
            ).join('\n')
            : "No interview history provided.";

        // 7. Construct Prompt
        const prompt = `
    You are an expert career counselor and curriculum specialist.
    
    CANDIDATE PROFILE:
    RESUME SUMMARY:
    ${resumeText.slice(0, 3000)} ... (truncated)

    INTERVIEW HISTORY:
    ${interviewContext}

    AVAILABLE COURSES:
    ${JSON.stringify(availableCourses, null, 2)}

    TASK:
    Analyze the candidate's resume and interview performance. 
    Select the top 3 courses from the "AVAILABLE COURSES" list that would best help this candidate.
    - Prioritize courses that address specific weaknesses seen in interview history (e.g., low scores in specific topics).
    - Prioritize courses that align with skills mentioned in the resume or target roles.
    - If a course is irrelevant, do not suggest it.
    
    Return the result as a JSON object with a "recommendations" array.
    `;

        // 8. Call AI
        const result = await generateObjectWithFallback<z.infer<typeof ResponseSchema>>({
            prompt: prompt,
            schema: ResponseSchema,
        });

        // Persist to cache (fire-and-forget) and return
        writeRecsCache(userId, "courses", resumeId, result.object.recommendations).catch(() => {});

        return new Response(JSON.stringify(result.object), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Recommendation API Error. Returning fallback dummy data:', error);
        return new Response(JSON.stringify({
            recommendations: DUMMY_COURSE_RECOMMENDATIONS,
            fromFallback: true,
            error_context: error instanceof Error ? error.message : "Internal Error"
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
