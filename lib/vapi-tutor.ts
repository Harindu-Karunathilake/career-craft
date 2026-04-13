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
        });
    }
    return vapiSingleton;
};

// Start the AI Tutor in the current session
export const startAITutor = async (customContext?: string) => {
    const vapi = getVapiTutor();
    if (!vapi) return;

    useTutorStore.getState().setAgentStatus('CONNECTING');
    useTutorStore.getState().setAIActive(true);

    const basePrompt = "You are a technical interviewer and tutor for a live coding session. Help the candidate think through problems instead of giving direct answers. Be concise (max 2-3 sentences), clear, and supportive. Wait for them to finish thinking.";
    const systemPrompt = customContext ? `${basePrompt}\n\nContext:\n${customContext}` : basePrompt;

    try {
        await vapi.start({
            ...interviewer,
            name: "Career Craft Tutor",
            firstMessage: "Hi there! I'm your AI tutor. Let me know when you're ready to start coding or if you need any help.",
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

// Send current code to Vapi's context dynamically
export const syncCodeContextWithAI = (code: string, language: string = 'javascript') => {
    const vapi = getVapiTutor();
    if (!vapi || useTutorStore.getState().agentStatus !== 'ACTIVE') return;

    // We can inject a system message into the running Vapi session to provide context
    vapi.send({
        type: "add-message",
        message: {
            role: "system",
            content: `The candidate's current code in ${language} is:\n\n${code}`
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
