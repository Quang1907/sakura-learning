import { Router } from 'express';
import { authenticateJwt, requireRole } from '../../middlewares/auth.middleware.js';
import { grammarController } from './grammar.controller.js';

// Public Grammar router (/api/v1/grammar)
export const grammarRouter = Router();

grammarRouter.get('/', grammarController.list);
grammarRouter.get('/:id', grammarController.getById);

// Admin Grammar router (/api/v1/admin/grammar)
export const grammarAdminRouter = Router();

grammarAdminRouter.post(
  '/',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  grammarController.create,
);
grammarAdminRouter.put(
  '/:id',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  grammarController.update,
);
grammarAdminRouter.delete(
  '/:id',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  grammarController.remove,
);
