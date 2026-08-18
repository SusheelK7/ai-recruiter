import mammoth from 'mammoth';

// Minimal valid docx is a zip containing [Content_Types].xml, _rels/.rels, and word/document.xml
// Let's test with mammoth
async function test() {
  console.log('Mammoth available:', typeof mammoth.extractRawText);
}

test();
