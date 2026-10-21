import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateJwt } from '../../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.register);
authRouter.get('/me', authenticateJwt, authController.me);
