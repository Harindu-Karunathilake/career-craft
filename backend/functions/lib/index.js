"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitCode = exports.startInterview = void 0;
const dotenv = require("dotenv");
dotenv.config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const execution_1 = require("./execution");
const gemini_1 = require("./gemini");
// Initialize Admin SDK
if (process.env.FUNCTIONS_EMULATOR) {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
}
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
console.log("Functions initialized. GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
exports.startInterview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const { role, experience, topic, type, interviewMode, language } = data;
    const uid = context.auth.uid;
    const initialCode = interviewMode === 'coding' ? "// Write your solution here\n" : "";
    console.log("Starting interview:", { uid, role, experience, topic, type, interviewMode, language, initialCode });
    return { success: true, message: "Use client-side creation for now to match existing flow." };
});
exports.submitCode = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    const { sessionId, code, language } = data;
    const uid = context.auth.uid;
    if (!sessionId || !code) {
        throw new functions.https.HttpsError("invalid-argument", "Missing sessionId or code.");
    }
    const executionResult = await (0, execution_1.executeCode)(language || 'javascript', code);
    console.log(`DEBUG: Checking DB for UID: ${uid}, Session: ${sessionId}`);
    const collections = await db.listCollections();
    console.log("Root Collections in Emulator:", collections.map(c => c.id));
    const userDoc = await db.collection("users").doc(uid).get();
    console.log(`User Doc ${uid} exists?`, userDoc.exists);
    const docRef = db.collection("users").doc(uid).collection("interviews").doc(sessionId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        console.error(`CRITICAL: Document ${docRef.path} does not exist. Cannot update.`);
        throw new functions.https.HttpsError("not-found", `Interview session ${sessionId} not found.`);
    }
    const interviewData = docSnap.data();
    if (!interviewData) {
        throw new functions.https.HttpsError("not-found", "Interview data is empty.");
    }
    // Determine the current question/problem context
    let problemContext = "Solve the problem provided.";
    if (interviewData.questions && Array.isArray(interviewData.questions) && interviewData.questions.length > 0) {
        const index = interviewData.currentQuestionIndex || 0;
        if (interviewData.questions[index]) {
            problemContext = interviewData.questions[index];
        }
        else {
            problemContext = interviewData.questions[0];
        }
    }
    const feedback = await (0, gemini_1.generateFeedback)(problemContext, code, executionResult.stdout + executionResult.stderr);
    // Determine if this was the last question
    const currentIndex = interviewData.currentQuestionIndex || 0;
    const totalQuestions = ((_a = interviewData.questions) === null || _a === void 0 ? void 0 : _a.length) || 0;
    const isLastQuestion = currentIndex + 1 >= totalQuestions;
    let nextMessage = `Evaluation: Score ${feedback.totalScore}/100. ${feedback.nextQuestion}`;
    let newStatus = interviewData.status;
    if (isLastQuestion) {
        nextMessage += "\n\n🎉 Interview Completed! You have finished all questions.";
        newStatus = 'completed';
    }
    else {
        // If not last, append the NEXT question text
        const nextQuestionText = interviewData.questions[currentIndex + 1];
        nextMessage += `\n\nNext Problem:\n${nextQuestionText}`;
    }
    await docRef.update({
        lastCode: code,
        lastExecution: executionResult,
        feedback: feedback,
        status: newStatus,
        currentQuestionIndex: isLastQuestion ? currentIndex : currentIndex + 1,
        messages: firestore_1.FieldValue.arrayUnion({
            role: 'ai',
            content: nextMessage,
            timestamp: Date.now()
        })
    });
    return {
        execution: executionResult,
        feedback: feedback,
        isCompleted: isLastQuestion
    };
});
//# sourceMappingURL=index.js.map