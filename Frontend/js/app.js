/**
 * Main Frontend Application Controller and Router
 *
 * What it Does: Simple non IT Terms
 * Acts as the conductor of the leader portal. It checks who is logged in, shows the
 * right navigation tabs according to their leadership role, renders pages (Dashboard,
 * Members, Chapters, Services, Reports, Events), and keeps offline storage up to date.
 */

// Global screen indicators
let page = document.body.dataset.page || null;
let content = document.getElementById('pageContent') || null;

// Section 1: Initial Database Setup & Page Permissions by Role

// Make sure a clean database template exists in storage
seedDB();

// List of allowed pages for each servant leader role
const ROLE_ALLOWED_PAGES = {
  area_servant: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings']),
  couple_coordinator: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings']),
  lit_servant: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings']),
  campus_servant: new Set(['dashboard', 'members', 'services', 'reports', 'events', 'gig', 'readings']),
  mfc_high_servant: new Set(['dashboard', 'members', 'services', 'reports', 'events', 'gig', 'readings']),
  area_kids_servant: new Set(['dashboard', 'members', 'reports', 'events', 'gig', 'readings']),
  chapter_servant: new Set(['dashboard', 'chapters', 'reports', 'events', 'gig', 'readings']),
  national_coordinator: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events', 'gig', 'readings'])
};

// Which links appear in the sidebar menu for each role
const ROLE_SIDEBAR_CONFIG = {
  area_servant: {
    paths: ['/dashboard', '/members', '/chapters', '/services', '/reports', '/events', '/gig', '/readings'],
    labels: { '/chapters': 'Chapters', '/services': 'Services' }
  },
  couple_coordinator: {
    paths: ['/dashboard', '/members', '/chapters', '/services', '/reports', '/events', '/gig', '/readings'],
    labels: { '/chapters': 'Chapters', '/services': 'Services' }
  },
  lit_servant: {
    paths: ['/dashboard', '/members', '/chapters', '/services', '/reports', '/events', '/gig', '/readings'],
    labels: { '/chapters': 'Chapter', '/services': 'Services' }
  },
  campus_servant: {
    paths: ['/dashboard', '/members', '/services', '/reports', '/events', '/gig', '/readings'],
    labels: { '/services': 'Service' }
  },
  mfc_high_servant: {
    paths: ['/dashboard', '/members', '/services', '/reports', '/events', '/gig', '/readings'],
    labels: { '/services': 'Service' }
  },
  area_kids_servant: {
    paths: ['/dashboard', '/members', '/reports', '/events', '/gig', '/readings'],
    labels: {}
  },
  chapter_servant: {
    paths: ['/dashboard', '/chapters', '/reports', '/events', '/gig', '/readings'],
    labels: { '/chapters': 'Chapter' }
  },
  national_coordinator: {
    paths: ['/dashboard', '/reports', '/events', '/gig', '/readings'],
    labels: {}
  }
};

// Section 2: Login Verification & Screen Navigation Guards

const session = getSession();

// Check login credentials:
// 1. If not logged in, go to sign in.
// 2. If password must be changed, go to change-password.
// 3. If regular youth member, go to the Member Portal.
// 4. If trying to visit a page not allowed for your role, redirect to your dashboard.
if (!session || !session.backendAuth) {
  clearSession();
  navigateWithLoader('/', true);
} else if (session.mustChangePassword) {
  navigateWithLoader('/change-password', true);
} else if (session.role === 'member') {
  navigateWithLoader('/member', true);
} else if (page && session && !session.needsAreaSetup) {
  const allowed = ROLE_ALLOWED_PAGES[session.role] || ROLE_ALLOWED_PAGES.area_servant;
  if (!allowed.has(page)) {
    navigateWithLoader('/dashboard', true);
  }
}

const logoutBtn = document.getElementById('logoutBtn');

