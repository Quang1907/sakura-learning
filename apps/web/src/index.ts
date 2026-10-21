/**
 * @sakura/web
 * Client Web App Entrypoint
 */

export const WEB_VERSION = '0.1.0';

export * from './api/client.js';
export * from './components/KanjiCard.js';
export * from './components/KanjiDetailModal.js';
export * from './components/KanjiSwipeFeed.js';
export * from './components/KanjiExplorer.js';
export * from './components/VocabularyExplorer.js';
export * from './components/GrammarExplorer.js';
export * from './components/OfflineManagerModal.js';
export * from './services/storage/indexeddb.js';
export * from './services/feed/offline-feed.service.js';
export * from './services/sync/sync.service.js';
export * from './services/packages/package-manager.service.js';
export * from './App.js';
