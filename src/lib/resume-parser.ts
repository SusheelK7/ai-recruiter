// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export class UnreadableResumeError extends Error {
  constructor(message = "We couldn't read your resume file. Please upload a valid PDF or DOCX file.") {
    super(message);
    this.name = 'UnreadableResumeError';
  }
}

export class InvalidResumeContentError extends Error {
  constructor(message = "This doesn't appear to be a valid resume. Please check your file and try again.") {
    super(message);
    this.name = 'InvalidResumeContentError';
  }
}

/**
 * Extracts raw text from a PDF or DOCX resume buffer.
 * Throws UnreadableResumeError if the file is corrupted, password-protected, or unparseable.
 */
export async function extractTextFromResume(
  buffer: Buffer,
  mimeType?: string,
  filename?: string
): Promise<string> {
  const isPdf =
    mimeType === 'application/pdf' ||
    (filename && filename.toLowerCase().endsWith('.pdf')) ||
    (buffer.length >= 4 && buffer.slice(0, 4).toString('utf-8') === '%PDF');

  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    (filename && (filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc')));

  let extractedText = '';

  try {
    if (isPdf) {
      const data = await pdfParse(buffer);
      extractedText = data.text || '';
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } else {
      // Try PDF first as fallback, then DOCX
      try {
        const data = await pdfParse(buffer);
        extractedText = data.text || '';
      } catch {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      }
    }
  } catch (error: any) {
    console.error('Resume extraction failed:', error?.message || error);
    throw new UnreadableResumeError();
  }

  return extractedText.trim();
}

/**
 * Common resume-like terms used to detect valid career/academic documents.
 */
const RESUME_KEYWORDS = [
  'experience',
  'education',
  'skills',
  'skill',
  'project',
  'projects',
  'employment',
  'work',
  'role',
  'responsibilities',
  'developer',
  'engineer',
  'manager',
  'analyst',
  'designer',
  'consultant',
  'intern',
  'internship',
  'university',
  'college',
  'school',
  'degree',
  'bachelor',
  'master',
  'phd',
  'diploma',
  'certifications',
  'certified',
  'contact',
  'email',
  'phone',
  'summary',
  'profile',
  'objective',
  'history',
  'achievements',
  'technologies',
  'stack',
  'languages',
  'software',
  'leadership',
  'management',
  'curriculum',
  'vitae',
  'resume',
];

/**
 * Common placeholder words found in Lorem Ipsum text.
 */
const LOREM_IPSUM_WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
];

/**
 * Validates whether the extracted text is resume-like.
 * Returns isValid: false with a user-friendly error message if text is too short,
 * pure gibberish/symbols, or generic placeholder text (like Lorem Ipsum).
 */
export function validateResumeText(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: "We couldn't read your resume file. Please upload a valid PDF or DOCX file.",
    };
  }

  // Count alphanumeric words
  const words = text
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 0);

  // Minimum ~50 words threshold
  if (words.length < 50) {
    return {
      isValid: false,
      error: "This doesn't appear to be a valid resume. Please check your file and try again.",
    };
  }

  // Check for symbol-to-word ratio (detect gibberish / corrupted encoding)
  const nonSymbolChars = text.replace(/[^a-zA-Z0-9\s]/g, '').length;
  const totalChars = text.trim().length;
  if (totalChars > 0 && nonSymbolChars / totalChars < 0.45) {
    return {
      isValid: false,
      error: "This doesn't appear to be a valid resume. Please check your file and try again.",
    };
  }

  // Check for Lorem Ipsum placeholder text
  let loremCount = 0;
  for (const w of words) {
    if (LOREM_IPSUM_WORDS.includes(w)) {
      loremCount++;
    }
  }

  const loremRatio = loremCount / words.length;
  if (loremRatio > 0.35) {
    return {
      isValid: false,
      error: "This doesn't appear to be a valid resume. Please check your file and try again.",
    };
  }

  // Count resume structure keywords
  const uniqueWords = new Set(words);
  let resumeKeywordMatches = 0;
  for (const keyword of RESUME_KEYWORDS) {
    if (uniqueWords.has(keyword)) {
      resumeKeywordMatches++;
    }
  }

  // A realistic resume will almost always match at least 2 common resume keywords
  if (resumeKeywordMatches < 2) {
    return {
      isValid: false,
      error: "This doesn't appear to be a valid resume. Please check your file and try again.",
    };
  }

  return { isValid: true };
}
