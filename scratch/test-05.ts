import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

async function main() {
  const file05 = path.join(process.cwd(), 'node_modules/pdf-parse/test/data/05-versions-space.pdf');
  const d5 = await pdfParse(fs.readFileSync(file05));
  console.log('05 parsed:', d5.text.slice(0, 100));
}

main();
