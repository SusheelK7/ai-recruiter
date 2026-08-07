import nodemailer from 'nodemailer';

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

const transporter = gmailUser && gmailAppPassword
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })
  : null;

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  if (!transporter) {
    throw new Error('Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.');
  }

  await transporter.sendMail({
    from: gmailUser,
    to,
    subject,
    html,
  });
}