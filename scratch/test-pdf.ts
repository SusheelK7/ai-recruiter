import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import pdfParse from 'pdf-parse';

async function test() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 800]);
  page.drawText('Hello World. This is Jane Doe, Senior Software Engineer.', { x: 50, y: 700, font, size: 12 });
  const bytes = await doc.save({ useObjectStreams: false });
  const buffer = Buffer.from(bytes);
  console.log('Buffer length:', buffer.length);
  const parsed = await pdfParse(buffer);
  console.log('Parsed text:', parsed.text);
}

test().catch(console.error);
