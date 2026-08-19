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

export interface SendApplicationConfirmationEmailParams {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
}

/**
 * Send job application confirmation email to candidate via Gmail SMTP.
 */
export async function sendApplicationConfirmationEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
}: SendApplicationConfirmationEmailParams): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">Application Received</h2>
        <span style="background-color: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">${companyName}</span>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>
      
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. We have successfully received your application, resume, and video introduction.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Application Summary</h3>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Role:</strong> ${jobTitle}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Company:</strong> ${companyName}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Date Submitted:</strong> ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Our recruiting team will review your application along with the AI screening assessment. If your profile matches what we're looking for, we will reach out to you directly regarding the next steps in our hiring process.
      </p>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
        Sent on behalf of <strong>${companyName}</strong> via AI Recruiter Platform. Please do not reply directly to this automated email.
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Application Received: ${jobTitle} at ${companyName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[Mailer] Failed to send application confirmation email to ${candidateEmail}:`, err);
    return false;
  }
}

