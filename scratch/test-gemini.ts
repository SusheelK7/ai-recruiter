import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function main() {
  const models = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Return JSON: {"ok": true}');
      console.log(`[SUCCESS] ${m}:`, result.response.text());
      break;
    } catch (e: any) {
      console.log(`[FAILED] ${m}:`, e.message);
    }
  }
}

main();
