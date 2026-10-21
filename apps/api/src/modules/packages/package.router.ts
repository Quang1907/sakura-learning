import { Router } from 'express';
import { authenticateJwt } from '../../middlewares/auth.middleware.js';
import { packageController } from './package.controller.js';

export const packageRouter = Router();

// Public / Authenticated package download endpoint
packageRouter.get('/jlpt/:level', authenticateJwt, packageController.getByJlpt);
