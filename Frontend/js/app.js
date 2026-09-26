/**
 * ============================================================================
 * MFC Youth Area Management System - Main Application Orchestrator
 * ============================================================================
 */

// Declare page and content global DOM variables at top-level
let page = document.body.dataset.page || null;
let content = document.getElementById('pageContent') || null;

// Section 9: Application Bootstrap & Session Verification

seedDB();

const ROLE_ALLOWED_PAGES = {
  area_servant: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events']),
  couple_coordinator: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events']),
  lit_servant: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events']),
  campus_servant: new Set(['dashboard', 'members', 'services', 'reports', 'events']),
  mfc_high_servant: new Set(['dashboard', 'members', 'services', 'reports', 'events']),
  area_kids_servant: new Set(['dashboard', 'members', 'reports', 'events']),
  chapter_servant: new Set(['dashboard', 'chapters', 'reports', 'events']),
  national_coordinator: new Set(['dashboard', 'members', 'chapters', 'services', 'reports', 'events'])
};

const ROLE_SIDEBAR_CONFIG = {
  area_servant: {
    paths: ['/dashboard', '/members', '/chapters', '/services', '/reports', '/events'],
    labels: { '/chapters': 'Chapters', '/services': 'Services' }
  },
  couple_coordinator: {
    paths: ['/dashboard', '/members', '/chapters', '/services', '/reports', '/events'],
    labels: { '/chapters': 'Chapters', '/services': 'Services' }
  },
  lit_servant: {
    paths: ['/dashboard', '/members', '/chapters', '/services', '/reports', '/events'],
    labels: { '/chapters': 'Chapter', '/services': 'Services' }
  },
  campus_servant: {
    paths: ['/dashboard', '/members', '/services', '/reports', '/events'],
    labels: { '/services': 'Service' }
  },
  mfc_high_servant: {
    paths: ['/dashboard', '/members', '/services', '/reports', '/events'],
    labels: { '/services': 'Service' }
  },
  area_kids_servant: {
    paths: ['/dashboard', '/members', '/reports', '/events'],
    labels: {}
  },
  chapter_servant: {
    paths: ['/dashboard', '/chapters', '/reports', '/events'],
    labels: { '/chapters': 'Chapter' }
  },
  national_coordinator: {
    paths: ['/dashboard', '/reports', '/events'],
    labels: {}
  }
};

const session = getSession();

