import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware.js';
import { progressController } from './progress.controller.js';

export const progressRouter = Router();

progressRouter.post('/event', authenticateJwt, progressController.recordEvent);
progressRouter.post('/batch', authenticateJwt, progressController.recordBatch);
progressRouter.get('/stats', authenticateJwt, progressController.getStats);
