import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { registerServiceWorker } from './pwa/register-sw.js';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register PWA Service Worker for offline caching
registerServiceWorker({
  onSuccess: () => {
    console.info('[Sakura PWA] App is ready for offline use.');
  },
  onUpdate: () => {
    console.info('[Sakura PWA] New update available.');
  },
});
