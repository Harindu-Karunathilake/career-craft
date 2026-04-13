"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuestion = exports.generateFeedback = void 0;
const generative_ai_1 = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
console.log("DEBUG: Using API Key:", apiKey.substring(0, 10) + "...");
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
async function generateFeedback(problemContext, userCode, executionResult) {
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
    }
    catch (error) {
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
exports.generateFeedback = generateFeedback;
async function generateQuestion() {
    // Helper to generate the initial question if needed by backend, 
    // though currently frontend handles generic question generation via /api/interview/generate.
    // This connects to the same logic if we move it to Cloud Functions.
    return "Write a function to reverse a string."; // Placeholder
}
exports.generateQuestion = generateQuestion;
//# sourceMappingURL=gemini.js.map