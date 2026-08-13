import { buildJobGenerationPrompt } from '../src/lib/job-description';

console.log('=== TESTING KEYWORD AI GENERATION PROMPT BUILDING ===\n');

const promptWithKeywords = buildJobGenerationPrompt(
  'Senior React Engineer',
  'senior',
  'Acme Global Tech',
  'Remote role, salary $130,000 - $160,000 USD, needs Next.js, Tailwind, GraphQL, 5+ years experience, fast startup environment.'
);

console.log('Generated Prompt:\n------------------');
console.log(promptWithKeywords);
console.log('------------------\n');

if (
  !promptWithKeywords.includes('RECRUITER INPUT KEYWORDS') ||
  !promptWithKeywords.includes('DO NOT assume or hardcode regional location defaults such as India')
) {
  throw new Error('Prompt missing critical keyword or location guidelines');
}

console.log('✅ Keyword prompt building test passed!');
