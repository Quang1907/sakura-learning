import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware.js';
import { questionController } from './question.controller.js';

export const questionRouter = Router();

questionRouter.post('/:id/submit', authenticateJwt, questionController.submitAnswer);
