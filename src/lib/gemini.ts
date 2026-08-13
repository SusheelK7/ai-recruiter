import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

export function getGeminiModel(modelName?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  });
}

export function getGeminiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
      return 'Invalid GEMINI_API_KEY. Check your key in Google AI Studio.';
    }
    if (error.message.includes('no longer available') || error.message.includes('not found')) {
      return 'Gemini model unavailable. Set GEMINI_MODEL in .env (e.g. gemini-3.5-flash).';
    }
    if (error.message.includes('quota') || error.message.includes('429')) {
      return 'Gemini API quota exceeded. Try again later or check billing.';
    }
    return error.message;
  }
  return 'Unknown Gemini API error';
}