/**
 * Customizes Sidebar Menu for Your Role
 *
 * What it does:
 * Shows the menu links you are allowed to see and hides the ones you are not
 * (for example, Chapter Servants see their Chapter and Activities, but not all Area chapters).
 *
 * Backup plan if it breaks:
 * If your role is unrecognized, it falls back to the Area Servant menu so you
 * are not left with a broken, blank sidebar.
 */
function applySidebarRoleConfig() {
  const role = session?.role || 'member';
  const config = ROLE_SIDEBAR_CONFIG[role] || ROLE_SIDEBAR_CONFIG.area_servant;
  const allowedPaths = new Set(config.paths);

  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (!allowedPaths.has(href)) {
      link.classList.add('role-hidden');
      link.setAttribute('aria-hidden', 'true');
      link.tabIndex = -1;
      link.style.display = 'none';
    } else {
      link.classList.remove('role-hidden');
      link.removeAttribute('aria-hidden');
      link.tabIndex = 0;
      link.style.display = '';

      if (config.labels && config.labels[href]) {
        const customText = config.labels[href];
        Array.from(link.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = customText;
          }
        });
      }
    }
  });
}
applySidebarRoleConfig();



// Section 4: Sidebar Profile Card, Preview Links, and Account Actions

if (logoutBtn) {
  const profileCard = document.createElement('div');
  profileCard.className = 'signed-in-user profile-card';

  const scopeData = db();
  const chapter = isChapterServantSession()
    ? scopedChapter(scopeData)
    : null;

  // Builds the user badge card showing your name, title, and chapter
  profileCard.innerHTML = `
    <span>Signed in as</span>
    <strong>
      ${esc(
    session?.name ||
    session?.email ||
    'Area User'
  )}
    </strong>
    <small class="signed-in-role" title="Leadership Access: ${esc(accessRoleLabel(session?.role))} — Authorized with administrative permissions to manage area and chapter records.">
      ${esc(accessRoleLabel(session?.role))}
      ${chapter ? ` · ${esc(chapter.name)}` : ''}
    </small>
  `;

  const sidebar = document.querySelector('.sidebar');
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebar && sidebarNav) {
    sidebar.insertBefore(profileCard, sidebarNav);
  } else {
    logoutBtn.parentElement?.insertBefore(
      profileCard,
      logoutBtn
    );
  }

  if (session?.role !== 'member') {
    // Return button for National Coordinator managing specific areas
    if (session?.role === 'national_coordinator' && session?.areaId) {
      const returnButton = document.createElement('button');
      returnButton.type = 'button';
      returnButton.className = 'sidebar-account-action';
      returnButton.textContent = 'Return to National DB';
      returnButton.onclick = () => {
        session.areaId = null;
        session.areaName = null;
        updateStoredSession(session);
        toast('Returning to National Dashboard...');
        navigateWithLoader('/dashboard', true);
      };
      logoutBtn.parentElement?.insertBefore(returnButton, logoutBtn);
    }



    // Button to preview the Member Portal
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'sidebar-account-action member-preview-button';
    previewButton.textContent = 'Enter Members Portal';
    previewButton.onclick = () => navigateWithLoader('/member?preview=1');
    logoutBtn.parentElement?.insertBefore(previewButton, logoutBtn);

    // Permanent Account Deletion (with safety double-confirmation)
    if (session?.backendAuth) {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'sidebar-account-action delete-account-button';
      deleteButton.setAttribute('x-data', '{ loading: false }');
      deleteButton.setAttribute('x-bind:disabled', 'loading');
      deleteButton.innerHTML = '<span x-show="!loading">Delete Account</span><span x-show="loading" style="display: none;">Deleting Account…</span>';
      deleteButton.onclick = async () => {
        const warning = 'Permanently delete your account? This removes your Supabase login, profile, and linked member record. This cannot be undone.';
        if (!window.confirm(warning)) return;

        const typed = window.prompt('Type DELETE to permanently delete your account.');
        if (typed !== 'DELETE') {
          return;
        }

        const alpineData = deleteButton._x_dataStack?.[0];
        if (alpineData) alpineData.loading = true;
        else { deleteButton.disabled = true; deleteButton.textContent = 'Deleting Account…'; }

        try {
          await backendApi('/api/auth/account', { method: 'DELETE' });

          const data = db();
          data.members = (data.members || []).filter(member =>
            String(member.id) !== String(session?.memberId) &&
            String(member.email || '').trim().toLowerCase() !== String(session?.email || '').trim().toLowerCase()
          );
          save(data);

          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          navigateWithLoader('/', true);
        } catch (error) {
          if (alpineData) alpineData.loading = false;
          else { deleteButton.disabled = false; deleteButton.textContent = 'Delete Account'; }
          toast(error?.message || 'Unable to delete the account.', 'error');
        }
      };
      logoutBtn.parentElement?.insertBefore(deleteButton, logoutBtn);
      if (window.Alpine) {
        try {
          window.Alpine.initTree(deleteButton);
        } catch (initErr) {
          console.warn('Alpine tree initialization skipped for delete button:', initErr);
        }
      }
    }
  }

  // Logout action handler
  logoutBtn.setAttribute('x-data', '{ loading: false }');
  logoutBtn.setAttribute('x-bind:disabled', 'loading');
  logoutBtn.innerHTML = '<span x-show="!loading">Logout</span><span x-show="loading" style="display: none;">Signing Out…</span>';
  if (window.Alpine) {
    try {
      window.Alpine.initTree(logoutBtn);
    } catch (initErr) {
      console.warn('Alpine tree initialization skipped for logout button:', initErr);
    }
  }

  logoutBtn.onclick = async () => {
    const alpineData = logoutBtn._x_dataStack?.[0];
    if (alpineData) alpineData.loading = true;
    else { logoutBtn.disabled = true; logoutBtn.textContent = 'Signing Out…'; }

    if (session?.backendAuth && session?.accessToken) {
      try {
        await backendApi('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ scope: 'local' })
        });
      } catch (error) {
        // Backup plan: Even if server cannot be reached, erase device login memory anyway
        console.warn('Backend logout could not be confirmed; clearing this browser session anyway.', error?.message || error);
      }
    }

    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    if (alpineData) alpineData.loading = false;
    else { logoutBtn.disabled = false; logoutBtn.textContent = 'Logout'; }
    navigateWithLoader('/');
  };
}

