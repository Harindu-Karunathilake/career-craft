import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getDocs, collection, query, where, doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase';
import { adminStorage } from '@/lib/firebase-admin';
import { decryptBuffer } from '@/lib/encryption-server';
import { extractTextFromBuffer } from '@/lib/pdf2text-server';

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

        // 1. Fetch Resume Metadata to get Storage Path
        const resumeDocRef = doc(firebaseDb, "users", userId, "resumes", resumeId);
        const resumeSnap = await getDoc(resumeDocRef);

        if (!resumeSnap.exists()) {
            return new Response(JSON.stringify({ error: 'Not Found', details: 'Resume document not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const resumeData = resumeSnap.data();
        const storagePath = resumeData.resumeUrl || resumeData.fileUrl || resumeData.storagePath; // Handle discrepancies

        if (!storagePath) {
            return new Response(JSON.stringify({ error: 'Data Error', details: 'Resume file path missing in database' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Download Encrypted File from Admin Storage
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const bucket = adminStorage().bucket(bucketName);
        const file = bucket.file(storagePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            return new Response(JSON.stringify({ error: 'Not Found', details: `File not found in storage: ${storagePath}` }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const [fileBuffer] = await file.download();

        // 3. Decrypt File
        const decryptedBuffer = await decryptBuffer(fileBuffer);

        // 4. Extract Text
        const resumeText = await extractTextFromBuffer(decryptedBuffer);

        // 5. Fetch available courses from Firestore
        const coursesRef = collection(firebaseDb, 'courses');
        const q = query(coursesRef, where('published', '==', true));
        const snapshot = await getDocs(q);

        const availableCourses = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
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
        const result = await generateObject({
            model: google('gemini-2.5-flash'),
            prompt: prompt,
            schema: ResponseSchema,
        });

        return new Response(JSON.stringify(result.object), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Recommendation API Error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : "Internal Server Error",
            details: error instanceof Error ? error.stack : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
