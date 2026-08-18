import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

async function main() {
  const filePath = path.join(process.cwd(), 'node_modules/pdf-parse/test/data/04-valid.pdf');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  console.log('04-valid.pdf parsed text length:', data.text.length);
  console.log('04-valid.pdf snippet:', data.text.slice(0, 200));
}

main();
