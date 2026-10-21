import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware.js';
import { feedController } from './feed.controller.js';

export const feedRouter = Router();

feedRouter.post('/', authenticateJwt, feedController.getFeed);
feedRouter.post('/next', authenticateJwt, feedController.getFeed);
