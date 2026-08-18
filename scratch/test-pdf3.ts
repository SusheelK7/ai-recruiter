import { PDFDocument, StandardFonts } from 'pdf-lib';
import pdfParse from 'pdf-parse';

async function main() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 800]);

  const lines = [
    'Jane Doe',
    'Senior Software Engineer',
    'Experience: 6 years in full-stack engineering',
    'Skills: TypeScript, Next.js, React, Node.js, PostgreSQL',
  ];

  let y = 750;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= 20;
  }

  // Disable object streams and use custom save
  const pdfBytes = await doc.save({
    useObjectStreams: false,
    addDefaultPage: false,
  });

  console.log('PDF bytes length:', pdfBytes.length);
  try {
    const data = await pdfParse(Buffer.from(pdfBytes));
    console.log('Parsed text:', data.text);
  } catch (e: any) {
    console.error('Parse error:', e.message);
  }
}

main();
