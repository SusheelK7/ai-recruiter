import pdfParse from 'pdf-parse';

function generateValidPdf(lines: string[]): Buffer {
  const textStreams = lines.map((line, idx) => {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    return `BT /F1 11 Tf 50 ${750 - idx * 16} Td (${escaped}) Tj ET`;
  }).join('\n');

  const streamLength = Buffer.byteLength(textStreams, 'utf-8');

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];

  const addObj = (objContent: string) => {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += objContent + '\n';
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj');
  addObj(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStreams}\nendstream\nendobj`);
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  const startxref = Buffer.byteLength(body, 'latin1');
  let xref = 'xref\r\n0 6\r\n0000000000 65535 f\r\n';
  for (const offset of offsets) {
    const offsetStr = String(offset).padStart(10, '0');
    xref += `${offsetStr} 00000 n\r\n`;
  }

  body += xref;
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(body, 'latin1');
}

async function test() {
  const pdf = generateValidPdf([
    'Jane Doe',
    'Senior Software Engineer | San Francisco, CA | jane.doe@example.com',
    'PROFESSIONAL SUMMARY',
    'Experienced Full-Stack Developer with 6+ years building web applications with TypeScript, Next.js, and PostgreSQL.',
    'WORK EXPERIENCE',
    'Lead Engineer at CloudTech (2022-Present): Scaled Next.js dashboard, designed PostgreSQL schemas.',
    'EDUCATION',
    'BS in Computer Science - UC Berkeley',
    'SKILLS',
    'TypeScript, React, Next.js, PostgreSQL, Docker, Gemini AI',
  ]);

  console.log('Testing PDF, length:', pdf.length);
  const parsed = await pdfParse(pdf);
  console.log('SUCCESS! Parsed text:\n', parsed.text);
}

test().catch(console.error);
