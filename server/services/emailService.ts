import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyLink = `${env.clientUrl}/verify-email?token=${token}`;
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Please verify your email',
    html: `
      <h1>Verify Email</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verifyLink}">${verifyLink}</a>
    `,
  };
  try {
    if (!env.smtp.host || env.smtp.host === 'your_smtp_host' || !env.smtp.user) {
      console.warn('SMTP not fully configured. Skipping email send. Verification Link:', verifyLink);
      return;
    }
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send verification email. Ensure SMTP is configured. Verification Link:', verifyLink);
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${env.clientUrl}/reset-password?token=${token}`;
  const mailOptions = {
    from: env.smtp.from,
    to,
    subject: 'Password Reset Request',
    html: `
      <h1>Reset Password</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  };
  try {
    if (!env.smtp.host || env.smtp.host === 'your_smtp_host' || !env.smtp.user) {
      console.warn('SMTP not fully configured. Skipping email send. Reset Link:', resetLink);
      return;
    }
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send password reset email. Ensure SMTP is configured. Reset Link:', resetLink);
  }
};
