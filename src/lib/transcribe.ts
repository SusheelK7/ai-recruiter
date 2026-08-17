import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Sends in-memory video buffer directly to Gemini API for transcription.
 * The video buffer is NOT saved to disk or Cloudflare R2 at any point.
 * Tries multiple model variants as fallbacks. If all fail, returns null
 * to avoid blocking application submission.
 */
export async function transcribeVideoWithGemini(
  videoBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini Transcription] GEMINI_API_KEY is not configured in environment variables.');
    return null;
  }

  const base64Data = videoBuffer.toString('base64');
  const validMimeType = mimeType || 'video/webm';

  // Verified working models (Aug 2026). gemini-3.6-flash is the most reliable,
  // gemini-3.7-flash can hit 503s during peak demand, gemini-3.5-flash-lite is the cost-effective fallback.
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];

  for (let attempt = 0; attempt < modelsToTry.length; attempt++) {
    const modelName = modelsToTry[attempt];
    try {
      console.log(
        `[Gemini Transcription] Attempt ${attempt + 1}/${modelsToTry.length} using model '${modelName}', ` +
        `sending ${videoBuffer.length} bytes (${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB), ` +
        `mimeType=${validMimeType}`
      );

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt =
        'Please transcribe the spoken audio in this candidate video introduction verbatim. Return only the transcript text. If there is no clear speech, return "[No speech detected]".';

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: validMimeType,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text()?.trim();
      console.log(
        `[Gemini Transcription] Success on attempt ${attempt + 1} (${modelName}). ` +
        `Transcript length: ${text?.length || 0}`
      );
      return text || '[No speech detected]';
    } catch (err: any) {
      console.error(
        `[Gemini Transcription] Error on attempt ${attempt + 1} (${modelName}):`,
        err?.message || err
      );

      if (attempt === modelsToTry.length - 1) {
        console.error(
          '[Gemini Transcription] All model attempts exhausted. Returning null so application submission can still proceed.'
        );
        return null;
      }
      // Otherwise continue to next model
    }
  }

  return null;
}
