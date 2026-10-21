import { Router } from 'express';
import { authenticateJwt, requireRole } from '../../middlewares/auth.middleware.js';
import { kanjiController } from './kanji.controller.js';

// Public Kanji router (/api/v1/kanji)
export const kanjiRouter = Router();

kanjiRouter.get('/', kanjiController.list);
kanjiRouter.get('/:id', kanjiController.getById);

// Admin Kanji router (/api/v1/admin/kanji)
export const kanjiAdminRouter = Router();

kanjiAdminRouter.post(
  '/',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  kanjiController.create,
);
kanjiAdminRouter.put(
  '/:id',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  kanjiController.update,
);
kanjiAdminRouter.delete(
  '/:id',
  authenticateJwt,
  requireRole('ADMIN', 'MODERATOR'),
  kanjiController.remove,
);
