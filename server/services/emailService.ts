import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
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
  await transporter.sendMail(mailOptions);
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
  await transporter.sendMail(mailOptions);
};
