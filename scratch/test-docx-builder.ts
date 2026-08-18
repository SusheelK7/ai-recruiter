import mammoth from 'mammoth';
import zlib from 'zlib';

// Minimal zip creator in pure Node (no external dependencies needed)
function createDocx(paragraphs: string[]): Buffer {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const pTags = paragraphs.map(p => `<w:p><w:r><w:t>${p.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</w:t></w:r></w:p>`).join('');
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pTags}
  </w:body>
</w:document>`;

  const files = [
    { name: '[Content_Types].xml', data: Buffer.from(contentTypesXml, 'utf-8') },
    { name: '_rels/.rels', data: Buffer.from(relsXml, 'utf-8') },
    { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf-8') },
  ];

  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf-8');
    const crc = crc32(file.data);

    // Local file header (30 bytes + name)
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // compression: 0 = store
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(crc, 14); // crc32
    local.writeUInt32LE(file.data.length, 18); // comp size
    local.writeUInt32LE(file.data.length, 22); // uncomp size
    local.writeUInt16LE(nameBuf.length, 26); // name len
    local.writeUInt16LE(0, 28); // extra len
    nameBuf.copy(local, 30);

    localHeaders.push(local, file.data);

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(0, 10); // compression
    central.writeUInt16LE(0, 12); // time
    central.writeUInt16LE(0, 14); // date
    central.writeUInt32LE(crc, 16); // crc32
    central.writeUInt32LE(file.data.length, 20); // comp size
    central.writeUInt32LE(file.data.length, 24); // uncomp size
    central.writeUInt16LE(nameBuf.length, 28); // name len
    central.writeUInt16LE(0, 30); // extra len
    central.writeUInt16LE(0, 32); // comment len
    central.writeUInt16LE(0, 34); // disk start
    central.writeUInt16LE(0, 36); // int attrs
    central.writeUInt32LE(0, 38); // ext attrs
    central.writeUInt32LE(offset, 42); // local header offset
    nameBuf.copy(central, 46);

    centralHeaders.push(central);
    offset += local.length + file.data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralHeaders) centralSize += c.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk num
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralSize, 12); // central dir size
  eocd.writeUInt32LE(centralOffset, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

async function main() {
  const paragraphs = [
    'Jane Doe',
    'Senior Software Engineer | San Francisco, CA | jane.doe@example.com | (555) 019-2834',
    'PROFESSIONAL SUMMARY',
    'Dedicated Full-Stack Developer with 6+ years of experience architecting web applications with TypeScript, React, Next.js, Node.js, and PostgreSQL.',
    'WORK EXPERIENCE',
    'Lead Full-Stack Engineer — CloudTech Systems (2022 – Present)',
    '• Designed and scaled Next.js dashboard used by over 50,000 daily active users.',
    '• Migrated database to PostgreSQL and optimized relational queries.',
    '• Integrated Google Gemini AI models to automate workflows.',
    'EDUCATION',
    'Bachelor of Science in Computer Science — UC Berkeley',
    'TECHNICAL SKILLS',
    'TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, Gemini AI, TailwindCSS',
  ];

  const docxBuffer = createDocx(paragraphs);
  console.log('Generated DOCX buffer length:', docxBuffer.length);
  const result = await mammoth.extractRawText({ buffer: docxBuffer });
  console.log('SUCCESS! Mammoth extracted text:\n', result.value);
}

main().catch(console.error);
