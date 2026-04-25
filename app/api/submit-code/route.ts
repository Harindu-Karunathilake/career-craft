import { z } from 'zod';
import { generateObjectWithFallback } from '@/lib/ai-helper';
import { NextResponse } from 'next/server';
import { feedbackSchema } from '@/constants/interview';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
    try {
        const { sessionId, code, language, userId } = await req.json();

        if (!sessionId || !code || !userId) {
            return NextResponse.json({ error: 'Missing required fields: sessionId, code, userId' }, { status: 400 });
        }

        // Fetch the interview document using firebase-admin (server-side)
        const db = adminDb();
        const docRef = db.collection('users').doc(userId).collection('interviews').doc(sessionId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
        }

        const interviewData = docSnap.data()!;
        const currentIndex = interviewData.currentQuestionIndex || 0;
        const questions: string[] = interviewData.questions || [];
        const problemContext = questions[currentIndex] || 'General programming problem';

        const { object: feedback } = await generateObjectWithFallback<z.infer<typeof feedbackSchema>>({
            schema: feedbackSchema,
            system: "You are a senior software engineer conducting a technical coding interview. Evaluate the candidate's code fairly and thoroughly.",
            prompt: `
Problem the candidate is solving:
"${problemContext}"

Candidate's Code (${language || 'JavaScript'}):
\`\`\`
${code}
\`\`\`

Evaluate the code against the problem requirements. Score each category 0-100:
- Code Quality: readability, naming, structure
- Problem Solving: correctness and approach
- Efficiency: time/space complexity
- Syntax: correct language usage, no errors
- Edge Case Handling: null inputs, boundaries, edge conditions

Be honest. If code is incomplete or incorrect, score accordingly.
`,
        });

        // Build the formatted chat message
        const isLastQuestion = currentIndex + 1 >= questions.length;
        let chatMessage = `**Evaluation: Score ${feedback.totalScore}/100**\n\n`;
        chatMessage += `${feedback.finalAssessment}\n\n`;

        if (feedback.strengths.length > 0) {
            chatMessage += `✅ **Strengths:**\n${feedback.strengths.map(s => `• ${s}`).join('\n')}\n\n`;
        }
        if (feedback.areasForImprovement.length > 0) {
            chatMessage += `⚠️ **Areas to Improve:**\n${feedback.areasForImprovement.map(a => `• ${a}`).join('\n')}`;
        }

        if (isLastQuestion) {
            chatMessage += '\n\n🎉 Interview Completed! You have answered all questions.';
        } else {
            const nextQuestion = questions[currentIndex + 1];
            chatMessage += `\n\n**Next Problem:**\n${nextQuestion}`;
        }

        // Update Firestore with feedback, next question index, and chat message
        await docRef.update({
            feedback,
            lastCode: code,
            currentQuestionIndex: isLastQuestion ? currentIndex : currentIndex + 1,
            status: isLastQuestion ? 'completed' : interviewData.status,
            messages: FieldValue.arrayUnion({
                role: 'ai',
                content: chatMessage,
                timestamp: Date.now(),
            }),
        });

        return NextResponse.json({ success: true, feedback, isCompleted: isLastQuestion });
    } catch (error: any) {
        console.error('Submit code error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to evaluate code' },
            { status: 500 }
        );
    }
}