// Section 5: Page Router, Safety Nets & Background Sync

// Maps page names to their visual builder functions
const renderers = {
  dashboard: renderDashboard,
  members: renderMembers,
  chapters: renderChapters,
  services: renderServices,
  reports: renderReports,
  events: renderEvents,
  gig: renderGig,
  readings: renderReadings
};

/**
 * Displays Friendly Recovery Card When Page Fails
 *
 * What it does:
 * Catches any fatal error that happens while drawing a page and displays a clean,
 * reassuring card informing you that your data is safe, with a "Try Again" reload button.
 *
 * Backup plan if it breaks:
 * Protects your stored records and prevents you from ever seeing an unreadable blank screen.
 */
function renderPageFailure(error) {
  console.error('Page render failed:', error);

  const target = content || document.getElementById('pageContent');
  if (!target) return;

  window.MFCPageSkeleton?.clear?.();
  target.removeAttribute('aria-busy');
  target.innerHTML = `
    <section class="card page-load-error" role="alert">
      <h2>We couldn't finish loading this page.</h2>
      <p>Your data was not changed. You can safely try loading the page again.</p>
      <button class="btn blue" id="retryPageLoad" type="button">Try Again</button>
    </section>
  `;

  document.getElementById('retryPageLoad')?.addEventListener('click', () => {
    try {
      window.location.reload();
    } catch (reloadError) {
      console.error('Reload failed:', reloadError);
    }
  });
}

/**
 * Safely Draws Current Page
 *
 * What it does:
 * Calls the appropriate drawing function (Dashboard, Members, etc.) to show
 * the current screen.
 *
 * Backup plan if it breaks:
 * Catches any rendering failure and triggers the friendly recovery card.
 */
