import { PDFDocument, StandardFonts } from 'pdf-lib';
import pdfParse from 'pdf-parse';

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('Jane Doe\nSenior Full-Stack Engineer\nExperience in TypeScript and React\nEducation: BS in Computer Science\nSkills: Next.js, Node.js, PostgreSQL, Docker, AI', {
    x: 50,
    y: 800,
    size: 12,
    font,
  });

  // Test save options
  const pdfBytes = await doc.save();
  const buffer = Buffer.from(pdfBytes);
  console.log('PDF bytes length:', buffer.length);
  try {
    const data = await pdfParse(buffer);
    console.log('Successfully parsed with pdf-parse:', data.text);
  } catch (err: any) {
    console.error('Error with pdf-parse:', err);
  }
}

main();
