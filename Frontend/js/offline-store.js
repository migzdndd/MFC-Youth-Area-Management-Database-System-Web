/**
 * ============================================================================
 * MFC Youth Area Management System - Client Offline Storage Engine
 * ============================================================================
 * Purpose:
 * Native IndexedDB wrapper managing offline cached data and outgoing mutations.
 * Enables zero-dependency offline persistence for:
 * 1. Event Attendance & Payment Toggles (POST/PATCH /api/participants)
 * 2. Activity Report Drafting (POST/PATCH /api/reports)
 * 3. High-capacity cached read data (GET /api/sync)
 *
 * Stores:
 * - `read_cache`: High-capacity mirror of /api/sync and static datasets
 * - `mutation_queue`: FIFO outbox queue of pending server mutations
 * ============================================================================
 */

(function (root, factory) {
  const instance = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  } else {
    root.offlineStore = instance;
    if (typeof root.window !== 'undefined') {
      root.window.offlineStore = instance;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DB_NAME = 'mfc_youth_offline_db';
  const DB_VERSION = 1;
  const STORE_READ = 'read_cache';
  const STORE_MUTATIONS = 'mutation_queue';

  let dbPromise = null;
  const memoryFallback = {
    readCache: new Map(),
    mutationQueue: new Map()
  };

  /**
   * Generates a collision-resistant unique ID for mutation entries.
   */
  function generateId(prefix = 'mut') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    const rand = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `${prefix}_${ts}_${rand}`;
  }

  /**
   * Dispatches a custom DOM event if running in a window context.
   */
  function emitEvent(name, detail = {}) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      } catch (err) {
        console.warn(`[offline-store] Failed to dispatch ${name}:`, err);
      }
    }
  }

  /**
   * Opens or upgrades the native IndexedDB instance.
   */
  function openDB() {
    if (dbPromise) return dbPromise;

    if (typeof indexedDB === 'undefined') {
      console.warn('[offline-store] IndexedDB not available, using in-memory store.');
      return Promise.resolve(null);
    }

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_READ)) {
          db.createObjectStore(STORE_READ, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
          const mutationStore = db.createObjectStore(STORE_MUTATIONS, { keyPath: 'id' });
          mutationStore.createIndex('timestamp', 'timestamp', { unique: false });
          mutationStore.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('[offline-store] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('[offline-store] IndexedDB upgrade blocked by another open tab.');
      };
    }).catch(error => {
      console.warn('[offline-store] Falling back to memory storage due to error:', error);
      return null;
    });

    return dbPromise;
  }

  /**
   * Saves a read payload into the `read_cache` store.
   *
   * @param {string} key Identifier (e.g. 'sync_data')
   * @param {any} data Parsed JSON response payload
   * @param {string|null} areaId Optional area scope
   */
  async function cacheReadData(key, data, areaId = null) {
    if (!key) throw new Error('[offline-store] Cache key is required.');
    const entry = {
      key,
      data,
      areaId,
      timestamp: Date.now()
    };

    const db = await openDB();
    if (!db) {
      memoryFallback.readCache.set(key, entry);
      return entry;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READ, 'readwrite');
      const store = tx.objectStore(STORE_READ);
      const req = store.put(entry);

      req.onsuccess = () => resolve(entry);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves a cached read payload from `read_cache`.
   *
   * @param {string} key Identifier
   * @returns {Promise<object|null>}
   */
  async function getReadData(key) {
    if (!key) return null;
    const db = await openDB();
    if (!db) {
      return memoryFallback.readCache.get(key) || null;
    }

    return new Promise(resolve => {
      const tx = db.transaction(STORE_READ, 'readonly');
      const store = tx.objectStore(STORE_READ);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => {
        console.warn('[offline-store] Read cache fetch failed:', req.error);
        resolve(null);
      };
    });
  }

  /**
   * Deletes a cached read payload.
   */
  async function clearReadData(key) {
    if (!key) return;
    const db = await openDB();
    if (!db) {
      memoryFallback.readCache.delete(key);
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_READ, 'readwrite');
      const store = tx.objectStore(STORE_READ);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Enqueues an outgoing network mutation to `mutation_queue`.
   *
   * @param {object} options
   * @param {string} options.endpoint Target API route (e.g. '/api/participants')
   * @param {string} options.method HTTP Verb ('POST', 'PATCH', 'DELETE')
   * @param {any} options.payload Mutation body
   * @param {object} [options.headers] Custom HTTP headers
   * @param {string} [options.idempotentId] Unique ID for deduplication
   * @param {boolean} [options.optimistic=true] Whether local state was modified
   * @returns {Promise<object>} The stored mutation record
   */
  async function enqueueMutation({
    endpoint,
    method,
    payload,
    headers = {},
    idempotentId = null,
    optimistic = true
  }) {
    if (!endpoint || !method) {
      throw new Error('[offline-store] Endpoint and method are required to enqueue a mutation.');
    }

    const id = idempotentId || generateId();
    const entry = {
      id,
      endpoint,
      method: String(method).toUpperCase(),
      payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
      headers: headers || {},
      timestamp: Date.now(),
      optimistic: Boolean(optimistic),
      status: 'pending', // 'pending' | 'syncing' | 'failed' | 'conflict'
      retryCount: 0,
      lastError: null
    };

    const db = await openDB();
    if (!db) {
      memoryFallback.mutationQueue.set(id, entry);
      emitEvent('offline:mutation-enqueued', { mutation: entry });
      return entry;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.put(entry);

      req.onsuccess = () => {
        emitEvent('offline:mutation-enqueued', { mutation: entry });
        resolve(entry);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetches all pending or retryable mutations sorted by timestamp (FIFO).
   *
   * @returns {Promise<Array<object>>}
   */
  async function getPendingMutations() {
    const db = await openDB();
    if (!db) {
      return Array.from(memoryFallback.mutationQueue.values())
        .filter(item => item.status === 'pending' || item.status === 'syncing')
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readonly');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = (req.result || [])
          .filter(item => item.status === 'pending' || item.status === 'syncing')
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieves a single mutation record by ID.
   */
  async function getMutation(id) {
    if (!id) return null;
    const db = await openDB();
    if (!db) return memoryFallback.mutationQueue.get(id) || null;

    return new Promise(resolve => {
      const tx = db.transaction(STORE_MUTATIONS, 'readonly');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  /**
   * Updates fields on an existing mutation entry (e.g. status, error, retryCount).
   */
  async function updateMutation(id, updates = {}) {
    if (!id) return null;
    const db = await openDB();

    if (!db) {
      const existing = memoryFallback.mutationQueue.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      memoryFallback.mutationQueue.set(id, updated);
      emitEvent('offline:mutation-updated', { mutation: updated });
      return updated;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (!existing) {
          resolve(null);
          return;
        }
        const updated = { ...existing, ...updates, updatedAt: Date.now() };
        const putReq = store.put(updated);
        putReq.onsuccess = () => {
          emitEvent('offline:mutation-updated', { mutation: updated });
          resolve(updated);
        };
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Removes a committed or discarded mutation from `mutation_queue`.
   */
  async function removeMutation(id) {
    if (!id) return;
    const db = await openDB();

    if (!db) {
      memoryFallback.mutationQueue.delete(id);
      emitEvent('offline:mutation-removed', { id });
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.delete(id);
      req.onsuccess = () => {
        emitEvent('offline:mutation-removed', { id });
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Counts the number of pending mutations in the queue.
   */
  async function countPendingMutations() {
    const list = await getPendingMutations();
    return list.length;
  }

  /**
   * Clears all entries from the mutation queue.
   */
  async function clearAllMutations() {
    const db = await openDB();
    if (!db) {
      memoryFallback.mutationQueue.clear();
      emitEvent('offline:mutation-cleared');
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.clear();
      req.onsuccess = () => {
        emitEvent('offline:mutation-cleared');
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  return {
    openDB,
    cacheReadData,
    getReadData,
    clearReadData,
    enqueueMutation,
    getPendingMutations,
    getMutation,
    updateMutation,
    removeMutation,
    countPendingMutations,
    clearAllMutations,
    generateId
  };
});