function renderPageSafely() {
  try {
    const target = content || document.getElementById('pageContent');
    const renderer = renderers[page] || renderDashboard;
    renderer();
    target?.removeAttribute('aria-busy');
    window.MFCPageSkeleton?.clear?.();
    ensureOfflineUIElements();
    if (window.syncManager) {
      window.syncManager.broadcastStatus();
    }
    return true;
  } catch (error) {
    renderPageFailure(error);
    return false;
  }
}

/**
 * Downloads Latest Data in Background
 *
 * What it does:
 * Silently contacts the server in the background to get the latest updates
 * without interrupting whatever you are doing.
 *
 * Backup plan if it breaks:
 * If there is no internet, it skips silently and lets you keep working with
 * your saved offline data.
 */
async function refreshCloudDataInBackground() {
  try {
    await refreshAllCloudData({ render: true });
  } catch (error) {
    console.warn('Background cloud sync skipped:', error?.message || error);
  }
}

/**
 * Schedules Background Downloads
 *
 * What it does:
 * Waits until your computer or phone is not busy before syncing with the cloud,
 * making sure buttons and typing remain fast and smooth.
 *
 * Backup plan if it breaks:
 * If your browser does not support requestIdleCallback, it uses a short backup timer.
 */
function scheduleBackgroundSync() {
  const run = () => {
    refreshCloudDataInBackground().catch(error => {
      console.warn('Background refresh failed:', error?.message || error);
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 450 });
  } else {
    window.setTimeout(run, 80);
  }
}

/**
 * Main System Startup
 *
 * What it does:
 * 1. Draws the screen immediately using fast saved offline records.
 * 2. Checks if your Area needs initial setup.
 * 3. Schedules a background check with the server for any fresh updates.
 *
 * Backup plan if it breaks:
 * Catches any startup error and triggers the safe recovery screen.
 */
async function bootstrapApplication() {
  try {
    const rendered = renderPageSafely();
    if (!rendered) return;

    try {
      await showAreaOnboarding();
    } catch (error) {
      console.warn('Area onboarding check skipped:', error?.message || error);
    }

    scheduleBackgroundSync();
  } catch (error) {
    renderPageFailure(error);
  }
}

// Global Safety Net: Alerts user if an unexpected script error occurs
let lastErrorToastTime = 0;
window.addEventListener('error', event => {
  // Ignore resource load errors (e.g. <img> or <script> 404s targeting DOM elements)
  if (event.target && event.target !== window) {
    return;
  }

  const rawError = event?.error || event?.message || event;
  const errorMsg = String(event?.message || rawError?.message || rawError || '');

  // Filter benign browser noise, user cancellations, and DOM cleanup that aren't critical errors
  if (
    errorMsg.includes('ResizeObserver') ||
    errorMsg.includes('Script error.') ||
    errorMsg.includes('AbortError') ||
    errorMsg.includes('canceled') ||
    errorMsg.includes('cancelled') ||
    errorMsg.includes('cancel') ||
    errorMsg.includes('transition') ||
    errorMsg.includes('null (reading') ||
    errorMsg.includes('undefined (reading')
  ) {
    console.warn('Suppressed benign or cancellation error:', errorMsg);
    return;
  }

  console.error('Unhandled page error:', rawError);

  const now = Date.now();
  // Deduplicate and throttle toast notifications (cooldown 3.5s to prevent toast stacking)
  if (now - lastErrorToastTime < 3500) {
    return;
  }
  lastErrorToastTime = now;

  if (typeof window.toast === 'function') {
    window.toast('An unexpected error occurred. You may need to reload the page.', 'error');
  }
});

// Global Safety Net: Alerts user if a background operation drops
let lastRejectionToastTime = 0;
window.addEventListener('unhandledrejection', event => {
  const reason = event?.reason;
  const reasonMsg = String(reason?.message || reason || '');

  // Filter benign rejections (aborted fetches, navigation cancellations)
  if (
    reason?.name === 'AbortError' ||
    reasonMsg.includes('aborted') ||
    reasonMsg.includes('canceled') ||
    reasonMsg.includes('cancelled') ||
    reasonMsg.includes('cancel')
  ) {
    return;
  }

  console.error('Unhandled async error:', reason || event);

  const now = Date.now();
  if (now - lastRejectionToastTime < 3500) {
    return;
  }
  lastRejectionToastTime = now;

  if (typeof window.toast === 'function') {
    window.toast('A background process failed. Please try your last action again.', 'error');
  }
});

