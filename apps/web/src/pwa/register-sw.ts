export interface SwRegistrationOptions {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

let currentRegistration: ServiceWorkerRegistration | null = null;

export function registerServiceWorker(options: SwRegistrationOptions = {}): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        currentRegistration = registration;

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.info('[PWA] New version of Sakura Swipe is available.');
                options.onUpdate?.(registration);
              } else {
                // Content cached for offline use
                console.info('[PWA] App shell cached for offline use.');
                options.onSuccess?.(registration);
              }
            }
          };
        };

        options.onSuccess?.(registration);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
        options.onError?.(error);
      });
  });
}

export function applyServiceWorkerUpdate(): void {
  if (currentRegistration && currentRegistration.waiting) {
    currentRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}
