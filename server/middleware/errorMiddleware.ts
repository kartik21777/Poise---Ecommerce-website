import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const log = logger('ErrorMiddleware');

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;

  // If Mongoose not found error, set to 404 and change message
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Ensure structured logging captures these global exceptions
  if (statusCode >= 500) {
    log.error(`Global Exception: ${message}`, { 
      stack: err.stack, 
      url: req.originalUrl, 
      method: req.method,
      ip: req.ip
    });
  } else {
    log.warn(`Client Error: ${message}`, {
      status: statusCode,
      url: req.originalUrl,
      method: req.method
    });
  }

  res.status(statusCode).json({
    message,
    // explicitly prevent sensitive leak on prod
    stack: env.nodeEnv === 'production' ? null : err.stack,
  });
};
