import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const email = process.env.PLATFORM_ADMIN_EMAIL;
  const password = process.env.PLATFORM_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD must be set in environment.');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[Seed Platform Admin] Checking account for: ${normalizedEmail}...`);

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.platformAdmin.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    console.log(`[Seed Platform Admin] Admin already exists (id: ${existing.id}). Updating credentials...`);
    const updated = await prisma.platformAdmin.update({
      where: { id: existing.id },
      data: { passwordHash },
    });
    console.log(`[Seed Platform Admin] Successfully updated platform admin account: ${updated.email}`);
  } else {
    const created = await prisma.platformAdmin.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    });
    console.log(`[Seed Platform Admin] Successfully created platform admin account: ${created.email} (id: ${created.id})`);
  }
}

main()
  .catch((e) => {
    console.error('[Seed Platform Admin] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
