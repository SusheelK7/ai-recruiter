import pdfParse from 'pdf-parse';

// Let's test with a minimal standard valid PDF binary structure
function buildStandardPdf(text: string): Buffer {
  const content = `BT /F1 12 Tf 50 750 Td (${text}) Tj ET`;
  const streamLength = content.length;
  
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000335 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
412
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

async function main() {
  const pdf = buildStandardPdf('Jane Doe Senior Software Engineer Experience Education Skills React TypeScript Node.js');
  console.log('Testing custom standard PDF...');
  try {
    const res = await pdfParse(pdf);
    console.log('SUCCESS parse:', res.text);
  } catch (e: any) {
    console.error('FAILED parse:', e);
  }
}

main();
