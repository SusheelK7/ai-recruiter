import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

// Let's create a minimal valid PDF with exact bytes that pdf-parse parses 100% reliably
function createMinimalPdf(textContent: string): Buffer {
  const contentStream = `BT /F1 12 Tf 50 700 Td (${textContent.replace(/[()\\]/g, ' ')}) Tj ET`;
  const streamLen = contentStream.length;

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0]; // offset 0 is 0

  for (let i = 0; i < objects.length; i++) {
    offsets.push(body.length);
    body += objects[i];
  }

  const startxref = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  body += xref;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(body, 'binary');
}

async function test() {
  const buf = createMinimalPdf('Jane Doe Senior Software Engineer Experience in TypeScript Next.js React Node.js PostgreSQL Docker Gemini AI Education BS Computer Science');
  console.log('Testing buf length:', buf.length);
  try {
    const res = await pdfParse(buf);
    console.log('SUCCESS parsed:', res.text);
  } catch (err: any) {
    console.error('FAILED:', err.message);
  }
}

test();
