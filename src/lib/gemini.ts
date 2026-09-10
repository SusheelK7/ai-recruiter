import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

export const GEMINI_FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

export function getGeminiModel(modelName?: string, generationConfig?: GenerationConfig) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    generationConfig,
  });
}

export interface GenerateWithFallbackOptions {
  generationConfig?: GenerationConfig;
  timeoutMs?: number;
  models?: string[];
  maxAttemptsPerModel?: number;
}

export async function generateWithFallback(
  prompt: string,
  options: GenerateWithFallbackOptions = {}
): Promise<{ text: string; modelName: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const models = options.models || GEMINI_FALLBACK_MODELS;
  const timeoutMs = options.timeoutMs || 12000;
  const maxAttempts = options.maxAttemptsPerModel || 2;
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError: unknown = null;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini] Attempting "${modelName}" (attempt ${attempt}/${maxAttempts})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: options.generationConfig,
        });

        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);

        const text = result.response.text().trim();
        if (text) {
          console.log(`[Gemini] Success using "${modelName}".`);
          return { text, modelName };
        }
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini] "${modelName}" attempt ${attempt} failed: ${msg.split('\n')[0]}`);

        // If 503 high demand or 404 not found, don't waste time retrying the exact same model - failover immediately to next model
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('404') || msg.includes('not found')) {
          break;
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks failed');
}

export function getGeminiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
      return 'Invalid GEMINI_API_KEY. Check your key in Google AI Studio.';
    }
    if (error.message.includes('high demand') || error.message.includes('503 Service Unavailable')) {
      return 'Gemini AI is experiencing high demand. Please try again in a few moments.';
    }
    if (error.message.includes('no longer available') || error.message.includes('not found')) {
      return 'Gemini model unavailable. Falling back to active models.';
    }
    if (error.message.includes('quota') || error.message.includes('429')) {
      return 'Gemini API quota exceeded. Try again later or check Google AI Studio billing.';
    }
    if (error.message.includes('Timeout')) {
      return 'Gemini request timed out. Please try again.';
    }
    return error.message;
  }
  return 'Unknown Gemini API error';
}

