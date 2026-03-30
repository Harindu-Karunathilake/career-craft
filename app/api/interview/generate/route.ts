import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { cacheGet, cacheSet } from '@/lib/redis';

export const maxDuration = 30;

// 12-hour TTL: questions for the same params are stable
const CACHE_TTL = 60 * 60 * 12;

function buildCacheKey(params: {
    role: string;
    experience: string;
    topic: string;
    type: string;
    questionCount: number;
    interviewMode: string;
}): string {
    const normalized = JSON.stringify([
        (params.role ?? '').trim().toLowerCase(),
        (params.experience ?? '').trim().toLowerCase(),
        (params.topic ?? '').trim().toLowerCase(),
        (params.type ?? '').trim().toLowerCase(),
        params.questionCount,
        (params.interviewMode ?? '').trim().toLowerCase(),
    ]);
    return `interview-questions:${Buffer.from(normalized).toString('base64')}`;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuration Error' }), { status: 500 });
        }

        const { role, experience, topic, type, questionCount, interviewMode } = await req.json();
        console.log("API /generate RECEIVED:", { role, type, interviewMode });

        // ── Cache check ──────────────────────────────────────────────────────
        const cacheKey = buildCacheKey({ role, experience, topic, type, questionCount, interviewMode });
        const cached = await cacheGet(cacheKey);
        if (cached) {
            console.log("[Cache HIT] interview-questions:", cacheKey);
            return new Response(cached, {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
            });
        }
        console.log("[Cache MISS] interview-questions:", cacheKey);

        // ── Generate via Gemini ──────────────────────────────────────────────
        const generateWithRetry = async (retries = 3, delay = 1000) => {
            try {
                return await generateObject({
                    model: google('gemini-2.5-flash'),
                    schema: z.object({
                        questions: z.array(z.string()),
                    }),
                    prompt: `
                    Prepare ${questionCount} ${interviewMode === 'coding' ? 'coding problems' : (type || 'technical') + ' interview questions'} for a ${role} position.
                    Experience Level: ${experience}.
                    Focus Topic: ${topic}.
                    
                    ${type === 'coding' || interviewMode === 'coding' ?
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
                         Avoid utilizing special characters like * or / that might confuse the TTS.`
                        }
                    
                    Return a list of questions/problems.
                  `,
                });
            } catch (error: any) {
                if (retries > 0 && (error?.message?.includes('429') || error?.message?.includes('Quota'))) {
                    console.log(`Rate limit hit, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const result = await generateWithRetry();
        const responseBody = JSON.stringify({ questions: result.object.questions });

        // ── Store in cache ───────────────────────────────────────────────────
        await cacheSet(cacheKey, responseBody, CACHE_TTL);

        return new Response(responseBody, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
        });

    } catch (error) {
        console.error('Generation Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: `Failed to generate questions: ${errorMessage}` }), { status: 500 });
    }
}
