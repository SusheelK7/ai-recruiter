import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  console.log('Testing Resend API Key...');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  try {
    // Attempt sending test email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: ['delivered@resend.dev'], // or test address
      subject: 'Resend API Key Test',
      html: '<p>Test email from AI Recruiter setup.</p>',
    });

    if (error) {
      console.error('Resend API Error:', error);
    } else {
      console.log('Resend Email Success:', data);
    }
  } catch (err) {
    console.error('Resend Exception:', err);
  }
}

testResend();
