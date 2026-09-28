/**
 * ============================================================================
 * MFC Youth Area Management System - Service Worker (PWA)
 * ============================================================================
 * Features:
 * 1. App Shell Pre-caching for offline instant startup.
 * 2. Cache-First & Stale-While-Revalidate for static assets (HTML/CSS/JS/Fonts).
 * 3. Network-First with Cache fallback for GET /api/sync and read requests.
 * 4. Fetch Interception for offline mutations (POST/PATCH/DELETE) to:
 *    - /api/participants (Attendance & Payment toggles)
 *    - /api/reports (Activity Report drafts)
 * 5. Background sync integration (FIFO Outbox triggering).
 * ============================================================================
 */

const SHELL_CACHE = 'mfc-ams-shell-v2';
const API_CACHE = 'mfc-ams-api-v1';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/dashboard',
  '/dashboard.html',
  '/events',
  '/events.html',
  '/reports',
  '/reports.html',
  '/members',
  '/members.html',
  '/chapters',
  '/chapters.html',
  '/services',
  '/services.html',
  '/member',
  '/member.html',
  '/changelogs',
  '/changelogs.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/css/changelogs.css',
  '/js/loader.js',
  '/js/config.js',
  '/js/offline-store.js',
  '/js/sync-manager.js',
  '/js/api.js',
  '/js/store.js',
  '/js/ui.js',
  '/js/app.js',
  '/js/member.js',
  '/js/modules/dashboard.js',
  '/js/modules/members.js',
  '/js/modules/chapters.js',
  '/js/modules/services.js',
  '/js/modules/reports.js',
  '/js/modules/events.js',
  '/js/modules/onboarding.js',
  '/img/logo-2.png',
  '/img/logo.png',
  '/Icons/dashboard.png',
  '/Icons/members.png',
  '/Icons/chapters.png',
  '/Icons/services.png',
  '/Icons/reports.png',
  '/Icons/events.png',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js'
];

/**
 * Service Worker Installation:
 * Pre-cache all essential app shell files with resilient fallback.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async cache => {
      // Use individual caching with Promise.allSettled so an optional resource failure does not abort install
      const cachePromises = APP_SHELL_URLS.map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(err => {
          console.warn(`[sw] Warning: could not pre-cache ${url}:`, err.message);
        })
      );
      await Promise.allSettled(cachePromises);
      return self.skipWaiting();
    })
  );
});

/**
 * Service Worker Activation:
 * Clean up older cache namespaces and claim all clients immediately.
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      const deletions = keys.map(key => {
        if (key !== SHELL_CACHE && key !== API_CACHE) {
          console.log(`[sw] Removing legacy cache: ${key}`);
          return caches.delete(key);
        }
      });
      await Promise.all(deletions);
      return self.clients.claim();
    })
  );
});

/**
 * Writes an intercepted mutation directly into the client IndexedDB mutation queue.
 */
async function storeMutationInIndexedDB(record) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mfc_youth_offline_db', 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('read_cache')) {
        db.createObjectStore('read_cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('mutation_queue')) {
        const store = db.createObjectStore('mutation_queue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => {
      try {
        const db = request.result;
        const tx = db.transaction('mutation_queue', 'readwrite');
        const store = tx.objectStore('mutation_queue');
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Broadcasts an event message to all attached browser window tabs.
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}

/**
 * Handles mutation interception when offline or network drops.
 */
async function handleOfflineMutation(request, url) {
  let payload = null;
  try {
    const clone = request.clone();
    payload = await clone.json();
  } catch {
    payload = null;
  }

  const id = `mut_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const mutationRecord = {
    id,
    endpoint: url.pathname + url.search,
    method: request.method,
    payload,
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json'
    },
    timestamp: Date.now(),
    optimistic: true,
    status: 'pending',
    retryCount: 0,
    lastError: null
  };

  try {
    await storeMutationInIndexedDB(mutationRecord);

    // Register Background Sync if supported
    if ('sync' in self.registration) {
      try {
        await self.registration.sync.register('outbox-sync');
      } catch (syncErr) {
        console.warn('[sw] Background sync registration notice:', syncErr.message);
      }
    }

    await notifyClients({
      type: 'MUTATION_QUEUED_OFFLINE',
      endpoint: url.pathname,
      method: request.method,
      id
    });
  } catch (dbErr) {
    console.warn('[sw] Could not persist mutation in IndexedDB from SW:', dbErr);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      offline: true,
      queued: true,
      optimistic: true,
      id,
      message: 'Saved offline. Changes will sync automatically when back online.'
    }),
    {
      status: 202,
      headers: {
        'Content-Type': 'application/json',
        'X-MFC-Offline-Queued': '1'
      }
    }
  );
}

/**
 * Strategy: Network-First falling back to Cache for GET /api/* requests.
 */
async function handleApiReadRequest(request) {
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed or offline: consult cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-MFC-Offline-Cached', '1');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }

    return new Response(
      JSON.stringify({
        ok: false,
        offline: true,
        error: 'Unable to reach the server and no cached records exist.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Strategy: Stale-While-Revalidate for static assets (CSS, JS, Fonts, Images).
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(async networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Strategy: Network-First with Cache fallback for HTML navigations.
 */
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedPage = await caches.match(request);
    if (cachedPage) return cachedPage;

    // Clean URL fallback: e.g. /events -> /events.html
    const url = new URL(request.url);
    const htmlFallback = await caches.match(`${url.pathname}.html`);
    if (htmlFallback) return htmlFallback;

    // General app shell fallback
    const dashboardFallback = await caches.match('/dashboard.html');
    if (dashboardFallback) return dashboardFallback;

    return caches.match('/index.html');
  }
}

/**
 * Main Fetch Interceptor
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-http schemes (extensions, etc.)
  if (!url.protocol.startsWith('http')) return;

  const isApi = url.pathname.startsWith('/api/');
  const isOfflineMutationTarget =
    ['/api/participants', '/api/reports'].some(path => url.pathname.startsWith(path)) &&
    (request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE');

  // Case 1: Offline Mutation Interception (/api/participants, /api/reports)
  if (isOfflineMutationTarget) {
    if (!navigator.onLine) {
      event.respondWith(handleOfflineMutation(request, url));
      return;
    }

    event.respondWith(
      fetch(request.clone()).catch(() => handleOfflineMutation(request, url))
    );
    return;
  }

  // Case 2: Read API Requests (GET /api/sync, GET /api/members, etc.)
  if (isApi && request.method === 'GET') {
    event.respondWith(handleApiReadRequest(request));
    return;
  }

  // Bypass other API mutations to normal network handling
  if (isApi) return;

  // Case 3: HTML Page Navigations
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Case 4: Static Assets (CSS, JS, Fonts, Images, Icons)
  event.respondWith(handleStaticAsset(request));
});

/**
 * Background Sync Event:
 * Triggers outbox synchronization when network connectivity is regained.
 */
self.addEventListener('sync', event => {
  if (event.tag === 'outbox-sync') {
    event.waitUntil(
      notifyClients({ type: 'TRIGGER_SYNC', source: 'background-sync' })
    );
  }
});
