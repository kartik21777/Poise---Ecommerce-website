import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authService, AuthError } from '../services/authService.js';
import { env } from '../config/env.js';
import { parseExpiration } from '../utils/timeUtils.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const setTokensInCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = env.nodeEnv === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  const accessExp = parseExpiration(env.jwtAccessExpiresIn || '15m');
  const refreshExp = parseExpiration(env.jwtRefreshExpiresIn || '7d');

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: accessExp,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: refreshExp,
  });
};

const clearCookies = (res: Response) => {
  const isProduction = env.nodeEnv === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  const cookieOptions = { httpOnly: true, expires: new Date(0), secure: isProduction, sameSite } as const;

  res.cookie('accessToken', '', cookieOptions);
  res.cookie('refreshToken', '', cookieOptions);
};

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    // If registration returned tokens (auto-login), set cookies and return user
    if (result.accessToken && result.refreshToken) {
      setTokensInCookies(res, result.accessToken, result.refreshToken);
    }
    res.status(201).json({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      res.status(error.statusCode);
    } else {
      res.status(400);
    }
    throw error;
  }
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    setTokensInCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      res.status(error.statusCode);
    } else {
      res.status(401);
    }
    throw error;
  }
});

export const refreshTokenController = asyncHandler(async (req: Request, res: Response) => {
  const cookieToken = req.cookies.refreshToken;
  
  try {
    const result = await authService.refreshToken(cookieToken);
    setTokensInCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ message: result.message, accessToken: result.accessToken });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      res.status(error.statusCode);
    } else {
      res.status(401);
    }
    throw error;
  }
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  const cookieToken = req.cookies.refreshToken;
  await authService.logout(cookieToken);
  clearCookies(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

export const verifyEmailController = asyncHandler(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  try {
    const result = await authService.verifyEmail(token);
    res.status(200).json({ message: result.message });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      res.status(error.statusCode);
    } else {
      res.status(400);
    }
    throw error;
  }
});

export const forgotPasswordController = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({ message: 'If an account with that email exists, we sent a password reset link.' });
});

export const resetPasswordController = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    clearCookies(res); // Ensure logged out after password reset
    res.status(200).json({ message: result.message });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      res.status(error.statusCode);
    } else {
      res.status(400);
    }
    throw error;
  }
});

export const getMeController = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    }
  });
});