// Start the application if signed in as a leader
if (session && !session.mustChangePassword && session.role !== 'member') {
  bootstrapApplication().catch(error => {
    renderPageFailure(error);
  });
}

// Section 6: PWA Service Worker Registration & UI Offline State Indicators

let syncedFadeTimeout = null;

/**
 * Creates or retrieves the top navigation offline status bar and mobile badge.
 */
function ensureOfflineUIElements() {
  const contentEl = content || document.getElementById('pageContent');
  if (!contentEl) return null;

  let statusBar = document.getElementById('offlineStatusBar');
  if (!statusBar) {
    statusBar = document.createElement('aside');
    statusBar.id = 'offlineStatusBar';
    statusBar.className = 'offline-status-bar';
    statusBar.setAttribute('role', 'status');
    statusBar.setAttribute('aria-live', 'polite');
    statusBar.hidden = true;
    statusBar.innerHTML = `
      <div class="offline-banner-content">
        <span class="offline-status-indicator" id="offlineStatusDot"></span>
        <span class="offline-status-text" id="offlineStatusText"></span>
      </div>
      <button class="offline-sync-btn" id="offlineSyncBtn" type="button" style="display:none;">Sync Now</button>
    `;
    contentEl.insertBefore(statusBar, contentEl.firstChild);

    document.getElementById('offlineSyncBtn')?.addEventListener('click', () => {
      if (window.syncManager) {
        window.syncManager.processOutbox({ manual: true });
      }
    });
  }

  // Mobile topbar offline badge integration
  const mobileTopbar = document.querySelector('.mobile-topbar');
  if (mobileTopbar && !document.getElementById('mobileOfflineBadge')) {
    const badge = document.createElement('span');
    badge.id = 'mobileOfflineBadge';
    badge.className = 'mobile-offline-badge';
    badge.style.display = 'none';
    const strong = mobileTopbar.querySelector('strong');
    if (strong && strong.nextSibling) {
      mobileTopbar.insertBefore(badge, strong.nextSibling);
    } else {
      mobileTopbar.appendChild(badge);
    }
  }

  return statusBar;
}

/**
 * Updates UI cues based on synchronization and network state.
 */
function updateOfflineUI(detail = {}) {
  const statusBar = ensureOfflineUIElements();
  const mobileBadge = document.getElementById('mobileOfflineBadge');
  const dot = document.getElementById('offlineStatusDot');
  const text = document.getElementById('offlineStatusText');
  const syncBtn = document.getElementById('offlineSyncBtn');

  if (!statusBar || !text) return;

  const isOnline = typeof detail.isOnline === 'boolean' ? detail.isOnline : navigator.onLine;
  const isSyncing = Boolean(detail.isSyncing);
  const pendingCount = Number(detail.pendingCount ?? 0);

  if (syncedFadeTimeout) {
    clearTimeout(syncedFadeTimeout);
    syncedFadeTimeout = null;
  }

  statusBar.classList.remove('is-offline', 'is-syncing', 'is-synced', 'is-conflict', 'is-pending');
  if (mobileBadge) {
    mobileBadge.classList.remove('is-syncing', 'is-synced');
  }

  if (!isOnline) {
    // Device is offline
    statusBar.hidden = false;
    statusBar.classList.add('is-offline');
    if (pendingCount > 0) {
      text.textContent = `Offline Mode · ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending sync`;
    } else {
      text.textContent = 'Offline Mode · Attendance checking and report drafts will save locally';
    }
    if (syncBtn) syncBtn.style.display = 'none';

    if (mobileBadge) {
      mobileBadge.style.display = 'inline-flex';
      mobileBadge.textContent = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline';
    }
  } else if (isSyncing) {
    // Replay outbox in progress
    statusBar.hidden = false;
    statusBar.classList.add('is-syncing');
    text.textContent = detail.progressText || (pendingCount > 0 ? `Syncing changes (${pendingCount} pending)...` : 'Syncing changes...');
    if (syncBtn) syncBtn.style.display = 'none';

    if (mobileBadge) {
      mobileBadge.style.display = 'inline-flex';
      mobileBadge.classList.add('is-syncing');
      mobileBadge.textContent = 'Syncing…';
    }
  } else if (pendingCount > 0) {
    // Back online, outbox waiting for sync
    statusBar.hidden = false;
    statusBar.classList.add('is-pending');
    text.textContent = `Connected · ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending sync`;
    if (syncBtn) {
      syncBtn.style.display = 'inline-block';
      syncBtn.textContent = 'Sync Now';
    }

    if (mobileBadge) {
      mobileBadge.style.display = 'inline-flex';
      mobileBadge.textContent = `${pendingCount} pending`;
    }
  } else {
    // Fully synced online state
    statusBar.hidden = true;
    if (syncBtn) syncBtn.style.display = 'none';
    if (mobileBadge) mobileBadge.style.display = 'none';
  }
}

