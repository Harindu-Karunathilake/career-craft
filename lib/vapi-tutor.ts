import Vapi from "@vapi-ai/web";
import { useTutorStore } from "@/hooks/use-tutor-store";
import { interviewer } from "@/constants/interview";

let vapiSingleton: any = null;

export const getVapiTutor = (): any | null => {
    if (typeof window === 'undefined') return null; // Prevent SSR issues
    
    if (!vapiSingleton) {
        const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
        if (!token) {
            console.error("Vapi web token not found");
            return null;
        }
        vapiSingleton = new Vapi(token);

        // Bind global listeners to Zustand store
        vapiSingleton.on("call-start", () => {
             useTutorStore.getState().setAgentStatus('ACTIVE');
        });
        vapiSingleton.on("call-end", () => {
             useTutorStore.getState().setAgentStatus('FINISHED');
             useTutorStore.getState().setAIActive(false);
             // Reset singleton so next call starts fresh
             vapiSingleton = null;
        });
        vapiSingleton.on("message", (message: any) => {
            if (message.type === "transcript") {
                if (message.transcriptType === "final") {
                    // 1. Add to permanent history
                    useTutorStore.getState().addMessage({
                        role: message.role === 'user' ? 'user' : 'ai',
                        content: message.transcript,
                        timestamp: Date.now()
                    });
                    // 2. Clear partial buffer for this specific role
                    useTutorStore.getState().setPartialTranscript("");
                } else if (message.transcriptType === "partial") {
                    // Only show AI's partial transcripts to the user in the "He is saying..." box
                    if (message.role === 'assistant') {
                        useTutorStore.getState().setPartialTranscript(message.transcript);
                    }
                }
            }
        });
        vapiSingleton.on("error", (error: any) => {
            // "ejected" means the Daily.co room ended normally (time limit, host left, etc.)
            // Treat it as a graceful session end rather than a hard error.
            const isEjected =
                error?.error?.type === "ejected" ||
                error?.error?.error?.type === "ejected" ||
                error?.message?.type === "ejected";

            if (isEjected) {
                console.warn("VAPI session ended (ejected — room closed).");
                useTutorStore.getState().setAgentStatus('FINISHED');
                useTutorStore.getState().setAIActive(false);
            } else {
                console.error("VAPI Error:", error);
                useTutorStore.getState().setAgentStatus('ERROR');
                useTutorStore.getState().setAIActive(false);
            }
            // Always reset singleton so next call starts fresh
            vapiSingleton = null;
        });
    }
    return vapiSingleton;
};

// Start the AI Tutor in the current session
export const startAITutor = async (currentCode?: string, question?: string) => {
    const vapi = getVapiTutor();
    if (!vapi) return;

    useTutorStore.getState().setAgentStatus('CONNECTING');
    useTutorStore.getState().setAIActive(true);

    const questionContext = question
        ? `\n\nThe candidate is currently working on this problem:\n"${question}"`
        : "";
    const codeContext = currentCode
        ? `\n\nTheir current code is:\n${currentCode}`
        : "";

    const systemPrompt = `You are a technical interviewer and tutor for a live coding session.${questionContext}${codeContext}

Your job is to help the candidate think through the problem without giving them direct solutions. Guide them with hints about their approach, edge cases, or complexity. Be concise (max 2-3 sentences per response), clear, and supportive. Always refer back to the specific problem they are solving when giving guidance.`;

    try {
        await vapi.start({
            ...interviewer,
            name: "Career Craft Tutor",
            firstMessage: question
                ? `Hi! I'm your AI tutor. I can see you're working on: "${question.substring(0, 80)}${question.length > 80 ? '...' : ''}". Let me know when you need a hint or guidance!`
                : "Hi there! I'm your AI tutor. Let me know when you're ready to start coding or if you need any help.",
            model: {
                ...interviewer.model,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    }
                ]
            }
        });
    } catch (err) {
        console.error("Failed to start Vapi", err);
        useTutorStore.getState().setAgentStatus('ERROR');
        useTutorStore.getState().setAIActive(false);
    }
};

// Send current code + question to Vapi's context dynamically
export const syncCodeContextWithAI = (context: string, question?: string, language: string = 'javascript') => {
    const vapi = getVapiTutor();
    if (!vapi || useTutorStore.getState().agentStatus !== 'ACTIVE') return;

    const questionNote = question ? `The problem they are solving is:\n"${question}"\n\n` : '';
    vapi.send({
        type: "add-message",
        message: {
            role: "system",
            content: `${questionNote}The candidate's current code in ${language} is:\n\n${context}`
        }
    });
};

export const stopAITutor = () => {
    const vapi = getVapiTutor();
    if (vapi) {
        vapi.stop();
    }
    useTutorStore.getState().setAgentStatus('FINISHED');
    useTutorStore.getState().setAIActive(false);
};

export const setAITutorMuted = (muted: boolean) => {
    const vapi = getVapiTutor();
    if (vapi) {
        vapi.setMuted(muted);
    }
    useTutorStore.getState().setMuted(muted);
};

/**
 * Called after evaluation when there is a next problem.
 *
 * Two scenarios handled:
 *  A) VAPI still ACTIVE  → inject context + inject assistant message into
 *     conversation history + call vapi.say() so the agent reads it aloud.
 *  B) VAPI FINISHED/ejected → auto-restart the session with the new question
 *     so the user doesn't have to click "Ask AI Tutor" again manually.
 */
export const notifyNextProblem = async (nextQuestion: string, currentCode: string = '') => {
    const status = useTutorStore.getState().agentStatus;

    if (status === 'ACTIVE') {
        const vapi = getVapiTutor();
        if (!vapi) return;

        // 1. Update system context so the agent knows the new problem
        vapi.send({
            type: "add-message",
            message: {
                role: "system",
                content: `IMPORTANT: The previous problem has been evaluated. The user's NEW current problem is:\n\n"${nextQuestion}"\n\nYou already know this problem. When the user asks for help, refer specifically to this new problem — do not ask the user to share it.`
            }
        });

        // 2. Inject as an assistant message into conversation history so
        //    the agent "remembers" announcing it (prevents "share the problem" responses)
        vapi.send({
            type: "add-message",
            message: {
                role: "assistant",
                content: `Great work on the previous problem! Your next challenge is: "${nextQuestion}". Let me know when you're ready to start or if you need a hint!`
            }
        });

        // 3. Make the agent speak it aloud using the correct SDK method
        try {
            vapi.say(
                `Excellent work! Here is your next challenge: ${nextQuestion}. Take a moment to think through your approach and let me know when you need guidance!`,
                false // endCallAfterSpoken = false → keeps session alive
            );
        } catch {
            // vapi.say() may not be available on older bundle versions — silently skip
        }

    } else if (status === 'FINISHED' || status === 'ERROR') {
        // Session was ejected before/during evaluation — auto-restart with new question
        // Small delay so Firestore state has fully settled
        setTimeout(() => startAITutor(currentCode, nextQuestion), 800);
    }
    // CONNECTING state: do nothing — let it finish connecting first
};
