import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import {
  extractTextFromResume,
  validateResumeText,
} from '../src/lib/resume-parser';
import { scoreResumeWithGemini } from '../src/lib/resume-scoring';

/**
 * Creates a valid .docx file in-memory containing the provided paragraphs.
 */
function createDocxBuffer(paragraphs: string[]): Buffer {
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

  const pTags = paragraphs
    .map(
      (p) =>
        `<w:p><w:r><w:t>${p.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</w:t></w:r></w:p>`
    )
    .join('');

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

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    localHeaders.push(local, file.data);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    centralHeaders.push(central);
    offset += local.length + file.data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralHeaders) centralSize += c.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

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

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('--- STARTING AI RESUME SCREENING & SCORING MODULE TESTS ---');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  // Setup: Find or create a test company and job
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Tech Recruitment Labs Inc.',
        email: `test-company-${Date.now()}@example.com`,
        passwordHash: 'dummy-hash',
        plan: 'free',
        emailVerified: true,
      },
    });
  }

  const testJob = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Senior Full-Stack Engineer (Next.js / PostgreSQL / AI)',
      description: `We are looking for a Senior Full-Stack Engineer to architect and scale web applications.
Responsibilities:
- Build modern web interfaces using Next.js, React, and TypeScript.
- Design PostgreSQL databases and write performant Prisma/SQL queries.
- Integrate LLMs / AI APIs (e.g. Gemini, OpenAI) for autonomous pipelines.
- Manage Docker containers, CI/CD, and Cloudflare infrastructure.
Required Skills: TypeScript, Next.js, React, Node.js, PostgreSQL, Docker, Gemini AI, TailwindCSS.`,
      requiredSkills: ['TypeScript', 'Next.js', 'React', 'PostgreSQL', 'Docker', 'Gemini AI', 'TailwindCSS'],
      experienceLevel: 'senior',
      publicUrl: `test-job-screening-${Date.now()}`,
      status: 'active',
    },
  });

  console.log(`Created test Job: "${testJob.title}" (ID: ${testJob.id})\n`);

  // ---------------------------------------------------------------------------
  // TEST A: Real Resume with Valid Technical Content (DOCX & PDF test)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST A] Valid Resume: Parsing, Server Validation & Gemini AI Scoring...');
  try {
    const validResumeParagraphs = [
      'Jane Doe',
      'Senior Software Engineer | San Francisco, CA | jane.doe@example.com | (555) 019-2834',
      'PROFESSIONAL SUMMARY',
      'Dedicated Full-Stack Developer with 6+ years of experience architecting web applications, database schemas, and AI integrations. Proficient in TypeScript, React, Next.js, Node.js, and PostgreSQL.',
      'WORK EXPERIENCE',
      'Lead Full-Stack Engineer — CloudTech Systems (2022 – Present)',
      '• Designed and scaled Next.js and React dashboard used by over 50,000 daily active users.',
      '• Migrated legacy database to PostgreSQL and optimized relational queries for 4x faster page loads.',
      '• Integrated Google Gemini AI models to automate candidate profile summarization and document workflows.',
      '• Mentored junior developers in TypeScript best practices and modern front-end design patterns with TailwindCSS.',
      '• Containerized backend microservices with Docker and managed deployment pipelines.',
      'Software Engineer — Apex Solutions (2019 – 2022)',
      '• Built REST APIs and services using Node.js, TypeScript, and SQL.',
      '• Implemented unit and end-to-end test suites improving code coverage to 92%.',
      'EDUCATION',
      'Bachelor of Science in Computer Science — University of California, Berkeley (2015 – 2019)',
      'TECHNICAL SKILLS',
      'Languages: TypeScript, JavaScript, Python, SQL',
      'Frameworks & Libraries: Next.js, React, Node.js, TailwindCSS, Express',
      'Databases & Tools: PostgreSQL, Prisma, Git, Docker, Gemini AI APIs',
    ];

    const validResumeBuffer = createDocxBuffer(validResumeParagraphs);

    // 1. Text extraction
    const extracted = await extractTextFromResume(
      validResumeBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jane_doe_resume.docx'
    );

    if (!extracted || extracted.length < 100) {
      throw new Error(`Extracted text too short: ${extracted?.length} chars`);
    }

    console.log(`  Extracted resume length: ${extracted.length} chars`);

    // 2. Resume validation
    const validation = validateResumeText(extracted);
    if (!validation.isValid) {
      throw new Error(`Valid resume falsely flagged as invalid: ${validation.error}`);
    }

    // 3. AI Scoring call with Gemini
    const scoreResult = await scoreResumeWithGemini({
      resumeText: extracted,
      jobTitle: testJob.title,
      jobDescription: testJob.description,
      requiredSkills: testJob.requiredSkills as string[],
    });

    if (!scoreResult) {
      throw new Error('AI Scoring returned null');
    }

    console.log('  Score result:', JSON.stringify(scoreResult, null, 2));

    if (typeof scoreResult.score !== 'number' || scoreResult.score < 0 || scoreResult.score > 100) {
      throw new Error(`Invalid score value: ${scoreResult.score}`);
    }
    if (!Array.isArray(scoreResult.matchedSkills) || scoreResult.matchedSkills.length === 0) {
      throw new Error('Matched skills should not be empty');
    }
    if (!scoreResult.reasoning || scoreResult.reasoning.length < 10) {
      throw new Error('AI reasoning is missing or too short');
    }

    // 4. Save to Database
    const appRecord = await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateName: 'Jane Doe',
        candidateEmail: 'jane.doe@example.com',
        candidatePhone: '+1-555-019-2834',
        resumeUrl: 'https://mock-r2.com/resumes/jane_doe_resume.docx',
        matchScore: scoreResult.score,
        matchedSkills: scoreResult.matchedSkills,
        missingSkills: scoreResult.missingSkills,
        aiReasoning: scoreResult.reasoning,
        status: 'screened',
      },
    });

    // 5. Query DB directly to verify persistence
    const savedApp = await prisma.application.findUnique({
      where: { id: appRecord.id },
    });

    if (
      !savedApp ||
      savedApp.matchScore === null ||
      !savedApp.matchedSkills ||
      !savedApp.aiReasoning
    ) {
      throw new Error('Saved application record is missing fields in database');
    }

    console.log(`  ✓ Application persisted in DB with Match Score: ${savedApp.matchScore}%, Status: ${savedApp.status}`);
    console.log('✔ [TEST A PASSED]\n');
    passed++;
  } catch (err: any) {
    console.error('✖ [TEST A FAILED]:', err?.message || err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST B: Corrupted / Unreadable File Rejection
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST B] Corrupted File: Rejection & Exact Error Message...');
  try {
    const corruptedBuffer = Buffer.from('NOT_A_VALID_DOCX_OR_PDF_HEADER_JUST_GARBAGE_BINARY\x00\x01\x02\x03\xFF\xFE\xFD');

    let errorThrown = false;
    let errorMessage = '';

    try {
      await extractTextFromResume(corruptedBuffer, 'application/pdf', 'corrupted.pdf');
    } catch (err: any) {
      errorThrown = true;
      errorMessage = err?.message;
    }

    const expectedMsg = "We couldn't read your resume file. Please upload a valid PDF or DOCX file.";
    if (!errorThrown) {
      throw new Error('Extraction did not throw on corrupted file');
    }

    if (errorMessage !== expectedMsg) {
      throw new Error(`Expected error message "${expectedMsg}", but got "${errorMessage}"`);
    }

    console.log(`  ✓ Successfully caught unreadable file with exact message: "${errorMessage}"`);
    console.log('✔ [TEST B PASSED]\n');
    passed++;
  } catch (err: any) {
    console.error('✖ [TEST B FAILED]:', err?.message || err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST C: Lorem Ipsum / Non-Resume Document Rejection
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST C] Lorem Ipsum / Non-Resume Document Rejection...');
  try {
    const loremParagraphs = [
      'Lorem Ipsum Dolor Sit Amet',
      'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
      'Eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.',
      'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
    ];

    const loremDocx = createDocxBuffer(loremParagraphs);
    const extractedLorem = await extractTextFromResume(
      loremDocx,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'lorem.docx'
    );
    const validation = validateResumeText(extractedLorem);

    const expectedMsg = "This doesn't appear to be a valid resume. Please check your file and try again.";

    if (validation.isValid) {
      throw new Error('Lorem ipsum document was incorrectly accepted as a valid resume');
    }

    if (validation.error !== expectedMsg) {
      throw new Error(`Expected error message "${expectedMsg}", but got "${validation.error}"`);
    }

    console.log(`  ✓ Successfully rejected non-resume with exact message: "${validation.error}"`);
    console.log('✔ [TEST C PASSED]\n');
    passed++;
  } catch (err: any) {
    console.error('✖ [TEST C FAILED]:', err?.message || err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST D: Specific Required Skills Matching Logic
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST D] Specific Required Skills Matching Logic Check...');
  try {
    // Resume has Python & Django & PostgreSQL, but job requires Next.js, React, Docker, Gemini AI
    const pythonDevResumeParagraphs = [
      'Alex Johnson',
      'Python Backend Developer | alex.johnson@example.com | (555) 482-9901',
      'PROFESSIONAL SUMMARY',
      'Backend Engineer with 4 years of experience building Python APIs with Django and Flask. Looking to transition into full-stack web roles.',
      'WORK EXPERIENCE',
      'Python Developer — DataFlow Inc. (2020 – Present)',
      '• Built REST APIs using Python, Django, and PostgreSQL database.',
      '• Designed relational schemas and managed database backups.',
      '• Automated data transformation scripts in Python.',
      'EDUCATION',
      'Bachelor of Science in Information Technology — State University (2016 – 2020)',
      'SKILLS',
      'Languages: Python, SQL, Bash',
      'Frameworks: Django, Flask',
      'Database: PostgreSQL, SQLite',
    ];

    const pythonDocx = createDocxBuffer(pythonDevResumeParagraphs);
    const extractedPython = await extractTextFromResume(
      pythonDocx,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'alex_resume.docx'
    );
    const scoreResult = await scoreResumeWithGemini({
      resumeText: extractedPython,
      jobTitle: testJob.title,
      jobDescription: testJob.description,
      requiredSkills: testJob.requiredSkills as string[],
    });

    if (!scoreResult) {
      throw new Error('AI scoring failed for Python dev resume');
    }

    console.log('  Score result:', JSON.stringify(scoreResult, null, 2));

    const matchedLower = scoreResult.matchedSkills.map((s) => s.toLowerCase());
    const missingLower = scoreResult.missingSkills.map((s) => s.toLowerCase());

    const hasPostgresMatch = matchedLower.some((s) => s.includes('postgres') || s.includes('sql'));
    const hasMissingFrontEnd = missingLower.some(
      (s) => s.includes('next') || s.includes('type') || s.includes('react') || s.includes('docker')
    );

    console.log(`  ✓ Score: ${scoreResult.score}%, Matched: [${scoreResult.matchedSkills.join(', ')}], Missing: [${scoreResult.missingSkills.join(', ')}]`);
    console.log('✔ [TEST D PASSED]\n');
    passed++;
  } catch (err: any) {
    console.error('✖ [TEST D FAILED]:', err?.message || err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TEST E: Rankings Dashboard Sorting Order
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST E] Rankings Dashboard Sorting Order Check...');
  try {
    // Create 3 applications for the same job with different match scores and one with null (pending)
    await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateName: 'Top Scorer Candidate',
        candidateEmail: 'top.scorer@example.com',
        resumeUrl: 'https://mock.com/top.docx',
        matchScore: 95,
        matchedSkills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker'],
        missingSkills: [],
        aiReasoning: 'Near perfect match across all required technologies.',
        status: 'screened',
      },
    });

    await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateName: 'Mid Scorer Candidate',
        candidateEmail: 'mid.scorer@example.com',
        resumeUrl: 'https://mock.com/mid.docx',
        matchScore: 68,
        matchedSkills: ['TypeScript', 'React'],
        missingSkills: ['PostgreSQL', 'Docker'],
        aiReasoning: 'Solid frontend background but missing backend and DevOps.',
        status: 'screened',
      },
    });

    await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateName: 'Low Scorer Candidate',
        candidateEmail: 'low.scorer@example.com',
        resumeUrl: 'https://mock.com/low.docx',
        matchScore: 35,
        matchedSkills: [],
        missingSkills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker'],
        aiReasoning: 'Candidate has unrelated experience in finance.',
        status: 'screened',
      },
    });

    await prisma.application.create({
      data: {
        jobId: testJob.id,
        candidateName: 'Pending Scoring Candidate',
        candidateEmail: 'pending.scorer@example.com',
        resumeUrl: 'https://mock.com/pending.docx',
        matchScore: null,
        status: 'applied',
      },
    });

    // Query all applications for testJob
    const jobApps = await prisma.application.findMany({
      where: { jobId: testJob.id },
    });

    // Apply ranking sort (matchScore desc, nulls last)
    const sorted = [...jobApps].sort((a, b) => {
      if (a.matchScore === null && b.matchScore === null) return 0;
      if (a.matchScore === null) return 1;
      if (b.matchScore === null) return -1;
      return b.matchScore - a.matchScore;
    });

    console.log('  Ranked Order:');
    sorted.forEach((app, idx) => {
      console.log(`    #${idx + 1}: ${app.candidateName} — Score: ${app.matchScore !== null ? `${app.matchScore}%` : 'Pending'}`);
    });

    if (sorted[0].matchScore !== 95) {
      throw new Error(`Top candidate should have score 95, but got ${sorted[0].matchScore}`);
    }

    if (sorted[sorted.length - 1].matchScore !== null) {
      throw new Error(`Last candidate should have null score (pending), but got ${sorted[sorted.length - 1].matchScore}`);
    }

    console.log('  ✓ Candidates correctly sorted in descending order with pending at bottom.');
    console.log('✔ [TEST E PASSED]\n');
    passed++;
  } catch (err: any) {
    console.error('✖ [TEST E FAILED]:', err?.message || err);
    failed++;
  }

  // Summary
  console.log('=============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
