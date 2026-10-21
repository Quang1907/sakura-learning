import { Router } from 'express';
import { authenticateJwt, requireRole } from '../../middlewares/auth.middleware.js';
import { vocabularyController } from './vocabulary.controller.js';

// Public Vocabulary router (/api/v1/vocabulary)
export const vocabularyRouter = Router();

vocabularyRouter.get('/', vocabularyController.list);
vocabularyRouter.get('/:id', vocabularyController.getById);

// Admin Vocabulary router (/api/v1/admin/vocabulary)
export const vocabularyAdminRouter = Router();

vocabularyAdminRouter.post(
  '/',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  vocabularyController.create,
);
vocabularyAdminRouter.put(
  '/:id',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  vocabularyController.update,
);
vocabularyAdminRouter.delete(
  '/:id',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  vocabularyController.remove,
);
