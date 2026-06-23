import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const isSmtpConfigured = () =>
  !!(env.smtp.host && env.smtp.host !== 'your_smtp_host' && env.smtp.user && env.smtp.pass);

const createTransporter = () =>
  nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    // port 465 = implicit TLS; anything else uses STARTTLS
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

export const sendVerificationEmail = async (to: string, token: string) => {
  const verifyLink = `${env.clientUrl}/verify-email?token=${token}`;

  if (env.nodeEnv !== 'production') {
    console.log(`[emailService] Verification link for ${to}: ${verifyLink}`);
  }

  if (!isSmtpConfigured()) {
    console.warn('[emailService] SMTP not configured — skipping verification email send.');
    return;
  }

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: 'Please verify your email — Poise',
      html: `
        <h1>Verify your email</h1>
        <p>Click the link below to verify your Poise account:</p>
        <a href="${verifyLink}">${verifyLink}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (error) {
    console.error('[emailService] Failed to send verification email:', error);
    throw error; // re-throw so callers can handle/log appropriately
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetLink = `${env.clientUrl}/reset-password?token=${token}`;

  // Always log in non-production for easy local testing
  if (env.nodeEnv !== 'production') {
    console.log(`[emailService] Password reset link for ${to}: ${resetLink}`);
  }

  if (!isSmtpConfigured()) {
    console.warn('[emailService] SMTP not configured — skipping password reset email send.');
    console.warn('[emailService] Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM in .env to enable email.');
    return;
  }

  const transporter = createTransporter();
  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: 'Reset your Poise password',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      `,
    });
  } catch (error) {
    console.error('[emailService] Failed to send password reset email:', error);
    throw error; // re-throw so authService can log while keeping the API response vague
  }
};

