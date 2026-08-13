import { readFileSync } from 'fs';
import { resolve } from 'path';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAuthToken } from '../src/lib/jwt';
import { getGeminiModel } from '../src/lib/gemini';

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function main() {
  console.log('=== Gemini Generate Job Test ===\n');

  // 1. Direct SDK test
  console.log('1. Direct SDK test (getGeminiModel)...');
  const model = getGeminiModel();
  const direct = await model.generateContent(
    'Return JSON only: {"description":"Test job","requiredSkills":["A","B"]}'
  );
  console.log('   ✓ SDK works. Response length:', direct.response.text().length);

  // 2. API route test
  console.log('\n2. API route test (/api/ai/generate-job)...');
  const email = 'gemini_api_test@example.com';
  const company = await prisma.company.findUnique({ where: { email } });
  if (company) {
    await prisma.job.deleteMany({ where: { companyId: company.id } });
    await prisma.user.deleteMany({ where: { companyId: company.id } });
    await prisma.company.delete({ where: { id: company.id } });
  }

  const passwordHash = await bcrypt.hash('TestPass123!', 12);
  const newCompany = await prisma.company.create({
    data: {
      name: 'Gemini Test Co',
      email,
      passwordHash,
      emailVerified: true,
      users: {
        create: { email, passwordHash, role: 'admin', emailVerified: true },
      },
    },
    include: { users: true },
  });

  const token = generateAuthToken({
    id: newCompany.users[0].id,
    companyId: newCompany.id,
    email: newCompany.email,
  });

  const res = await fetch(`${BASE_URL}/api/ai/generate-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `authToken=${token}`,
    },
    body: JSON.stringify({ title: 'Senior Frontend Engineer', experienceLevel: 'senior' }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('   ✗ API failed:', res.status, data.error);
    process.exit(1);
  }

  console.log('   ✓ API works');
  console.log('   Description preview:', data.description.slice(0, 80) + '...');
  console.log('   Skills:', data.requiredSkills.join(', '));

  await prisma.job.deleteMany({ where: { companyId: newCompany.id } });
  await prisma.user.deleteMany({ where: { companyId: newCompany.id } });
  await prisma.company.delete({ where: { id: newCompany.id } });

  console.log('\n=== ALL GEMINI TESTS PASSED ===');
}

main().catch((error) => {
  console.error('\nFAILED:', error.message || error);
  process.exit(1);
});
