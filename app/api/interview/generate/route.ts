import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Configuration Error' }), { status: 500 });
        }

        const { role, experience, topic, type, questionCount } = await req.json();

        // Retry logic for rate limits
        const generateWithRetry = async (retries = 3, delay = 1000) => {
            try {
                return await generateObject({
                    model: google('gemini-2.5-flash'), // Fallback to standard 1.0 Pro
                    schema: z.object({
                        questions: z.array(z.string()),
                    }),
                    prompt: `
                    Prepare ${questionCount} ${type || 'technical'} interview questions for a ${role} position.
                    Experience Level: ${experience}.
                    Focus Topic: ${topic}.
                    
                    The questions will be read by a voice assistant, so keep them concise and conversational.
                    Avoid utilizing special characters like * or / that might confuse the TTS.
                    Return a list of questions.
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

        return new Response(JSON.stringify({ questions: result.object.questions }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Generation Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: `Failed to generate questions: ${errorMessage}` }), { status: 500 });
    }
}
