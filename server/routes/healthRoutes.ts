import express from 'express';
import { getHealthStatus, getReadinessStatus } from '../controllers/healthController.js';

const router = express.Router();

router.get('/', getHealthStatus);
router.get('/ready', getReadinessStatus);

export default router;

