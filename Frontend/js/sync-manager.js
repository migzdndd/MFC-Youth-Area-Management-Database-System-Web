/**
 * ============================================================================
 * MFC Youth Area Management System - Background Re-synchronization Manager
 * ============================================================================
 * Purpose:
 * Coordinates the FIFO outbox queue processor, network status monitoring,
 * and conflict detection. Replays pending mutations (attendance, payments,
 * reports) sequentially to the backend router when connectivity is restored.
 *
 * Emitted Custom DOM Events:
 * - `sync:started`        ({ total, manual })
 * - `sync:progress`       ({ current, total, mutation })
 * - `sync:completed`      ({ syncedCount, failedCount, remaining })
 * - `sync:conflict`       ({ mutation, error, status })
 * - `sync:status-changed` ({ isSyncing, pendingCount, isOnline })
 * ============================================================================
 */

(function (root, factory) {
  const instance = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  } else {
    root.syncManager = instance;
    if (typeof root.window !== 'undefined') {
      root.window.syncManager = instance;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let isSyncing = false;
  let activeSyncPromise = null;
  let autoSyncTimer = null;
  let lastSyncTime = null;
  let lastSyncError = null;

  /**
   * Dispatches a custom event on window with standardized payload.
   */
  function dispatchSyncEvent(name, detail = {}) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      } catch (err) {
        console.warn(`[sync-manager] Failed to dispatch event ${name}:`, err);
      }
    }
  }

  /**
   * Returns current online status according to the browser.
   */
  function isOnline() {
    return typeof navigator !== 'undefined' ? Boolean(navigator.onLine) : true;
  }

  /**
   * Retrieves active login session safely.
   */
  function getCurrentSession() {
    if (typeof window !== 'undefined' && typeof window.getSession === 'function') {
      return window.getSession();
    }
    try {
      const stored = localStorage.getItem('mfc_demo_session') || sessionStorage.getItem('mfc_demo_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Broadcasts the current synchronization state to UI listeners.
   */
  async function broadcastStatus() {
    let pendingCount = 0;
    try {
      if (typeof window !== 'undefined' && window.offlineStore) {
        pendingCount = await window.offlineStore.countPendingMutations();
      }
    } catch (err) {
      console.warn('[sync-manager] Error getting pending count:', err);
    }

    dispatchSyncEvent('sync:status-changed', {
      isSyncing,
      pendingCount,
      isOnline: isOnline(),
      lastSyncTime,
      lastSyncError
    });
  }

  /**
   * Reconciles temporary client-side IDs with server-assigned database IDs.
   * Ensures that subsequent operations reference the canonical cloud record.
   */
  function reconcileEntityId(endpoint, tempId, serverRecord) {
    if (!tempId || !serverRecord?.id || tempId === serverRecord.id) return;
    if (typeof window === 'undefined' || typeof window.db !== 'function' || typeof window.save !== 'function') {
      return;
    }

    try {
      const data = window.db();
      let modified = false;

      if (endpoint.startsWith('/api/participants') && Array.isArray(data.participants)) {
        const item = data.participants.find(p => String(p.id) === String(tempId));
        if (item) {
          item.id = serverRecord.id;
          item.cloudBacked = true;
          delete item.optimistic;
          modified = true;
        }
      } else if (endpoint.startsWith('/api/reports') && Array.isArray(data.reports)) {
        const item = data.reports.find(r => String(r.id) === String(tempId));
        if (item) {
          item.id = serverRecord.id;
          item.cloudBacked = true;
          delete item.optimistic;
          modified = true;
        }
      }

      if (modified) {
        window.save(data);
      }
    } catch (err) {
      console.warn('[sync-manager] Failed to reconcile entity ID:', err);
    }
  }

  /**
   * Processes all pending mutations in the IndexedDB mutation queue in FIFO order.
   *
   * @param {object} [options]
   * @param {boolean} [options.manual=false] Whether triggered by explicit user interaction
   * @returns {Promise<object>} Summary of the sync execution
   */
  async function processOutbox(options = {}) {
    if (isSyncing) {
      return activeSyncPromise;
    }

    if (!isOnline()) {
      await broadcastStatus();
      return { ok: false, reason: 'offline', syncedCount: 0, failedCount: 0 };
    }

    const store = typeof window !== 'undefined' ? window.offlineStore : null;
    if (!store) {
      return { ok: false, reason: 'store_unavailable', syncedCount: 0, failedCount: 0 };
    }

    isSyncing = true;
    activeSyncPromise = (async () => {
      let syncedCount = 0;
      let failedCount = 0;
      let conflictCount = 0;

      try {
        const pending = await store.getPendingMutations();
        if (!pending || pending.length === 0) {
          isSyncing = false;
          await broadcastStatus();
          return { ok: true, syncedCount: 0, failedCount: 0, conflictCount: 0 };
        }

        const total = pending.length;
        dispatchSyncEvent('sync:started', { total, manual: Boolean(options.manual) });
        await broadcastStatus();

        const session = getCurrentSession();
        const token = session?.accessToken || '';

        // If backend auth is enabled but token is missing, pause sync until user logs in
        if (session?.backendAuth && !session?.demo && !token) {
          console.warn('[sync-manager] Sync paused: Authentication token required.');
          isSyncing = false;
          await broadcastStatus();
          return { ok: false, reason: 'auth_required', syncedCount: 0, failedCount: 0 };
        }

        for (let i = 0; i < pending.length; i++) {
          const mutation = pending[i];

          // Check if connectivity dropped mid-process
          if (!isOnline()) {
            console.warn('[sync-manager] Connection dropped during outbox processing.');
            await store.updateMutation(mutation.id, { status: 'pending' });
            break;
          }

          dispatchSyncEvent('sync:progress', {
            current: i + 1,
            total,
            mutation
          });

          await store.updateMutation(mutation.id, { status: 'syncing' });

          const headers = {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': mutation.id,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(mutation.headers || {})
          };

          if (session?.role === 'national_coordinator' && session?.areaId) {
            headers['X-MFC-Area-ID'] = session.areaId;
          }

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const fetchOptions = {
              method: mutation.method,
              headers,
              signal: controller.signal
            };

            if (mutation.method !== 'GET' && mutation.method !== 'HEAD' && mutation.payload) {
              fetchOptions.body = JSON.stringify(mutation.payload);
            }

            const response = await fetch(mutation.endpoint, fetchOptions);
            clearTimeout(timeoutId);

            let body = null;
            try {
              body = await response.json();
            } catch {
              body = null;
            }

            if (response.ok || response.status === 201 || response.status === 202) {
              // Mutation successfully committed on server
              await store.removeMutation(mutation.id);
              syncedCount++;

              // Reconcile client temporary IDs with server ID
              const serverRecord = body?.participant || body?.report || body?.data;
              if (serverRecord && mutation.payload?.id) {
                reconcileEntityId(mutation.endpoint, mutation.payload.id, serverRecord);
              }
            } else if (response.status === 409) {
              // Conflict detected (e.g. attendance duplicate or conflicting report update)
              conflictCount++;
              failedCount++;
              const conflictMessage = body?.error || 'A data conflict occurred while synchronizing.';
              console.warn(`[sync-manager] Conflict on ${mutation.endpoint}:`, conflictMessage);

              dispatchSyncEvent('sync:conflict', {
                mutation,
                error: conflictMessage,
                status: 409
              });

              // Mark as conflict to prevent queue blockage
              await store.updateMutation(mutation.id, {
                status: 'conflict',
                lastError: conflictMessage
              });
            } else if (response.status === 401 || response.status === 403) {
              // Authentication failure: halt sync to avoid account lockout
              console.error('[sync-manager] Authentication failed during sync.');
              await store.updateMutation(mutation.id, {
                status: 'pending',
                lastError: body?.error || 'Authentication expired.'
              });
              lastSyncError = body?.error || 'Authentication expired.';
              break;
            } else {
              // Other validation / business logic error (400, 422, 500)
              failedCount++;
              const errorMessage = body?.error || `Server responded with status ${response.status}.`;
              console.warn(`[sync-manager] Error syncing mutation ${mutation.id}:`, errorMessage);

              await store.updateMutation(mutation.id, {
                status: 'failed',
                retryCount: (mutation.retryCount || 0) + 1,
                lastError: errorMessage
              });
            }
          } catch (netError) {
            // Network dropped or timeout
            console.warn(`[sync-manager] Network failure syncing mutation ${mutation.id}:`, netError);
            await store.updateMutation(mutation.id, { status: 'pending' });
            lastSyncError = netError.message || 'Network disconnected.';
            break; // Stop iteration until connection is restored
          }
        }

        lastSyncTime = Date.now();
        const remaining = await store.countPendingMutations();

        // If any records were successfully committed, pull latest server state into local database
        if (syncedCount > 0 && typeof window.refreshAllCloudData === 'function') {
          try {
            await window.refreshAllCloudData({ render: true });
          } catch (refreshErr) {
            console.warn('[sync-manager] Post-sync cloud refresh notice:', refreshErr);
          }
        }

        dispatchSyncEvent('sync:completed', {
          syncedCount,
          failedCount,
          conflictCount,
          remaining
        });

        return {
          ok: true,
          syncedCount,
          failedCount,
          conflictCount,
          remaining
        };
      } catch (err) {
        console.error('[sync-manager] Outbox processing encountered fatal error:', err);
        lastSyncError = err.message;
        return { ok: false, error: err.message, syncedCount, failedCount };
      } finally {
        isSyncing = false;
        activeSyncPromise = null;
        await broadcastStatus();
      }
    })();

    return activeSyncPromise;
  }

  /**
   * Debounced scheduler to trigger sync processing.
   */
  function scheduleProcess(delay = 1200) {
    if (autoSyncTimer) clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(() => {
      if (isOnline()) {
        processOutbox().catch(err => {
          console.warn('[sync-manager] Scheduled sync failed:', err);
        });
      }
    }, delay);
  }

  /**
   * Initializes listeners for window online/offline, SW messages, and mutations.
   */
  function initialize() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[sync-manager] Online detected. Scheduling synchronization.');
      broadcastStatus();
      scheduleProcess(800);
    });

    window.addEventListener('offline', () => {
      console.log('[sync-manager] Offline detected.');
      broadcastStatus();
    });

    window.addEventListener('offline:mutation-enqueued', () => {
      broadcastStatus();
      if (isOnline()) {
        scheduleProcess(1000);
      }
    });

    window.addEventListener('offline:mutation-removed', () => {
      broadcastStatus();
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'TRIGGER_SYNC') {
          console.log('[sync-manager] Service worker requested sync trigger.');
          processOutbox();
        } else if (event.data?.type === 'MUTATION_QUEUED_OFFLINE') {
          broadcastStatus();
        }
      });
    }

    // Initial status broadcast on startup
    setTimeout(() => {
      broadcastStatus();
      if (isOnline()) {
        scheduleProcess(3000);
      }
    }, 500);

    // Periodic check every 45 seconds if pending mutations exist
    setInterval(async () => {
      if (!isSyncing && isOnline() && window.offlineStore) {
        const count = await window.offlineStore.countPendingMutations();
        if (count > 0) {
          processOutbox();
        }
      }
    }, 45000);
  }

  // Auto-initialize when loaded in browser window
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  }

  return {
    isOnline,
    processOutbox,
    broadcastStatus,
    scheduleProcess,
    get isSyncing() {
      return isSyncing;
    }
  };
});
