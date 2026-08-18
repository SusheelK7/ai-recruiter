import { PDFDocument, StandardFonts } from 'pdf-lib';
import pdfParse from 'pdf-parse';

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 800]);

  const lines = [
    'Jane Doe',
    'Senior Software Engineer | San Francisco, CA | jane.doe@example.com',
    'PROFESSIONAL SUMMARY',
    'Experienced Full-Stack Developer with 6+ years building web applications with TypeScript, Next.js, and PostgreSQL.',
    'WORK EXPERIENCE',
    'Lead Engineer at CloudTech: Scaled Next.js dashboard, designed PostgreSQL schemas.',
    'EDUCATION',
    'BS in Computer Science - UC Berkeley',
    'SKILLS',
    'TypeScript, React, Next.js, PostgreSQL, Docker, Gemini AI',
  ];

  let y = 750;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= 20;
  }

  const pdfBytes = await doc.save();
  const buffer = Buffer.from(pdfBytes);

  console.log('Testing pdf-parse with default vs v2.0.550...');
  try {
    const data = await pdfParse(buffer, { version: 'v2.0.550' });
    console.log('SUCCESS with v2.0.550! Text:\n', data.text);
  } catch (err: any) {
    console.error('FAILED with v2.0.550:', err.message);
  }
}

main();
