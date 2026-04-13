import { create } from 'zustand';

interface TutorState {
    isAIActive: boolean;
    isMuted: boolean;
    agentStatus: 'INACTIVE' | 'CONNECTING' | 'ACTIVE' | 'ERROR' | 'FINISHED';
    messages: Array<{ role: 'user' | 'ai' | 'system', content: string, timestamp?: number }>;
    currentCode: string;
    
    // Actions
    setAIActive: (active: boolean) => void;
    setMuted: (muted: boolean) => void;
    setAgentStatus: (status: 'INACTIVE' | 'CONNECTING' | 'ACTIVE' | 'ERROR' | 'FINISHED') => void;
    addMessage: (message: { role: 'user' | 'ai' | 'system', content: string, timestamp?: number }) => void;
    setCodeContext: (code: string) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
    isAIActive: false,
    isMuted: false,
    agentStatus: 'INACTIVE',
    messages: [],
    currentCode: '',

    setAIActive: (active) => set({ isAIActive: active }),
    setMuted: (muted) => set({ isMuted: muted }),
    setAgentStatus: (status) => set({ agentStatus: status }),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setCodeContext: (code) => set({ currentCode: code }),
}));