if (!session) {
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

const DEMO_ROLES = [
  {
    role: 'area_servant',
    label: 'Area Servant',
    badge: 'Full Area Access',
    description: 'Comprehensive management across all members, chapters, services, reports, and events.'
  },
  {
    role: 'lit_servant',
    label: 'Area LIT Servant',
    badge: 'LIT & Services',
    description: 'Focus on Leader-In-Training development, chapter service roles, reports, and events.'
  },
  {
    role: 'area_kids_servant',
    label: 'Area Kids Servant',
    badge: 'Kids Ministry',
    description: 'Management of kids ministry records, member rosters, activity reports, and events.'
  },
  {
    role: 'mfc_high_servant',
    label: 'MFC High Servant',
    badge: 'High School',
    description: 'High school section coordination with filtered member roster, service view, and reports.'
  },
  {
    role: 'campus_servant',
    label: 'Campus Servant',
    badge: 'Campus & College',
    description: 'Campus ministry coordination covering Senior High and College members, service view, and events.'
  },
  {
    role: 'chapter_servant',
    label: 'Chapter Servant',
    badge: 'Chapter Level',
    description: 'Chapter-scoped operations with chapter profile management, activity reports, and events.'
  }
];

function openDemoRoleSwitcher() {
  const existing = document.getElementById('demoRoleModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'demoRoleModal';
  modal.className = 'modal is-open';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(4px);
    padding: 16px;
    animation: fadeIn 0.2s ease;
  `;

  modal.setAttribute('x-data', '{ open: true, close() { this.open = false; setTimeout(() => modal.remove(), 220); } }');
  modal.setAttribute('x-show', 'open');
  modal.setAttribute('x-transition.opacity', '');
  modal.setAttribute('x-cloak', '');
  modal.setAttribute('@keydown.escape.window', 'close()');
  modal.setAttribute('@click.self', 'close()');

  modal.innerHTML = `
    <div x-show="open" x-transition style="background: var(--surface, #ffffff); border-radius: 16px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid var(--border, #e2e8f0); overflow: hidden; display: flex; flex-direction: column; max-height: 90vh;">
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border, #e2e8f0); display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
        <div>
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a;">Switch Demo Access Level</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">Select another leadership role to test in this session.</p>
        </div>
        <button type="button" id="closeDemoRoleModal" @click="close()" style="background: none; border: none; font-size: 1.5rem; line-height: 1; color: #64748b; cursor: pointer; padding: 4px 8px; border-radius: 6px;">&times;</button>
      </div>

      <div style="padding: 16px 20px; overflow-y: auto; display: grid; grid-template-columns: 1fr; gap: 10px;">
        ${DEMO_ROLES.map(r => `
          <button
            type="button"
            class="demo-role-option"
            data-role="${r.role}"
            style="background: ${session?.role === r.role ? '#eff6ff' : '#ffffff'}; border: 1px solid ${session?.role === r.role ? '#3b82f6' : '#e2e8f0'}; border-radius: 10px; padding: 14px 16px; text-align: left; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; gap: 4px;"
            onmouseover="if('${session?.role}' !== '${r.role}') { this.style.borderColor='#3b82f6'; this.style.background='#f8fafc'; }"
            onmouseout="if('${session?.role}' !== '${r.role}') { this.style.borderColor='#e2e8f0'; this.style.background='#ffffff'; }"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 1rem; color: #0f172a;">${r.label}</strong>
              <span style="font-size: 0.72rem; font-weight: 600; background: ${session?.role === r.role ? '#2563eb' : '#eff6ff'}; color: ${session?.role === r.role ? '#ffffff' : '#2563eb'}; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe;">
                ${session?.role === r.role ? 'Current Role' : r.badge}
              </span>
            </div>
            <p style="margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.35;">${r.description}</p>
          </button>
        `).join('')}
      </div>

      <div style="padding: 12px 20px; border-top: 1px solid var(--border, #e2e8f0); background: #f8fafc; text-align: right;">
        <button type="button" id="cancelDemoRoleModal" @click="close()" style="padding: 8px 16px; font-size: 0.85rem; font-weight: 500; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; color: #475569;">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    if (modal._x_dataStack?.[0]?.close) {
      modal._x_dataStack[0].close();
    } else {
      modal.remove();
    }
  };

  modal.querySelectorAll('.demo-role-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedRole = btn.getAttribute('data-role');
      const chosen = DEMO_ROLES.find(r => r.role === selectedRole);
      if (!chosen) return;

      const data = db();
      let demoChapterId = null;
      if (chosen.role === 'chapter_servant') {
        demoChapterId = data.chapters?.[0]?.id || '1';
      }

      session.role = chosen.role;
      session.name = `${chosen.label} (Demo)`;
      session.email = `${chosen.role}@mfcyouth.local`;
      session.chapterId = demoChapterId;
      updateStoredSession(session);
      
      close();
      toast(`Switched Demo Access Level to ${chosen.label}`);
      navigateWithLoader('/dashboard', true);
    });
  });
}

