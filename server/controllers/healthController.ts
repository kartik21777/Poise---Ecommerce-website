import { Request, Response } from 'express';
import { env } from '../config/env.js';

export const getHealthStatus = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
};
