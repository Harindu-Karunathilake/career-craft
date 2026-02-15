import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY');
            return new Response(JSON.stringify({ error: 'Configuration Error', details: 'Missing AI API Key' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const { messages } = await req.json();

        const generateInterviewSchema = z.object({
            role: z.string().describe('The target job role for the interview'),
            experience: z.string().describe('The experience level of the candidate'),
            topic: z.string().optional().describe('The specific focus topic for the interview'),
        });


        const result = streamText({
            model: google('gemini-2.5-flash'),
            messages,
            system: `You are a friendly and professional interviewer assistant for CareerCraft. 
        Your goal is to help the user set up a mock interview session.
        
        You need to gather the following information from the user:
        1. **Target Role**: What job role are they practicing for? (e.g., Software Engineer, Product Manager)
        2. **Experience Level**: What is their experience level? (e.g., Junior, Mid-Level, Senior)
        3. **Focus Topic** (Optional): Is there a specific topic they want to focus on? (e.g., System Design, Behavioral, React)
    
        **Guidelines:**
        - Ask ONE question at a time. Do not overwhelm the user.
        - Start by introducing yourself and asking for the Target Role.
        - Once you have the Role, ask for the Experience Level.
        - Then ask if they have a specific Focus Topic or if they want a general interview.
        - Once you have all the necessary information, confirm it with the user.
        - If the user confirms, call the \`generateInterview\` tool immediately.
        - Be encouraging and concise.`,

            tools: {
                generateInterview: tool({
                    description: 'Generates the interview configuration and returns the setup details.',
                    parameters: generateInterviewSchema,
                    execute: async (args: z.infer<typeof generateInterviewSchema>) => {
                        const { role, experience, topic } = args;
                        // In a real app, this might save to a DB, but here we just return the config
                        // so the client can navigate.
                        return {
                            status: 'ready',
                            config: {
                                role,
                                experience,
                                topic: topic || 'General',
                            }
                        };
                    },
                } as any),
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('API Route Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