if (logoutBtn) {
  const profileCard = document.createElement('div');
  profileCard.className = 'signed-in-user profile-card';

  const scopeData = db();
  const chapter = isChapterServantSession()
    ? scopedChapter(scopeData)
    : null;

  profileCard.innerHTML = `
    <span>Signed in as</span>
    <strong>
      ${esc(
    session?.name ||
    session?.email ||
    'Area User'
  )}
    </strong>
    <small class="signed-in-role">
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

    if (session?.demo) {
      const switchDemoBtn = document.createElement('button');
      switchDemoBtn.type = 'button';
      switchDemoBtn.className = 'sidebar-account-action';
      switchDemoBtn.style.color = 'var(--blue, #2563eb)';
      switchDemoBtn.textContent = 'Switch Demo Role';
      switchDemoBtn.onclick = () => openDemoRoleSwitcher();
      logoutBtn.parentElement?.insertBefore(switchDemoBtn, logoutBtn);
    }

    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'sidebar-account-action member-preview-button';
    previewButton.textContent = 'Enter Members Portal';
    previewButton.onclick = () => navigateWithLoader('/member?preview=1');
    logoutBtn.parentElement?.insertBefore(previewButton, logoutBtn);

    if (session?.backendAuth && !session?.demo) {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'sidebar-account-action delete-account-button';
      deleteButton.setAttribute('x-data', '{ loading: false }');
      deleteButton.setAttribute('x-bind:disabled', 'loading');
      deleteButton.innerHTML = '<span x-show="!loading">Delete Account</span><span x-show="loading" x-cloak>Deleting Account…</span>';
      deleteButton.onclick = async () => {
        const warning = 'Permanently delete your account? This removes your Supabase login, profile, and linked member record. This cannot be undone.';
        if (!window.confirm(warning)) return;

        const typed = window.prompt('Type DELETE to permanently delete your account.');
        if (typed !== 'DELETE') {
          toast('Account deletion cancelled.', 'error');
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
    }
  }

  logoutBtn.setAttribute('x-data', '{ loading: false }');
  logoutBtn.setAttribute('x-bind:disabled', 'loading');
  logoutBtn.innerHTML = '<span x-show="!loading">Logout</span><span x-show="loading" x-cloak>Signing Out…</span>';

  logoutBtn.onclick = async () => {
    const alpineData = logoutBtn._x_dataStack?.[0];
    if (alpineData) alpineData.loading = true;
    else { logoutBtn.disabled = true; logoutBtn.textContent = 'Signing Out…'; }

    if (session?.backendAuth && !session?.demo && session?.accessToken) {
      try {
        await backendApi('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ scope: 'local' })
        });
      } catch (error) {
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

// Section 19: Page Router, Error Boundary & Live Sync

const renderers = {
  dashboard: renderDashboard,
  members: renderMembers,
  chapters: renderChapters,
  services: renderServices,
  reports: renderReports,
  events: renderEvents
};

/**
 * Renders a fallback UI when the main page rendering fails.
 *
 * @param {Error|any} error - The caught error object.
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
 * Attempts to render the current page securely, falling back to an error state if it fails.
 *
 * @returns {boolean} True if rendered successfully, false otherwise.
 */
function renderPageSafely() {
  try {
    const renderer = renderers[page] || renderDashboard;
    renderer();
    content?.removeAttribute('aria-busy');
    window.MFCPageSkeleton?.clear?.();
    return true;
  } catch (error) {
    renderPageFailure(error);
    return false;
  }
}

async function refreshCloudDataInBackground() {
  try {
    await refreshAllCloudData({ render: true });
  } catch (error) {
    // Cached data remains usable when the network is unavailable. Supabase is
    // still the source of truth and will reconcile on the next successful sync.
    console.warn('Background cloud sync skipped:', error?.message || error);
  }
}

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

async function bootstrapApplication() {
  try {
    // Render immediately from cached/browser data so page switching never waits
    // for Supabase/network synchronization.
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

window.addEventListener('error', event => {
  console.error('Unhandled page error:', event?.error || event?.message || event);
  // Contingency Fallback UI: Notify user of unhandled exception
  if (typeof window.toast === 'function') {
    window.toast('An unexpected error occurred. You may need to reload the page.', 'error');
  }
});

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled async error:', event?.reason || event);
  // Contingency Fallback UI: Notify user of async failure
  if (typeof window.toast === 'function') {
    window.toast('A background process failed. Please try your last action again.', 'error');
  }
});

bootstrapApplication().catch(error => {
  renderPageFailure(error);
});
