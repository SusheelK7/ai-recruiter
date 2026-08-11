import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-recruiter-jwt-secret-key-2026';

export interface VerificationTokenPayload {
  userId: string;
  email: string;
  type: 'email_verification';
  iat?: number;
  exp?: number;
}

export interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  type: 'password_reset';
  iat?: number;
  exp?: number;
}

export interface AuthTokenPayload {
  userId: string;
  companyId: string;
  email: string;
  type: 'auth';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT verification token valid for 24 hours.
 */
export function generateVerificationToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'email_verification',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify JWT email verification token.
 */
export function verifyVerificationToken(token: string): VerificationTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as VerificationTokenPayload;
    if (decoded && decoded.type === 'email_verification') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('Invalid or expired verification token:', error);
    return null;
  }
}

/**
 * Generate JWT password reset token valid for 1 hour.
 */
export function generatePasswordResetToken(user: { id: string; email: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'password_reset',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate JWT auth token valid for 7 days.
 */
export function generateAuthToken(user: { id: string; companyId: string; email: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      type: 'auth',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT auth token.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    if (decoded && decoded.type === 'auth') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('Invalid or expired auth token:', error);
    return null;
  }
}

/**
 * Verify JWT password reset token.
 */
export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as PasswordResetTokenPayload;
    if (decoded && decoded.type === 'password_reset') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('Invalid or expired password reset token:', error);
    return null;
  }
}
