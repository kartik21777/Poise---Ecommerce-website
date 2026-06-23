import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { generateRandomToken, hashToken } from '../utils/cryptoUtils.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';
import { env } from '../config/env.js';
import { parseExpiration } from '../utils/timeUtils.js';
import { RegisterInput, LoginInput } from '../validations/authValidation.js';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = {
  async register({ name, email, password }: RegisterInput) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AuthError('An account with this email already exists.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10); // 10 rounds: OWASP-compliant & ~4x faster than 12
    const verificationToken = generateRandomToken();
    const emailVerificationTokenHash = hashToken(verificationToken);

    // Use env.emailVerificationExpiresIn, defaults to '1d'
    const expiresAt = new Date(Date.now() + parseExpiration(env.emailVerificationExpiresIn || '1d'));

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      emailVerificationTokenHash,
      emailVerificationExpiresAt: expiresAt,
    });

    // Send verification email (non-blocking — failure does not abort registration)
    sendVerificationEmail(email, verificationToken).catch((err) =>
      console.error('[emailService] Failed to send verification email:', err)
    );

    // Auto-login: generate tokens so the client skips a second POST /login
    const payload: TokenPayload = { userId: newUser._id.toString(), role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshExpiresAt = new Date(Date.now() + parseExpiration(env.jwtRefreshExpiresIn || '7d'));
    const tokenHash = hashToken(refreshToken);

    await RefreshToken.create({
      user: newUser._id,
      tokenHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      message: 'Registration successful. If the email is valid, a verification email has been sent.',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    };
  },

  async login({ email, password }: LoginInput) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AuthError('Invalid email or password', 401);
    }

    const payload: TokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + parseExpiration(env.jwtRefreshExpiresIn || '7d'));
    const tokenHash = hashToken(refreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    user.lastLoginAt = new Date();
    await user.save();

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  },

  async refreshToken(cookieToken: string) {
    if (!cookieToken) {
      throw new AuthError('Refresh token missing', 401);
    }

    const decoded = verifyRefreshToken(cookieToken);
    const tokenHash = hashToken(cookieToken);

    const storedToken = await RefreshToken.findOne({ tokenHash });
    if (!storedToken || storedToken.revoked) {
      if (storedToken?.revoked) {
        // Token reuse detected, revoke all tokens for this user
        await RefreshToken.updateMany({ user: decoded.userId }, { revoked: true });
      }
      throw new AuthError('Invalid or revoked refresh token', 401);
    }

    // Mark current token as revoked
    storedToken.revoked = true;
    await storedToken.save();

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthError('User not found', 401);
    }

    const payload: TokenPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const newExpiresAt = new Date(Date.now() + parseExpiration(env.jwtRefreshExpiresIn || '7d'));
    const newTokenHash = hashToken(newRefreshToken);

    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    return {
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(cookieToken: string | undefined) {
    if (cookieToken) {
      const tokenHash = hashToken(cookieToken);
      await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
    }
  },

  async verifyEmail(token: string) {
    const emailVerificationTokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AuthError('Invalid or expired verification token', 400);
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) return; // Prevent enumeration

    const resetToken = generateRandomToken();
    const passwordResetTokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + parseExpiration(env.passwordResetExpiresIn || '1h'));

    user.passwordResetTokenHash = passwordResetTokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      // Log but do NOT re-throw — the API response must remain vague to prevent enumeration
      console.error('[authService] forgotPassword: email delivery failed for', user.email, emailErr);
    }
  },

  async resetPassword(token: string, password: string) {
    const passwordResetTokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AuthError('Invalid or expired password reset token', 400);
    }

    const newPasswordHash = await bcrypt.hash(password, 12);
    user.passwordHash = newPasswordHash;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    // Revoke all existing sessions
    await RefreshToken.updateMany({ user: user._id }, { revoked: true });

    return { message: 'Password reset successful' };
  }
};
