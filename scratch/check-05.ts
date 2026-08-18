import fs from 'fs';
import path from 'path';

const file05 = path.join(process.cwd(), 'node_modules/pdf-parse/test/data/05-versions-space.pdf');
const content = fs.readFileSync(file05, 'utf-8');
console.log('05 header:', content.slice(0, 300));
console.log('05 tail:', content.slice(-400));
