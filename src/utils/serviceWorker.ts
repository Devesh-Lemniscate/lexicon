/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        // Show a prompt to user about new version available
        if (confirm('A new version is available. Reload to update?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App is ready for offline use');
      },
      onRegistered(registration: ServiceWorkerRegistration | undefined) {
        console.log('Service worker registered:', registration);
      },
      onRegisterError(error: Error) {
        console.error('Service worker registration failed:', error);
      },
    });
  }
}
