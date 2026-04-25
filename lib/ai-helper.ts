import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText, type GenerateObjectResult, type GenerateTextResult } from 'ai';
import { ALL_PRIORITIZED_MODELS } from '@/constants/ai';

/**
 * Retrieves all available Google AI API keys from the environment.
 */
function getApiKeys(): string[] {
    const keys = [
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
        process.env.GOOGLE_GENERATIVE_AI_API_KEY_3,
    ].filter(Boolean) as string[];
    return keys.length > 0 ? keys : [''];
}

/**
 * Wraps generateObject with a fallback mechanism that tries models and API keys in order.
 */
export async function generateObjectWithFallback<T>(options: any): Promise<GenerateObjectResult<T>> {
    const models = ALL_PRIORITIZED_MODELS;
    const apiKeys = getApiKeys();
    let lastError: any;

    // We try each API key for each model if needed
    for (const apiKey of apiKeys) {
        for (const modelId of models) {
            try {
                console.log(`[AI-Helper] Trying model: ${modelId} ${apiKeys.length > 1 ? `(Key: ...${apiKey.slice(-4)})` : ''}`);
                return await generateObject({
                    ...options,
                    model: createGoogleGenerativeAI({ apiKey })(modelId),
                    maxRetries: 0, // Disable internal retries so our fallback logic can switch keys/models immediately
                } as any);
            } catch (error: any) {
                lastError = error;
                const status = error?.status || error?.statusCode;
                const message = error?.message || '';
                
                // If it's a rate limit (429), server error (500/503), or not found (404), try the next model/key
                const isQuotaError = status === 429 || message.toLowerCase().includes('quota') || message.toLowerCase().includes('exhausted') || message.toLowerCase().includes('depleted');
                if (status === 404 || isQuotaError || status === 500 || status === 503 || message.toLowerCase().includes('busy') || message.toLowerCase().includes('limit') || message.toLowerCase().includes('not found')) {
                    console.warn(`[AI-Helper] Model ${modelId} failed (${status || 'Error'}). Attempting next fallback...`);
                    
                    // If we hit a quota limit, we should try the next API key instead of just the next model
                    if (isQuotaError) {
                        console.warn(`[AI-Helper] Quota hit for current key. Switching to next available key...`);
                        break; // Break the model loop to move to the next API key
                    }
                    continue; // Try the next model with the same key
                }
                
                throw error;
            }
        }
    }

    console.error(`[AI-Helper] All models and API keys failed. Final error:`, lastError);
    throw lastError;
}

/**
 * Wraps generateText with a fallback mechanism that tries models and API keys in order.
 */
export async function generateTextWithFallback(options: any): Promise<GenerateTextResult<any, any>> {
    const models = ALL_PRIORITIZED_MODELS;
    const apiKeys = getApiKeys();
    let lastError: any;

    for (const apiKey of apiKeys) {
        for (const modelId of models) {
            try {
                console.log(`[AI-Helper] Trying model: ${modelId} ${apiKeys.length > 1 ? `(Key: ...${apiKey.slice(-4)})` : ''}`);
                return await generateText({
                    ...options,
                    model: createGoogleGenerativeAI({ apiKey })(modelId),
                    maxRetries: 0,
                } as any);
            } catch (error: any) {
                lastError = error;
                const status = error?.status || error?.statusCode;
                const message = error?.message || '';

                const isQuotaError = status === 429 || message.toLowerCase().includes('quota') || message.toLowerCase().includes('exhausted') || message.toLowerCase().includes('depleted');
                if (status === 404 || isQuotaError || status === 500 || status === 503 || message.toLowerCase().includes('busy') || message.toLowerCase().includes('limit') || message.toLowerCase().includes('not found')) {
                    console.warn(`[AI-Helper] Model ${modelId} failed (${status || 'Error'}). Attempting next fallback...`);
                    
                    if (isQuotaError) {
                        break;
                    }
                    continue;
                }
                throw error;
            }
        }
    }

    throw lastError;
}
