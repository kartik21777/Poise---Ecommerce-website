import { Request, Response } from 'express';
import { env } from '../config/env.js';
import mongoose from 'mongoose';

export const getHealthStatus = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
};

export const getReadinessStatus = async (req: Request, res: Response) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    
    if (isDbConnected) {
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Failed to check readiness',
      timestamp: new Date().toISOString()
    });
  }
};
