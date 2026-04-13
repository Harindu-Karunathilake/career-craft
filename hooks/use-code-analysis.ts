import { useState } from 'react';
import { toast } from 'sonner';

export const useCodeAnalysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeCode = async (code: string, question?: string): Promise<string | null> => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/code-analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, question })
            });

            if (!response.ok) {
                throw new Error("Failed to analyze code");
            }

            const data = await response.json();
            return data.feedback; // Return the 1-2 sentence hint string
        } catch (error) {
            console.error("Analysis hook error:", error);
            toast.error("Failed to analyze code. Please try again.");
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    };

    return { analyzeCode, isAnalyzing };
};
