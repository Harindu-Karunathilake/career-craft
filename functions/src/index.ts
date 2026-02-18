import * as dotenv from "dotenv";
dotenv.config();

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { executeCode } from "./execution";
import { generateFeedback } from "./gemini";
import { sendStatusEmail } from "./email-service";

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

export const onUserStatusChanged = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const after = change.after.data();
        const before = change.before.data();

        // Check if status changed
        if (after.status !== before.status) {
            // Only strictly for tutors or if the previous status was pending
            // But usually we just want to notify anyone who gets verified/rejected if they are a tutor
            if (after.role === 'tutor' && (after.status === 'active' || after.status === 'rejected')) {
                if (after.email && after.name) {
                    await sendStatusEmail(after.email, after.name, after.status);
                } else {
                    console.warn(`User ${context.params.userId} status changed but missing email/name.`);
                }
            }
        }
    });

export const startInterview = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { role, experience, topic, type, interviewMode, language } = data;
    const uid = context.auth.uid;
    const initialCode = interviewMode === 'coding' ? "// Write your solution here\n" : "";

    console.log("Starting interview:", { uid, role, experience, topic, type, interviewMode, language, initialCode });

    return { success: true, message: "Use client-side creation for now to match existing flow." };
});

export const submitCode = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }

    const { sessionId, code, language } = data;
    const uid = context.auth.uid;

    if (!sessionId || !code) {
        throw new functions.https.HttpsError("invalid-argument", "Missing sessionId or code.");
    }

    const executionResult = await executeCode(language || 'javascript', code);

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
        } else {
            problemContext = interviewData.questions[0];
        }
    }

    const feedback = await generateFeedback(problemContext, code, executionResult.stdout + executionResult.stderr);

    // Determine if this was the last question
    const currentIndex = interviewData.currentQuestionIndex || 0;
    const totalQuestions = interviewData.questions?.length || 0;
    const isLastQuestion = currentIndex + 1 >= totalQuestions;

    let nextMessage = `Evaluation: Score ${feedback.totalScore}/100. ${feedback.nextQuestion}`;
    let newStatus = interviewData.status;

    if (isLastQuestion) {
        nextMessage += "\n\n🎉 Interview Completed! You have finished all questions.";
        newStatus = 'completed';
    } else {
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
        messages: FieldValue.arrayUnion({
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
