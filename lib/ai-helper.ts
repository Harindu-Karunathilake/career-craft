import { google } from '@ai-sdk/google';
import { generateObject, generateText, type GenerateObjectResult, type GenerateTextResult } from 'ai';
import { ALL_PRIORITIZED_MODELS } from '@/constants/ai';

/**
 * Wraps generateObject with a fallback mechanism that tries models in order.
 */
export async function generateObjectWithFallback<T>(options: any): Promise<GenerateObjectResult<T>> {
    const models = ALL_PRIORITIZED_MODELS;
    let lastError: any;

    for (const modelId of models) {
        try {
            console.log(`[AI-Helper] Trying model: ${modelId}`);
            // Use any here to avoid complex union type issues with overloaded generateObject
            return await generateObject({
                ...options,
                model: google(modelId),
            } as any);
        } catch (error: any) {
            lastError = error;
            const status = error?.status || error?.statusCode;
            const message = error?.message || '';
            
            // If it's a rate limit (429), server error (500/503), or not found (404), try the next model
            if (status === 404 || status === 429 || status === 500 || status === 503 || message.toLowerCase().includes('busy') || message.toLowerCase().includes('limit') || message.toLowerCase().includes('not found')) {
                console.warn(`[AI-Helper] Model ${modelId} failed (${status}), attempting fallback...`);
                continue;
            }
            throw error;
        }
    }

    console.error(`[AI-Helper] All models failed. Final error:`, lastError);
    throw lastError;
}

/**
 * Wraps generateText with a fallback mechanism that tries models in order.
 */
export async function generateTextWithFallback(options: any): Promise<GenerateTextResult<any, any>> {
    const models = ALL_PRIORITIZED_MODELS;
    let lastError: any;

    for (const modelId of models) {
        try {
            console.log(`[AI-Helper] Trying model: ${modelId}`);
            return await generateText({
                ...options,
                model: google(modelId),
            } as any);
        } catch (error: any) {
            lastError = error;
            const status = error?.status || error?.statusCode;
            const message = error?.message || '';

            if (status === 404 || status === 429 || status === 500 || status === 503 || message.toLowerCase().includes('busy') || message.toLowerCase().includes('limit') || message.toLowerCase().includes('not found')) {
                console.warn(`[AI-Helper] Model ${modelId} failed (${status}), attempting fallback...`);
                continue;
            }
            throw error;
        }
    }

    throw lastError;
}
