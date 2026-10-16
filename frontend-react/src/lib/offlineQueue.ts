/**
 * Offline Mutation Store & Sync Queue
 *
 * What it Does: Simple non-IT Terms
 * Saves changes (like marking attendance or recording contributions) into the browser's
 * local database when there is no internet connection. When the internet comes back,
 * it automatically sends all saved actions to the server in order.
 */

export interface QueuedMutation {
  id: string; // Formatted as `mut_<uuid>`
  endpoint: string;
  method: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
}

const DB_NAME = 'mfc_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'mutation_queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function generateMutationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `mut_${crypto.randomUUID()}`;
  }
  return `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function enqueueMutation(
  endpoint: string,
  method: string,
  payload: unknown
): Promise<QueuedMutation> {
  const db = await openDatabase();
  const mutation: QueuedMutation = {
    id: generateMutationId(),
    endpoint,
    method: method.toUpperCase(),
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(mutation);

    request.onsuccess = () => resolve(mutation);
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as QueuedMutation[]) || [];
        // Sort chronologically ascending so mutations replay in the exact order they occurred
        results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedMutation(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore cleanup errors
  }
}

export async function removeQueuedMutations(ids: string[]): Promise<void> {
  if (!ids.length) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      ids.forEach((id) => store.delete(id));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore cleanup errors
  }
}

let isReplaying = false;

export async function replayOfflineQueue(): Promise<{
  ok: boolean;
  processed: number;
  failures: string[];
}> {
  if (isReplaying) return { ok: true, processed: 0, failures: [] };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, processed: 0, failures: ['Offline'] };
  }

  isReplaying = true;

  try {
    const mutations = await getQueuedMutations();
    if (!mutations.length) {
      return { ok: true, processed: 0, failures: [] };
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('mfc_auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mutations: mutations.map((m) => ({
          id: m.id,
          endpoint: m.endpoint,
          method: m.method,
          payload: m.payload,
        })),
      }),
    });

    if (!response.ok) {
      return { ok: false, processed: 0, failures: [`HTTP_${response.status}`] };
    }

    const result = await response.json();
    if (result.ok) {
      const processedCount = result.processed ?? mutations.length;
      const failedIds = new Set<string>(result.failures || []);
      const successfulIds = mutations
        .filter((m) => !failedIds.has(m.id))
        .map((m) => m.id);

      await removeQueuedMutations(successfulIds);

      // Dispatch event to inform UI about queue drain
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mfc:offline-sync-complete', {
            detail: { processed: processedCount, failures: result.failures || [] },
          })
        );
      }

      return {
        ok: true,
        processed: processedCount,
        failures: result.failures || [],
      };
    }

    return { ok: false, processed: 0, failures: result.failures || ['Sync failed'] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    return { ok: false, processed: 0, failures: [message] };
  } finally {
    isReplaying = false;
  }
}

// Automatically bind to online event in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void replayOfflineQueue();
  });
}
