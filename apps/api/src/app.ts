import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { healthRouter } from './modules/health/health.router.js';
import { feedRouter } from './modules/feed/feed.router.js';
import { progressRouter } from './modules/progress/progress.router.js';
import { questionRouter } from './modules/questions/question.router.js';
import { kanjiRouter, kanjiAdminRouter } from './modules/kanji/kanji.router.js';
import { vocabularyRouter, vocabularyAdminRouter } from './modules/vocabulary/vocabulary.router.js';
import { grammarRouter, grammarAdminRouter } from './modules/grammar/grammar.router.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

export function createApp(): Express {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API v1 Routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/feed', feedRouter);
  app.use('/api/v1/progress', progressRouter);
  app.use('/api/v1/questions', questionRouter);
  app.use('/api/v1/kanji', kanjiRouter);
  app.use('/api/v1/admin/kanji', kanjiAdminRouter);
  app.use('/api/v1/vocabulary', vocabularyRouter);
  app.use('/api/v1/admin/vocabulary', vocabularyAdminRouter);
  app.use('/api/v1/grammar', grammarRouter);
  app.use('/api/v1/admin/grammar', grammarAdminRouter);

  // 404 & Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
