import { sendEmail } from './mailer';

/**
 * Shared email wrapper styling (matches existing email.ts brand).
 */
function wrapEmailBody(content: string): string {
  return `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      ${content}
    </div>
  `;
}

function emailFooter(companyName: string): string {
  return `
    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
      Sent on behalf of <strong>${companyName}</strong> via AI Recruiter Platform. Please do not reply directly to this automated email.
    </div>
  `;
}

// ─── Stage-specific email templates ─────────────────────────────────────────

export interface StageEmailParams {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
}

/**
 * "Tested" stage — Invite candidate to complete skills assessment.
 */
export async function sendTestedEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
}: StageEmailParams): Promise<boolean> {
  const html = wrapEmailBody(`
    <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">Skills Assessment Invitation</h2>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Great news! Your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has progressed to the assessment stage.
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Next Step</h3>
      <p style="margin: 4px 0; font-size: 14px; color: #1e293b;">
        You've been invited to complete a personalized skills assessment. This assessment is tailored to the role and will help us evaluate your technical capabilities.
      </p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #92400e; font-weight: 600;">
        Please check the application portal for your assessment link and instructions.
      </p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      The assessment is timed and should be completed in a single sitting. Make sure you're in a quiet environment with a stable internet connection before you begin.
    </p>

    ${emailFooter(companyName)}
  `);

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Skills Assessment Invitation: ${jobTitle} at ${companyName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[StageEmail] Failed to send "tested" email to ${candidateEmail}:`, err);
    return false;
  }
}
export interface ScheduleInterviewEmailParams extends StageEmailParams {
  scheduledTime: Date | string;
  notes?: string | null;
}

/**
 * Send walk-in / scheduled interview confirmation email with specific date and time.
 * Informational only (no confirmation link required).
 */
export async function sendInterviewScheduledEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
  scheduledTime,
  notes,
}: ScheduleInterviewEmailParams): Promise<boolean> {
  const dateObj = new Date(scheduledTime);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const html = wrapEmailBody(`
    <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">Interview Scheduled</h2>
      <span style="background-color: #f5f3ff; color: #7c3aed; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">${companyName}</span>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Your interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been scheduled.
    </p>

    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px;">Interview Details</h3>
      <p style="margin: 6px 0; font-size: 14px; color: #1e293b;"><strong>📅 Date:</strong> ${formattedDate}</p>
      <p style="margin: 6px 0; font-size: 14px; color: #1e293b;"><strong>⏰ Time:</strong> ${formattedTime}</p>
      <p style="margin: 6px 0; font-size: 14px; color: #1e293b;"><strong>💼 Position:</strong> ${jobTitle}</p>
      <p style="margin: 6px 0; font-size: 14px; color: #1e293b;"><strong>🏢 Company:</strong> ${companyName}</p>
      ${notes ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #4b5563; border-top: 1px dashed #cbd5e1; padding-top: 8px;"><strong>Note from recruiter:</strong> ${notes}</p>` : ''}
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      This is an informational confirmation for your records. A member of our recruiting team will connect with you at the scheduled time. No further action or confirmation is required from your side.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      If you need to get in touch beforehand, please reply to our recruiting coordinator. We look forward to meeting with you!
    </p>

    ${emailFooter(companyName)}
  `);

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Interview Scheduled: ${jobTitle} at ${companyName} (${formattedDate})`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[StageEmail] Failed to send interview scheduled email to ${candidateEmail}:`, err);
    return false;
  }
}

/**
 * "Interviewed" stage — Candidate selected for interview (general invitation).
 */
export async function sendInterviewedEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
}: StageEmailParams): Promise<boolean> {
  const html = wrapEmailBody(`
    <div style="border-bottom: 2px solid #8b5cf6; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">Interview Invitation</h2>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      We're pleased to inform you that you've been selected for an interview for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
    </p>

    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.5px;">What Happens Next</h3>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #1e293b; line-height: 1.8;">
        <li>Our team will reach out to coordinate a walk-in or virtual session</li>
        <li>The interview will cover your experience, technical skills, and fit for the role</li>
        <li>Please have your resume and any relevant portfolio materials ready</li>
      </ul>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      If you have any scheduling constraints or questions, feel free to let us know when our recruiter contacts you. We look forward to speaking with you!
    </p>

    ${emailFooter(companyName)}
  `);

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[StageEmail] Failed to send "interviewed" email to ${candidateEmail}:`, err);
    return false;
  }
}


/**
 * "Hired" stage — Congratulatory offer / next-steps email.
 */
export async function sendHiredEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
}: StageEmailParams): Promise<boolean> {
  const html = wrapEmailBody(`
    <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">🎉 Congratulations!</h2>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      We are thrilled to let you know that you have been selected for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!
    </p>

    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps</h3>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #1e293b; line-height: 1.8;">
        <li>Our HR team will send you a formal offer letter with full details</li>
        <li>You'll receive onboarding documentation and start-date information</li>
        <li>A member of your future team will be in touch to welcome you aboard</li>
      </ul>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Your skills, experience, and the way you presented yourself throughout the process truly stood out. We believe you'll make a fantastic addition to the team, and we can't wait to work with you.
    </p>

    ${emailFooter(companyName)}
  `);

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Offer: You've Been Selected for ${jobTitle} at ${companyName}!`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[StageEmail] Failed to send "hired" email to ${candidateEmail}:`, err);
    return false;
  }
}

/**
 * "Rejected" stage — Polite, respectful rejection.
 * Warm but honest tone. No generic "we'll keep your resume on file" filler.
 */
export async function sendRejectedEmail({
  candidateEmail,
  candidateName,
  jobTitle,
  companyName,
}: StageEmailParams): Promise<boolean> {
  const html = wrapEmailBody(`
    <div style="border-bottom: 2px solid #94a3b8; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 700;">Application Update</h2>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> and for your effort throughout the process.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      After careful consideration, we've decided to move forward with other candidates whose experience more closely aligns with the specific needs of this role at this time.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
        This decision does not reflect on your abilities or potential. Hiring decisions often come down to very specific requirements, and we genuinely appreciated the chance to learn more about your background and what you bring to the table.
      </p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      We wish you every success in your career and future endeavors.
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #475569;">
      Best regards,<br/>
      The <strong>${companyName}</strong> Hiring Team
    </p>

    ${emailFooter(companyName)}
  `);

  try {
    await sendEmail({
      to: candidateEmail,
      subject: `Application Update: ${jobTitle} at ${companyName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[StageEmail] Failed to send "rejected" email to ${candidateEmail}:`, err);
    return false;
  }
}

/**
 * Dispatch the correct stage email based on the new stage.
 * Returns { sent: boolean, skipped: boolean } — skipped=true means this stage doesn't trigger an email.
 */
export async function sendStageEmail(
  stage: string,
  params: StageEmailParams
): Promise<{ sent: boolean; skipped: boolean }> {
  switch (stage) {
    case 'tested':
      return { sent: await sendTestedEmail(params), skipped: false };
    case 'interviewed':
      return { sent: await sendInterviewedEmail(params), skipped: false };
    case 'hired':
      return { sent: await sendHiredEmail(params), skipped: false };
    case 'rejected':
      return { sent: await sendRejectedEmail(params), skipped: false };
    // 'applied' and 'screened' — no candidate notification
    default:
      return { sent: false, skipped: true };
  }
}