// Subscribe to Sync Manager Custom DOM Events
window.addEventListener('sync:status-changed', event => {
  updateOfflineUI(event.detail);
});

window.addEventListener('sync:started', event => {
  const total = event.detail?.total || 1;
  updateOfflineUI({
    isOnline: true,
    isSyncing: true,
    pendingCount: total,
    progressText: `Syncing ${total} pending ${total === 1 ? 'change' : 'changes'}…`
  });
});

window.addEventListener('sync:progress', event => {
  const { current, total } = event.detail || {};
  updateOfflineUI({
    isOnline: true,
    isSyncing: true,
    pendingCount: Math.max(0, (total || 1) - (current || 0)),
    progressText: `Syncing changes (${current} of ${total})…`
  });
});

window.addEventListener('sync:completed', event => {
  const { syncedCount, remaining } = event.detail || {};
  if (syncedCount > 0 && remaining === 0) {
    const statusBar = ensureOfflineUIElements();
    const text = document.getElementById('offlineStatusText');
    const mobileBadge = document.getElementById('mobileOfflineBadge');
    if (statusBar && text) {
      statusBar.hidden = false;
      statusBar.classList.remove('is-offline', 'is-syncing', 'is-pending', 'is-conflict');
      statusBar.classList.add('is-synced');
      text.textContent = `All changes synced (${syncedCount} ${syncedCount === 1 ? 'item' : 'items'})`;
      if (mobileBadge) {
        mobileBadge.style.display = 'inline-flex';
        mobileBadge.classList.add('is-synced');
        mobileBadge.textContent = 'Synced';
      }
      syncedFadeTimeout = setTimeout(() => {
        statusBar.hidden = true;
        if (mobileBadge) mobileBadge.style.display = 'none';
      }, 3500);
    }
  } else {
    updateOfflineUI({ isOnline: navigator.onLine, isSyncing: false, pendingCount: remaining });
  }
});

window.addEventListener('sync:conflict', event => {
  const statusBar = ensureOfflineUIElements();
  const text = document.getElementById('offlineStatusText');
  const syncBtn = document.getElementById('offlineSyncBtn');
  if (statusBar && text) {
    statusBar.hidden = false;
    statusBar.classList.remove('is-offline', 'is-syncing', 'is-synced');
    statusBar.classList.add('is-conflict');
    text.textContent = `Sync notice: ${event.detail?.error || 'A record conflict occurred during sync.'}`;
    if (syncBtn) {
      syncBtn.style.display = 'inline-block';
      syncBtn.textContent = 'Dismiss';
      syncBtn.onclick = () => { statusBar.hidden = true; };
    }
  }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        // Silenced SW registration log
      })
      .catch(err => {
        // Silenced SW registration warning
      });
  });
}

