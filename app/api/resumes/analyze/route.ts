import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { cacheGet, cacheSet } from "@/lib/redis";
import { createHash } from "crypto";

export const maxDuration = 60;

// Cache identical resume+job analyses for 24 hours
// Same resume vs same job = deterministic result
const CACHE_TTL = 60 * 60 * 24;

function buildCacheKey(resumeText: string, jobTitle: string, jobDescription: string): string {
    const hash = createHash("sha256")
        .update(resumeText.trim() + "|" + jobTitle.trim().toLowerCase() + "|" + jobDescription.trim())
        .digest("hex");
    return `resume-analysis:${hash}`;
}

export async function POST(req: NextRequest) {
    try {
        const { resumeText, jobTitle, jobDescription } = await req.json();

        if (!resumeText || !jobTitle || !jobDescription) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // ── Cache check ──────────────────────────────────────────────────────
        const cacheKey = buildCacheKey(resumeText, jobTitle, jobDescription);
        const cached = await cacheGet(cacheKey);
        if (cached) {
            console.log("[Cache HIT] resume-analysis:", cacheKey.slice(0, 40));
            return NextResponse.json({ analysis: JSON.parse(cached) }, {
                headers: { "X-Cache": "HIT" },
            });
        }
        console.log("[Cache MISS] resume-analysis:", cacheKey.slice(0, 40));

        // ── Run Gemini analysis ──────────────────────────────────────────────
        const prompt = `You are a purely technical Applicant Tracking System (ATS) data processor.
Your task is to extract structured data and feedback from the provided resume text in the context of the job description.
Output ONLY valid JSON. Do not generate any conversational text, apologies, or markdown formatting.

Analyze the resume against the following job detail:
Job Title: ${jobTitle}
Job Description: ${jobDescription}

RESUME CONTENT:
${resumeText}

Evaluate the match and provide structured feedback data using exactly this schema:
{
  "overallScore": number,
  "ATS": {
    "score": number,
    "tips": [{ "type": "good" | "improve", "tip": string }]
  },
  "toneAndStyle": {
    "score": number,
    "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }]
  },
  "content": {
    "score": number,
    "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }]
  },
  "structure": {
    "score": number,
    "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }]
  },
  "skills": {
    "score": number,
    "tips": [{ "type": "good" | "improve", "tip": string, "explanation": string }]
  }
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown or code blocks.
- Each tips array should have 3-4 entries.
- If the resume is poor, accurately reflect this in the scores (0-100).`;

        const runWithRetry = async (retries = 3, delay = 1000): Promise<string> => {
            try {
                const { text } = await generateText({
                    model: google("gemini-2.5-flash"),
                    prompt,
                });
                return text;
            } catch (error: any) {
                if (retries > 0 && (error?.message?.includes("429") || error?.message?.includes("Quota"))) {
                    console.log(`Rate limit hit, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return runWithRetry(retries - 1, delay * 2);
                }
                throw error;
            }
        };

        const rawText = await runWithRetry();

        // Strip any accidental markdown fences
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
            rawText.match(/```\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : rawText.trim();

        let analysisData;
        try {
            analysisData = JSON.parse(jsonString);
        } catch {
            throw new Error("AI returned invalid JSON — please try again.");
        }

        // ── Store in cache ───────────────────────────────────────────────────
        await cacheSet(cacheKey, JSON.stringify(analysisData), CACHE_TTL);

        return NextResponse.json({ analysis: analysisData }, {
            headers: { "X-Cache": "MISS" },
        });

    } catch (error: any) {
        console.error("Resume analysis error:", error);
        return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
    }
}
