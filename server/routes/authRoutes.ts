import express from 'express';
import { 
  registerController, 
  loginController, 
  logoutController, 
  refreshTokenController, 
  verifyEmailController, 
  forgotPasswordController, 
  resetPasswordController,
  getMeController
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema, 
  verifyEmailSchema 
} from '../validations/authValidation.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerController);
router.post('/login', validateRequest(loginSchema), loginController);
router.post('/logout', logoutController);
router.post('/refresh', refreshTokenController);
router.get('/verify-email', validateRequest(verifyEmailSchema), verifyEmailController);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPasswordController);
router.get('/me', requireAuth, getMeController);

export default router;
