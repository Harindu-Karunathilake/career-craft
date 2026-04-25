
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
console.log("DEBUG: Using API Key:", apiKey.substring(0, 10) + "...");
const genAI = new GoogleGenerativeAI(apiKey);
// Define model constant locally to prevent cross-workspace import issues in Firebase deployment
const DEFAULT_MODEL = "gemini-2.5-flash";
const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

export interface Feedback {
    totalScore: number;
    categoryScores: { name: string; score: number; comment: string }[];
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    nextQuestion: string;
}

export async function generateFeedback(
    problemContext: string,
    userCode: string,
    executionResult: string
): Promise<Feedback> {
    console.log("Generating feedback with model:", model.model);
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. Returning mock feedback.");
        return {
            totalScore: 0,
            categoryScores: [],
            strengths: ["API Key Missing"],
            areasForImprovement: ["Cannot evaluate without Gemini API Key"],
            finalAssessment: "Please configure the backend.",
            nextQuestion: "Please configure the backend."
        };
    }

    const prompt = `
    You are a technical interviewer. 
    The candidate is solving a problem.
    
    Problem/Context:
    ${problemContext}
    
    Candidate's Code:
    ${userCode}
    
    Execution Output:
    ${executionResult}
    
    Evaluate the solution based on the Problem Context.
    Return a JSON object with:
    - totalScore (0-100)
    - categoryScores (array of objects: { name: string, score: number (0-100), comment: string })
      Categories: "Code Quality", "Problem Solving", "Efficiency", "Syntax"
    - strengths (array of strings)
    - areasForImprovement (array of strings)
    - finalAssessment (paragraph string)
    - nextQuestion (a follow-up question or hint)
    
    JSON ONLY. No markdown.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Robust JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON object found in response");
        }
        const cleanedText = jsonMatch[0];

        return JSON.parse(cleanedText);
    } catch (error: any) {
        console.error("Error calling Gemini:", error);
        return {
            totalScore: 0,
            categoryScores: [],
            strengths: [],
            areasForImprovement: [`Error generating feedback: ${error.message || error}`],
            finalAssessment: "An error occurred while generating feedback.",
            nextQuestion: "Please check backend logs."
        };
    }
}

export async function generateQuestion(): Promise<string> {
    // Helper to generate the initial question if needed by backend, 
    // though currently frontend handles generic question generation via /api/interview/generate.
    // This connects to the same logic if we move it to Cloud Functions.
    return "Write a function to reverse a string."; // Placeholder
}
