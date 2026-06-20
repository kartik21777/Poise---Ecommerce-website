import dotenv from 'dotenv';

dotenv.config({ override: true });

function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

const nodeEnv = getOptionalEnv('NODE_ENV', 'development');

const portStr = getOptionalEnv('PORT', '3000');
const port = parseInt(portStr, 10);

export const env = {
  port,
  nodeEnv,
  clientUrl: process.env.CLIENT_URL || '',
  appUrl: getOptionalEnv('APP_URL', 'http://localhost:3000'),
  mongoUri: (!process.env.MONGO_URI || process.env.MONGO_URI === 'TO_BE_ADDED') ? 'mongodb://127.0.0.1:27017/poise' : process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '',
  emailVerificationExpiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '',
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  smtp: {
    from: process.env.EMAIL_FROM || '',
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

export function validateEnv(): string[] {
  const required = [
    'CLIENT_URL',
    'MONGO_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'EMAIL_VERIFICATION_EXPIRES_IN',
    'PASSWORD_RESET_EXPIRES_IN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'EMAIL_FROM',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ];
  return required.filter(key => !process.env[key]);
}
