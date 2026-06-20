import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import mongoose from 'mongoose';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn as any });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as any });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
};
