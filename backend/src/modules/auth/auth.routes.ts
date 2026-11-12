import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.validators';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema, 'body'), AuthController.register);
router.post('/login', validate(loginSchema, 'body'), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema, 'body'), AuthController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema, 'body'), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema, 'body'), AuthController.resetPassword);

// Protected routes (requires authentication)
router.use(authenticate);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getMe);
router.put('/profile', validate(updateProfileSchema, 'body'), AuthController.updateProfile);
router.put('/change-password', validate(changePasswordSchema, 'body'), AuthController.changePassword);

export default router;
