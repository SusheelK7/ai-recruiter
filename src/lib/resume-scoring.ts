import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ScoreResumeParams {
  resumeText: string;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[] | string;
}

export interface ResumeScoreResult {
  score: number; // 0 - 100
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

/**
 * Builds the scoring prompt for Gemini to evaluate a candidate's resume against a job posting.
 */
export function buildScoringPrompt(params: ScoreResumeParams): string {
  const { resumeText, jobTitle, jobDescription, requiredSkills } = params;
  const skillsList = Array.isArray(requiredSkills)
    ? requiredSkills.join(', ')
    : typeof requiredSkills === 'string'
    ? requiredSkills
    : 'Not specified';

  return `You are an expert AI talent recruiter. Evaluate the following candidate's resume against the target job posting and determine their match score and skills alignment.

TARGET JOB TITLE:
${jobTitle}

REQUIRED SKILLS:
${skillsList}

JOB DESCRIPTION & RESPONSIBILITIES:
${jobDescription}

CANDIDATE RESUME TEXT:
"""
${resumeText}
"""

EVALUATION RULES:
1. Provide an objective suitability score from 0 to 100 based on relevant skills, experience, and domain alignment.
2. Identify all skills in the job requirements that the candidate explicitly demonstrates in their resume ("matchedSkills").
3. Identify required or desired skills for this role that are missing or insufficiently documented in the resume ("missingSkills").
4. Provide a concise 1 to 2 sentence summary explaining the scoring rationale ("reasoning").
5. Return STRICT JSON ONLY. Do not include introductory text, explanations, or markdown code blocks.

REQUIRED JSON FORMAT:
{
  "score": 85,
  "matchedSkills": ["Skill 1", "Skill 2"],
  "missingSkills": ["Skill 3", "Skill 4"],
  "reasoning": "Candidate possesses strong experience in X and Y, but lacks documented hands-on experience with Z."
}`;
}

/**
 * Cleans markdown code block formatting (e.g. ```json ... ```) from raw Gemini output.
 */
export function cleanJsonResponse(rawText: string): string {
  let text = rawText.trim();
  // Remove markdown code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return text.trim();
}

/**
 * Validates and normalizes parsed JSON into ResumeScoreResult.
 */
export function validateScoringJson(parsed: any): ResumeScoreResult | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const rawScore = Number(parsed.score);
  if (isNaN(rawScore) || rawScore < 0 || rawScore > 100) return null;
  const score = Math.round(rawScore);

  const matchedSkills = Array.isArray(parsed.matchedSkills)
    ? parsed.matchedSkills.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim())
    : [];

  const missingSkills = Array.isArray(parsed.missingSkills)
    ? parsed.missingSkills.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim())
    : [];

  const reasoning = typeof parsed.reasoning === 'string' && parsed.reasoning.trim().length > 0
    ? parsed.reasoning.trim()
    : 'Scoring evaluation completed based on resume and job requirements.';

  return {
    score,
    matchedSkills,
    missingSkills,
    reasoning,
  };
}

/**
 * Scores a resume against a job posting using Google Gemini API.
 * Includes automatic retry on invalid JSON or API failure, and fails gracefully
 * to null so application creation is never blocked.
 */
export async function scoreResumeWithGemini(
  params: ScoreResumeParams
): Promise<ResumeScoreResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Resume Scoring] GEMINI_API_KEY is not configured in environment variables.');
    return null;
  }

  const prompt = buildScoringPrompt(params);
  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
  ];

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTry) {
    // Attempt with retry (up to 2 attempts per model)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `[Resume Scoring] Scoring resume for "${params.jobTitle}" using model '${modelName}' (Attempt ${attempt}/2)...`
        );

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleaned = cleanJsonResponse(responseText);
        const parsed = JSON.parse(cleaned);
        const validated = validateScoringJson(parsed);

        if (validated) {
          console.log(
            `[Resume Scoring] Successfully scored candidate resume with score: ${validated.score}/100`
          );
          return validated;
        }

        console.warn(
          `[Resume Scoring] Model '${modelName}' attempt ${attempt} returned invalid JSON schema:`,
          responseText
        );
      } catch (err: any) {
        console.error(
          `[Resume Scoring] Error on model '${modelName}' (Attempt ${attempt}/2):`,
          err?.message || err
        );
      }
    }
  }

  console.error('[Resume Scoring] All scoring attempts exhausted. Returning null for pending scoring.');
  return null;
}
