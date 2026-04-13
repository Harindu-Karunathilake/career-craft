import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { DEFAULT_AI_MODEL } from '@/constants/ai';

export async function POST(req: Request) {
    try {
        const { code, question } = await req.json();

        // Let's use gemini-1.5-pro or flash depending on preference. Assuming process.env.GOOGLE_GENERATIVE_AI_API_KEY is set.
        const { text } = await generateText({
            model: google(DEFAULT_AI_MODEL),
            system: "You are an expert technical interviewer and AI coding tutor. Your task is to analyze the original coding question and compare it directly with the user's current answer (code). Instead of simple hints, provide deep technical insights. Discuss their logical approach, identify edge cases they might have missed, and evaluate the time/space complexity of their solution. Give constructive insights on how it aligns with the problem requirements without explicitly writing the complete code for them.",
            prompt: `Original Problem/Question:\n${question || 'General programming'}\n\nUser's Current Answer (Code):\n${code}\n\nPlease analyze the code against the problem requirements and provide your insights:`
        });

        return NextResponse.json({ feedback: text });
    } catch (error) {
        console.error("Code analysis error:", error);
        return NextResponse.json({ error: "Failed to analyze code" }, { status: 500 });
    }
}
