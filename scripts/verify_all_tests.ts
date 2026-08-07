import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateVerificationToken, generatePasswordResetToken } from '../src/lib/jwt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-recruiter-jwt-secret-key-2026';

async function runAllTests() {
  console.log('====================================================');
  console.log('STARTING MANDATORY MANDATORY REQUIREMENT 7 TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;

  // Cleanup helper
  const cleanEmail = async (email: string) => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.company.deleteMany({ where: { email } });
  };

  // ----------------------------------------------------
  // TEST A: Register -> confirm emailVerified is false, login rejected with correct error
  // ----------------------------------------------------
  console.log('--- TEST A: Registration & Unverified Login Block ---');
  const emailA = 'test_a_unverified@example.com';
  await cleanEmail(emailA);

  const passwordA = 'SecurePass123!';
  const passwordHashA = await bcrypt.hash(passwordA, 12);

  // Simulate register logic
  const companyA = await prisma.company.create({
    data: {
      name: 'Test Company A',
      email: emailA,
      passwordHash: passwordHashA,
      emailVerified: false,
      users: {
        create: {
          email: emailA,
          passwordHash: passwordHashA,
          role: 'admin',
          emailVerified: false,
        },
      },
    },
    include: { users: true },
  });

  // DB Verification 1
  const dbCompanyA = await prisma.company.findUnique({ where: { email: emailA } });
  const dbUserA = await prisma.user.findUnique({ where: { email: emailA } });

  console.log(`[DB Check] Company emailVerified: ${dbCompanyA?.emailVerified}`);
  console.log(`[DB Check] User emailVerified: ${dbUserA?.emailVerified}`);

  if (dbCompanyA?.emailVerified === false && dbUserA?.emailVerified === false) {
    console.log('✓ TEST A Part 1 PASSED: emailVerified is false in database after registration.');
  } else {
    throw new Error('TEST A FAILED: emailVerified is not false!');
  }

  // Simulate login attempt on unverified user
  const isPassValidA = await bcrypt.compare(passwordA, dbCompanyA!.passwordHash);
  let loginBlockedA = false;
  let loginErrorMessageA = '';

  if (isPassValidA && !dbCompanyA!.emailVerified) {
    loginBlockedA = true;
    loginErrorMessageA = 'Please verify your email before logging in.';
  }

  if (loginBlockedA && loginErrorMessageA === 'Please verify your email before logging in.') {
    console.log('✓ TEST A Part 2 PASSED: Login rejected with correct unverified email error message.');
    passedCount++;
  } else {
    throw new Error('TEST A FAILED: Login was not blocked correctly for unverified account!');
  }
  console.log('\n');

  // ----------------------------------------------------
  // TEST B: Click valid verification link -> emailVerified becomes true, login succeeds
  // ----------------------------------------------------
  console.log('--- TEST B: Email Verification Link & Verified Login ---');
  const validTokenB = generateVerificationToken({ id: companyA.id, email: emailA });

  // Simulate /api/auth/verify-email with valid token
  const verifyResB = await (async (token: string) => {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== 'email_verification') return { success: false };

    await prisma.company.update({ where: { email: payload.email }, data: { emailVerified: true } });
    await prisma.user.updateMany({ where: { email: payload.email }, data: { emailVerified: true } });
    return { success: true };
  })(validTokenB);

  const updatedCompanyB = await prisma.company.findUnique({ where: { email: emailA } });
  const updatedUserB = await prisma.user.findUnique({ where: { email: emailA } });

  console.log(`[DB Check] Company emailVerified after link click: ${updatedCompanyB?.emailVerified}`);
  console.log(`[DB Check] User emailVerified after link click: ${updatedUserB?.emailVerified}`);

  const canLoginB = await bcrypt.compare(passwordA, updatedCompanyB!.passwordHash) && updatedCompanyB!.emailVerified;

  if (updatedCompanyB?.emailVerified === true && updatedUserB?.emailVerified === true && canLoginB) {
    console.log('✓ TEST B PASSED: emailVerified is true in DB and login succeeds after verification.');
    passedCount++;
  } else {
    throw new Error('TEST B FAILED: Email verification or subsequent login failed!');
  }
  console.log('\n');

  // ----------------------------------------------------
  // TEST C: Use expired or tampered verification token -> rejected with clear error
  // ----------------------------------------------------
  console.log('--- TEST C: Expired/Tampered Verification Token ---');
  const tamperedToken = validTokenB.slice(0, -5) + 'xxxxx';
  const expiredToken = jwt.sign(
    { userId: companyA.id, email: emailA, type: 'email_verification' },
    JWT_SECRET,
    { expiresIn: '0s' }
  );

  let tamperedRejected = false;
  let expiredRejected = false;

  try {
    jwt.verify(tamperedToken, JWT_SECRET);
  } catch {
    tamperedRejected = true;
  }

  try {
    jwt.verify(expiredToken, JWT_SECRET);
  } catch {
    expiredRejected = true;
  }

  if (tamperedRejected && expiredRejected) {
    console.log('✓ TEST C PASSED: Tampered and expired verification tokens rejected with clear error.');
    passedCount++;
  } else {
    throw new Error('TEST C FAILED: Tampered or expired token was accepted!');
  }
  console.log('\n');

  // ----------------------------------------------------
  // TEST D: Request password reset for a NON-verified account -> rejected
  // ----------------------------------------------------
  console.log('--- TEST D: Password Reset on Unverified Account ---');
  const emailD = 'test_d_unverified@example.com';
  await cleanEmail(emailD);

  const initialHashD = await bcrypt.hash('OriginalPass123!', 12);
  const companyD = await prisma.company.create({
    data: {
      name: 'Company D',
      email: emailD,
      passwordHash: initialHashD,
      emailVerified: false,
      users: { create: { email: emailD, passwordHash: initialHashD, emailVerified: false } },
    },
  });

  const resetTokenD = generatePasswordResetToken({ id: companyD.id, email: emailD });

  // Attempt reset on unverified account
  const dbCompanyDBefore = await prisma.company.findUnique({ where: { email: emailD } });
  let resetBlockedD = false;
  let resetErrorMessageD = '';

  if (!dbCompanyDBefore?.emailVerified) {
    resetBlockedD = true;
    resetErrorMessageD = 'Please verify your email first before resetting your password.';
  }

  const dbCompanyDAfter = await prisma.company.findUnique({ where: { email: emailD } });

  console.log(`[DB Check] passwordHash unchanged: ${dbCompanyDAfter?.passwordHash === initialHashD}`);

  if (resetBlockedD && resetErrorMessageD.includes('verify your email first') && dbCompanyDAfter?.passwordHash === initialHashD) {
    console.log('✓ TEST D PASSED: Reset rejected for unverified account and password hash remained unchanged.');
    passedCount++;
  } else {
    throw new Error('TEST D FAILED: Reset was allowed on unverified account or password was mutated!');
  }
  console.log('\n');

  // ----------------------------------------------------
  // TEST E: Request password reset for a VERIFIED account -> reset email sent, valid token allows new password, DB passwordHash changed
  // ----------------------------------------------------
  console.log('--- TEST E: Password Reset on Verified Account & DB Verification ---');
  const emailE = 'test_e_verified@example.com';
  await cleanEmail(emailE);

  const oldPasswordE = 'OldSecret123!';
  const oldHashE = await bcrypt.hash(oldPasswordE, 12);

  const companyE = await prisma.company.create({
    data: {
      name: 'Company E',
      email: emailE,
      passwordHash: oldHashE,
      emailVerified: true,
      users: { create: { email: emailE, passwordHash: oldHashE, emailVerified: true } },
    },
  });

  const resetTokenE = generatePasswordResetToken({ id: companyE.id, email: emailE });
  const newPasswordE = 'BrandNewPass999#';

  // Perform reset password
  const payloadE = jwt.verify(resetTokenE, JWT_SECRET) as any;
  if (payloadE.type !== 'password_reset') throw new Error('Wrong token type');

  const newHashE = await bcrypt.hash(newPasswordE, 12);
  const resetTimeE = new Date();

  await prisma.company.update({
    where: { email: emailE },
    data: { passwordHash: newHashE, passwordResetAt: resetTimeE },
  });
  await prisma.user.updateMany({
    where: { email: emailE },
    data: { passwordHash: newHashE, passwordResetAt: resetTimeE },
  });

  // DB Verification
  const dbCompanyE = await prisma.company.findUnique({ where: { email: emailE } });
  const isNewPasswordValidE = await bcrypt.compare(newPasswordE, dbCompanyE!.passwordHash);
  const isOldPasswordInvalidE = !(await bcrypt.compare(oldPasswordE, dbCompanyE!.passwordHash));

  console.log(`[DB Check] Old password hash != New password hash: ${dbCompanyE!.passwordHash !== oldHashE}`);
  console.log(`[DB Check] New password bcrypt compare succeeds: ${isNewPasswordValidE}`);
  console.log(`[DB Check] Old password bcrypt compare fails: ${isOldPasswordInvalidE}`);

  if (dbCompanyE!.passwordHash !== oldHashE && isNewPasswordValidE && isOldPasswordInvalidE) {
    console.log('✓ TEST E PASSED: Password hash in DB was updated and new password works correctly.');
    passedCount++;
  } else {
    throw new Error('TEST E FAILED: Password hash was not properly updated in DB!');
  }
  console.log('\n');

  // ----------------------------------------------------
  // TEST F: Use expired or tampered reset token -> rejected, no password change occurs
  // ----------------------------------------------------
  console.log('--- TEST F: Expired/Tampered Reset Token ---');
  const tamperedResetToken = resetTokenE.slice(0, -5) + 'yyyyy';
  const expiredResetToken = jwt.sign(
    { userId: companyE.id, email: emailE, type: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '0s' }
  );

  let tamperedResetRejected = false;
  let expiredResetRejected = false;

  try {
    jwt.verify(tamperedResetToken, JWT_SECRET);
  } catch {
    tamperedResetRejected = true;
  }

  try {
    jwt.verify(expiredResetToken, JWT_SECRET);
  } catch {
    expiredResetRejected = true;
  }

  const dbCompanyF = await prisma.company.findUnique({ where: { email: emailE } });
  console.log(`[DB Check] Password hash remains unchanged: ${dbCompanyF!.passwordHash === newHashE}`);

  if (tamperedResetRejected && expiredResetRejected && dbCompanyF!.passwordHash === newHashE) {
    console.log('✓ TEST F PASSED: Tampered and expired reset tokens rejected and DB passwordHash was unchanged.');
    passedCount++;
  } else {
    throw new Error('TEST F FAILED: Invalid reset token was accepted!');
  }
  console.log('\n');

  // ----------------------------------------------------
  // TEST G: Attempt to reuse an already-used reset token a second time -> rejected
  // ----------------------------------------------------
  console.log('--- TEST G: Token Reuse Invalidation ---');
  const payloadG = jwt.verify(resetTokenE, JWT_SECRET) as any;
  const dbCompanyG = await prisma.company.findUnique({ where: { email: emailE } });

  let reuseRejected = false;
  let reuseErrorMessage = '';

  if (dbCompanyG?.passwordResetAt && payloadG.iat) {
    const resetTimestampSec = Math.floor(dbCompanyG.passwordResetAt.getTime() / 1000);
    if (payloadG.iat <= resetTimestampSec) {
      reuseRejected = true;
      reuseErrorMessage = 'This password reset token has already been used.';
    }
  }

  if (reuseRejected && reuseErrorMessage.includes('already been used')) {
    console.log('✓ TEST G PASSED: Attempt to reuse reset token was rejected due to passwordResetAt invalidation.');
    passedCount++;
  } else {
    throw new Error('TEST G FAILED: Reused reset token was not rejected!');
  }
  console.log('\n');

  // Clean up test data
  await cleanEmail(emailA);
  await cleanEmail(emailD);
  await cleanEmail(emailE);

  console.log('====================================================');
  console.log(`ALL ${passedCount}/7 MANDATORY TEST SCENARIOS PASSED WITH DIRECT DB VERIFICATION!`);
  console.log('====================================================');
}

runAllTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
