import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App';

/**
 * Offline PWA Service Worker Registration
 *
 * What it does:
 * Registers the background service worker so the app shell and core assets can work offline.
 *
 * Backup plan / Safety:
 * Avoids aggressive automatic page reloads so users never have their screen or form inputs
 * unexpectedly refreshed while typing credentials or working.
 */
registerSW({
  immediate: true,
  onNeedRefresh() {
    // When a newer version is deployed, we silently keep the current page stable
    // so active form inputs are never cleared mid-typing. The new version activates
    // naturally on next clean visit or tab reload.
  },
  onOfflineReady() {
    // Offline caching ready
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
