import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnv();

async function main() {
  const key = process.env.GEMINI_API_KEY;

  console.log('GEMINI_API_KEY set:', Boolean(key));
  console.log('GEMINI_API_KEY length:', key?.length ?? 0);

  if (!key) {
    console.error('ERROR: GEMINI_API_KEY is missing from .env');
    process.exit(1);
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key);

  const models = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-2.0-flash',
  ];

  console.log('\nTesting models...\n');

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Reply with only the word: OK');
      const text = result.response.text().trim();
      console.log(`✓ ${modelName} -> "${text}"`);
    } catch (error) {
      const err = error as Error;
      console.log(`✗ ${modelName} -> ${err.message}`);
    }
  }
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
