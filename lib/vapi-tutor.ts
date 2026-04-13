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
            if (message.type === "transcript" && message.transcriptType === "final") {
                useTutorStore.getState().addMessage({
                    role: message.role === 'user' ? 'user' : 'ai',
                    content: message.transcript,
                    timestamp: Date.now()
                });
            }
        });
        vapiSingleton.on("error", (error: any) => {
            console.error("VAPI Error:", error);
            useTutorStore.getState().setAgentStatus('ERROR');
            useTutorStore.getState().setAIActive(false);
            // Reset singleton on error so future calls can create a fresh instance
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
