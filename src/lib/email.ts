import { sendEmail } from './mailer';

const getAppUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
};

export function getVerificationUrl(token: string): string {
  const appUrl = getAppUrl();
  return `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

export function getResetUrl(token: string): string {
  const appUrl = getAppUrl();
  return `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Send email verification link via Gmail SMTP.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = getVerificationUrl(token);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
      <h2 style="color: #2E5B8A;">Verify your AI Recruiter account</h2>
      <p>Thank you for registering! Please click the button below to verify your email address and activate your account:</p>
      <p style="margin: 24px 0;">
        <a href="${verificationUrl}" style="background-color: #2E5B8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:<br/><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">This link will expire in 24 hours.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: 'Verify your email address - AI Recruiter',
      html,
    });
    return true;
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return false;
  }
}

/**
 * Send password reset link via Gmail SMTP.
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = getResetUrl(token);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
      <h2 style="color: #2E5B8A;">Reset your AI Recruiter password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #2E5B8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">This link will expire in 1 hour.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: 'Reset your password - AI Recruiter',
      html,
    });
    return true;
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    return false;
  }
}
