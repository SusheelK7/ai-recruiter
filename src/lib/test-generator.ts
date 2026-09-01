import { GoogleGenerativeAI } from '@google/generative-ai';
import { cleanJsonResponse } from '@/lib/resume-scoring';

export interface GeneratedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GenerateTestParams {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[] | string;
  candidateName: string;
  resumeText: string;
}

/**
 * Builds the AI prompt for Gemini to generate tailored MCQ questions based on
 * BOTH the job requirements and the candidate's resume.
 */
export function buildTestGenerationPrompt(params: GenerateTestParams): string {
  const { jobTitle, jobDescription, requiredSkills, candidateName, resumeText } = params;
  const skillsList = Array.isArray(requiredSkills)
    ? requiredSkills.join(', ')
    : typeof requiredSkills === 'string'
      ? requiredSkills
      : 'General technical skills';

  return `You are an expert technical interviewer and talent assessor.
Generate a rigorous, fair, 8-to-10 question Multiple Choice Question (MCQ) assessment for a candidate applying for the role below.

TARGET JOB TITLE:
${jobTitle}

REQUIRED SKILLS & RESPONSIBILITIES:
Skills: ${skillsList}
Description: ${jobDescription}

CANDIDATE NAME:
${candidateName}

CANDIDATE RESUME TEXT:
"""
${resumeText.slice(0, 4000)}
"""

CRITICAL INSTRUCTIONS:
1. Generate between 8 and 10 multiple-choice questions.
2. The questions MUST probe the specific skills and technical concepts required for this job.
3. Tailor the questions to this candidate: weight questions toward areas where the candidate's resume shows relevant experience or adjacent skills to test real-world depth and understanding.
4. Each question must have EXACTLY 4 plausible options.
5. Provide the exact string value of the correct answer in "correctAnswer" (which MUST match one of the 4 options exactly).
6. Return STRICT JSON ONLY. Do not wrap in markdown or add explanations.

REQUIRED JSON OUTPUT FORMAT:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear technical question text here?",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": "Option A text"
    }
  ]
}`;
}

/**
 * Validates and normalizes generated MCQ questions.
 */
export function validateTestQuestions(rawQuestions: any): GeneratedQuestion[] | null {
  if (!Array.isArray(rawQuestions) || rawQuestions.length < 5) {
    return null;
  }

  const validQuestions: GeneratedQuestion[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) {
      continue;
    }

    const trimmedQuestion = q.question.trim();
    const cleanOptions = q.options
      .map((opt: any) => (typeof opt === 'string' ? opt.trim() : ''))
      .filter((opt: string) => opt.length > 0);

    if (trimmedQuestion.length < 5 || cleanOptions.length < 4) {
      continue;
    }

    // Ensure 4 options
    const finalOptions = cleanOptions.slice(0, 4);

    let correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';

    // If correctAnswer is not one of the options, try to match by letter (A, B, C, D) or index
    if (!finalOptions.includes(correctAnswer)) {
      if (/^[A-D]$/i.test(correctAnswer)) {
        const index = correctAnswer.toUpperCase().charCodeAt(0) - 65;
        if (finalOptions[index]) {
          correctAnswer = finalOptions[index];
        }
      } else {
        // Fallback: pick first option if invalid
        correctAnswer = finalOptions[0];
      }
    }

    validQuestions.push({
      id: i + 1,
      question: trimmedQuestion,
      options: finalOptions,
      correctAnswer,
    });
  }

  return validQuestions.length >= 5 ? validQuestions : null;
}

/**
 * Generates fallback questions in the event of an external API failure.
 */
