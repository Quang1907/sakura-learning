export const API_ENDPOINTS = {
  HEALTH: '/api/v1/health',
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    ME: '/api/v1/auth/me',
  },
  FEED: '/api/v1/feed',
  PROGRESS: {
    EVENT: '/api/v1/progress/event',
    BATCH: '/api/v1/progress/batch',
    STATS: '/api/v1/progress/stats',
  },
  KANJI: '/api/v1/kanji',
  VOCABULARY: '/api/v1/vocabulary',
  GRAMMAR: '/api/v1/grammar',
  PACKAGES: (level: string) => `/api/v1/packages/jlpt/${level}`,
  QUESTIONS: (id: number) => `/api/v1/questions/${id}/submit`,
} as const;
