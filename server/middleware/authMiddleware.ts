import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const requireAuth = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      if (next) {
        return next(new Error('Not authorized, insufficient role'));
      }
    }
    if (next) {
      next();
    }
  };
};