export function getFallbackQuestions(jobTitle: string): GeneratedQuestion[] {
  return [
    {
      id: 1,
      question: `In a production environment for a ${jobTitle} role, what is the best practice for handling sensitive configuration credentials?`,
      options: [
        'Hardcode credentials directly in repository source code',
        'Use environment variables or a dedicated secret management vault',
        'Store secrets in public client-side JavaScript bundles',
        'Commit configuration files with plain-text credentials to version control',
      ],
      correctAnswer: 'Use environment variables or a dedicated secret management vault',
    },
    {
      id: 2,
      question: 'Which of the following best describes the principle of idempotent operations in API design?',
      options: [
        'An operation that can be executed multiple times without changing the result beyond the initial execution',
        'An operation that always deletes all related database records',
        'An operation that runs asynchronously without returning any response',
        'An operation that produces a random status code on each request',
      ],
      correctAnswer: 'An operation that can be executed multiple times without changing the result beyond the initial execution',
    },
    {
      id: 3,
      question: 'What is the primary benefit of database indexing?',
      options: [
        'Decreases storage space used by tables',
        'Speeds up query retrieval operations at the cost of slight overhead on writes',
        'Automatically encrypts data columns at rest',
        'Replaces the need for primary keys in relational schemas',
      ],
      correctAnswer: 'Speeds up query retrieval operations at the cost of slight overhead on writes',
    },
    {
      id: 4,
      question: 'When debugging a critical performance bottleneck in a distributed system, what is the recommended first step?',
      options: [
        'Immediately rewrite the entire codebase in a different language',
        'Analyze logs, telemetry metrics, and profiling traces to identify the exact hotspot',
        'Randomly restart database nodes',
        'Disable all automated unit tests to reduce build times',
      ],
      correctAnswer: 'Analyze logs, telemetry metrics, and profiling traces to identify the exact hotspot',
    },
    {
      id: 5,
      question: 'What does the ACID acronym stand for in relational database management?',
      options: [
        'Atomicity, Consistency, Isolation, Durability',
        'Authentication, Connection, Integrity, Distribution',
        'Asynchronous, Concurrency, Iteration, Deployment',
        'Aggregation, Compilation, Interface, Dependency',
      ],
      correctAnswer: 'Atomicity, Consistency, Isolation, Durability',
    },
    {
      id: 6,
      question: 'Which HTTP status code indicates that the client request lacked valid authentication credentials?',
      options: [
        '200 OK',
        '401 Unauthorized',
        '404 Not Found',
        '500 Internal Server Error',
      ],
      correctAnswer: '401 Unauthorized',
    },
    {
      id: 7,
      question: 'In modern software engineering, what is the core purpose of Continuous Integration (CI)?',
      options: [
        'Deploy code directly to production without testing',
        'Automatically build, lint, and run tests on code changes whenever commits are pushed',
        'Replace human code reviews entirely',
        'Generate marketing release notes for end-users',
      ],
      correctAnswer: 'Automatically build, lint, and run tests on code changes whenever commits are pushed',
    },
    {
      id: 8,
      question: 'Which data structure offers average O(1) time complexity for search, insertion, and deletion by key?',
      options: [
        'Linked List',
        'Hash Map / Hash Table',
        'Binary Search Tree',
        'Array List without index',
      ],
      correctAnswer: 'Hash Map / Hash Table',
    },
  ];
}

/**
 * Generates tailored MCQ questions using Gemini API with retry and fallback.
 */
export async function generateTestWithGemini(
  params: GenerateTestParams
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Test Generator] No GEMINI_API_KEY found, using fallback questions.');
    return getFallbackQuestions(params.jobTitle);
  }

  const prompt = buildTestGenerationPrompt(params);
  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
  ];

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `[Test Generator] Generating questions for "${params.jobTitle}" using model '${modelName}' (Attempt ${attempt}/2)...`
        );

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleaned = cleanJsonResponse(responseText);
        const parsed = JSON.parse(cleaned);

        const questionsArray = parsed.questions || parsed;
        const validated = validateTestQuestions(questionsArray);

        if (validated && validated.length >= 8) {
          console.log(
            `[Test Generator] Successfully generated ${validated.length} questions for candidate ${params.candidateName}.`
          );
          return validated;
        } else if (validated && validated.length >= 5) {
          console.log(
            `[Test Generator] Generated ${validated.length} questions (acceptable).`
          );
          return validated;
        }

        console.warn(
          `[Test Generator] Model '${modelName}' attempt ${attempt} returned insufficient valid questions.`
        );
      } catch (err: any) {
        console.error(
          `[Test Generator] Error on model '${modelName}' (Attempt ${attempt}/2):`,
          err?.message || err
        );
      }
    }
  }

  console.warn('[Test Generator] All AI attempts exhausted. Returning fallback questions.');
  return getFallbackQuestions(params.jobTitle);
}
