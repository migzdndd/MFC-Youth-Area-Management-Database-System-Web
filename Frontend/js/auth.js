/**
 * MFC Youth Area Management System - Frontend Authentication
 *
 * Manages client authentication, session storage, and account provisioning.
 */

// Storage Keys & Access Level Configuration
const USER_KEY = 'mfc_demo_users';
const SESSION_KEY = 'mfc_demo_session';
const DB_KEY = 'mfc_web_database_v1';

/** Set of valid access roles within the system */
const ACCESS_ROLE_VALUES = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'chapter_servant',
  'member'
]);

/** Normalizes role string to canonical enum value */
function normalizeAccessRole(value) {
  const role = String(value || 'member').trim().toLowerCase();
  if (role === 'area_admin') return 'area_servant';
  return ACCESS_ROLE_VALUES.has(role) ? role : 'member';
}

/** Extracts the normalized role for a member record */
function roleForMember(member) {
  return normalizeAccessRole(member?.accessLevel || 'member');
}

/** Safely parses JSON with fallback */
function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

/** Normalizes email for case-insensitive lookup */
function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

// Section 2: Local Storage Cache: Members & Prototype Users

/** Reads cached member records from localStorage */
function getMembers() {
  const data = safeParse(localStorage.getItem(DB_KEY) || '{}', {});
  return Array.isArray(data.members) ? data.members : [];
}

/** Reconciles and returns prototype demo users from localStorage */
function getUsers() {
  const users = safeParse(localStorage.getItem(USER_KEY) || '[]', []);
  if (!Array.isArray(users)) return [];

  const members = getMembers();
  let changed = false;

  const normalized = users.map(raw => {
    const user = {
      ...raw,
      email: normalizeEmail(raw.email)
    };

    let linkedMember = null;

    if (
      user.memberId !== null &&
      user.memberId !== undefined
    ) {
      linkedMember = members.find(
        member => String(member.id) === String(user.memberId)
      ) || null;
    }

    if (!linkedMember && user.email) {
      const matches = members.filter(
        member =>
          normalizeEmail(member.email) &&
          normalizeEmail(member.email) === user.email
      );

      if (matches.length === 1) {
        linkedMember = matches[0];
      }
    }

    if (!user.role) {
      if (linkedMember) {
        user.role = roleForMember(linkedMember);
        user.memberId = linkedMember.id;
        user.mustChangePassword = user.mustChangePassword !== false;
      } else {
        user.role = 'legacy';
      }
      changed = true;
    }

    if (linkedMember && user.role !== 'legacy') {
      const desiredRole = roleForMember(linkedMember);
      const desiredChapterId = linkedMember.chapterId ?? null;
      const desiredActive = String(linkedMember.status || 'Active') !== 'Inactive';
      const desiredName = [
        linkedMember.firstName,
        linkedMember.middleName,
        linkedMember.lastName
      ].filter(Boolean).join(' ');

      if (user.role !== desiredRole) {
        user.role = desiredRole;
        changed = true;
      }

      if (String(user.memberId) !== String(linkedMember.id)) {
        user.memberId = linkedMember.id;
        changed = true;
      }

      if (String(user.chapterId ?? '') !== String(desiredChapterId ?? '')) {
        user.chapterId = desiredChapterId;
        changed = true;
      }

      if (user.isActive !== desiredActive) {
        user.isActive = desiredActive;
        changed = true;
      }

      if (desiredName && user.name !== desiredName) {
        user.name = desiredName;
        user.firstName = linkedMember.firstName || '';
        user.lastName = linkedMember.lastName || '';
        changed = true;
      }
    }

    return user;
  });

  if (changed) saveUsers(normalized);
  return normalized;
}

/** Saves user accounts to local storage */
function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

// Section 3: Session Management & Navigation Helpers

/** Reads current active session from localStorage or sessionStorage */
/** Reads current active session from localStorage or sessionStorage with expiration validation */
function getSession() {
  const raw = safeParse(localStorage.getItem(SESSION_KEY), null) || safeParse(sessionStorage.getItem(SESSION_KEY), null);
  if (!raw) return null;

  // Session validation: automatically purge expired tokens
  if (raw.expiresAt) {
    const expiresAtMs = typeof raw.expiresAt === 'number' ? raw.expiresAt * 1000 : new Date(raw.expiresAt).getTime();
    if (Date.now() >= expiresAtMs) {
      clearSession();
      return null;
    }
  }

  return raw;
}

/** Persists session data to either localStorage (remember me) or sessionStorage */
function saveSession(session, remember) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
}

/** Updates the active session in-place in whichever storage it was saved */
function updateSession(session) {
  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

/** Clears session storage on logout */
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/** Determines landing route based on session state, permissions, and roles */
function destinationFor(session) {
  if (session?.mustChangePassword) return '/change-password';
  if (session?.needsAreaSetup) return '/dashboard';
  if (session?.role === 'member') return '/member';
  if (session?.role === 'chapter_servant') return '/dashboard';
  return '/dashboard';
}

// Section 4: API Request Client & Backend Session Mapping

/** Performs authenticated JSON HTTP fetch requests to backend endpoints */
async function apiJson(path, options = {}) {
  const activeSession = getSession();
  const accessToken = activeSession?.backendAuth && !activeSession?.demo
    ? String(activeSession.accessToken || '')
    : '';

  const response = await fetch(path, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    }
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = { ok: false, error: 'The server returned an invalid response.' };
  }

  if (!response.ok) {
    if (response.status === 403 && body?.code === 'MFA_REQUIRED') {
      if (typeof navigateWithLoader === 'function') {
        navigateWithLoader('/mfa-verify.html');
      } else {
        window.location.href = '/mfa-verify.html';
      }
    }
    if (response.status === 401 && (body?.code === 'INVALID_SESSION' || body?.code === 'AUTH_REQUIRED')) {
      clearSession();
    }

    const error = new Error(body?.error || 'Request failed.');
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }

  return body;
}

/** Transforms backend login/register response into a standard client session object */
function backendSessionFromResponse(payload, remember = false) {
  const user = payload?.user || {};
  const serverSession = payload?.session || {};
  const session = {
    userId: user.id ?? null,
    memberId: user.memberId ?? null,
    email: user.email || '',
    name: user.name || user.email || 'Area User',
    role: normalizeAccessRole(user.role || 'member'),
    areaId: user.areaId ?? null,
    chapterId: user.chapterId ?? null,
    loginAt: new Date().toISOString(),
    mustChangePassword: user.mustChangePassword === true,
    needsAreaSetup: user.role !== 'member' && !user.areaId,
    accessToken: serverSession.accessToken || '',
    refreshToken: serverSession.refreshToken || '',
    expiresAt: serverSession.expiresAt || null,
    backendAuth: true,
    demo: false
  };
  saveSession(session, remember);
  return session;
}

// Section 5: UI Helpers: Alerts, Validation & Motion Effects

/** Displays an alert box message in the specified container element using the global message card design */
function showMessage(id, text, type = 'error') {
  const box = document.getElementById(id);
  if (!box) return;

  if (!text) {
    box.innerHTML = '';
    return;
  }

  const isSuccess = type === 'success';
  const title = isSuccess ? 'Success' : 'Error';

  box.innerHTML = `
    <div class="card message-card ${type}" role="${isSuccess ? 'status' : 'alert'}">
      <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,186.7C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
      <div class="icon-container">
        ${isSuccess
          ? `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
              <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>
            </svg>`
          : `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
              <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"></path>
            </svg>`
        }
      </div>
      <div class="message-text-container">
        <p class="message-text">${title}</p>
        <p class="sub-text">${escapeHtml(text)}</p>
      </div>
      <svg class="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" role="button" tabindex="0" aria-label="Dismiss message">
        <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clip-rule="evenodd" fill-rule="evenodd"></path>
      </svg>
    </div>
  `;

  const cross = box.querySelector('.cross-icon');
  if (cross) {
    cross.addEventListener('click', () => { box.innerHTML = ''; });
    cross.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        box.innerHTML = '';
      }
    });
  }
}

/** Escapes special HTML characters */
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

/** Checks for standard email address syntax */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Validates password complexity: minimum 8 characters with at least one letter and number */
function passwordError(password) {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one number.';
  return '';
}

/** Toggles loading/busy status and label on form submission buttons */
function setButtonBusy(button, busy, busyText = 'Please wait…') {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

/** Connects show/hide password toggle buttons */
function attachPasswordToggles() {
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.textContent = showing ? 'Show' : 'Hide';
      button.setAttribute('aria-label', `${showing ? 'Show' : 'Hide'} password`);
    });
  });
}

/** Sets up entry reveal animations with stagger */
function initializeRevealAnimations() {
  const revealTargets = document.querySelectorAll('.animate-in');
  if (!revealTargets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  revealTargets.forEach((element, index) => {
    element.style.animationDelay = `${index * 80}ms`;
    requestAnimationFrame(() => element.classList.add('is-visible'));
  });
}

window.addEventListener('DOMContentLoaded', initializeRevealAnimations);

// Redirect already signed-in users attempting to access public login/register pages
const currentSession = getSession();
if (currentSession && document.body.dataset.allowAuthenticated !== 'true') {
  navigateWithLoader(destinationFor(currentSession), true);
}

// Section 6: Login Flow (Demo & Cloud)

/** Configured access levels available for Demo testing */
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

/** Starts a pre-configured offline demo session for testing with chosen role */
function startDemoLogin(roleKey = 'area_servant', remember = false) {
  const chosen = DEMO_ROLES.find(r => r.role === roleKey) || DEMO_ROLES[0];
  
  let demoChapterId = null;
  if (chosen.role === 'chapter_servant') {
    const data = safeParse(localStorage.getItem(DB_KEY) || '{}', {});
    if (Array.isArray(data.chapters) && data.chapters.length > 0) {
      demoChapterId = data.chapters[0].id;
    } else {
      demoChapterId = '1';
    }
  }

  const session = {
    email: `${chosen.role}@mfcyouth.local`,
    name: `${chosen.label} (Demo)`,
    role: chosen.role,
    chapterId: demoChapterId,
    areaId: 'NCR-CENTRAL',
    areaName: 'NCR Central',
    loginAt: new Date().toISOString(),
    mustChangePassword: false,
    demo: true
  };

  saveSession(session, remember);
  navigateWithLoader('/dashboard');
}

/** Displays modal prompt to select demo access level */
function openDemoRoleModal(remember = false) {
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

  modal.innerHTML = `
    <div style="background: var(--surface, #ffffff); border-radius: 16px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid var(--border, #e2e8f0); overflow: hidden; display: flex; flex-direction: column; max-height: 90vh;">
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border, #e2e8f0); display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
        <div>
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a;">Select Demo Access Level</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b;">Choose which leadership role to test in this demo session.</p>
        </div>
        <button type="button" id="closeDemoRoleModal" style="background: none; border: none; font-size: 1.5rem; line-height: 1; color: #64748b; cursor: pointer; padding: 4px 8px; border-radius: 6px;">&times;</button>
      </div>

      <div style="padding: 16px 20px; overflow-y: auto; display: grid; grid-template-columns: 1fr; gap: 10px;">
        ${DEMO_ROLES.map(r => `
          <button
            type="button"
            class="demo-role-option"
            data-role="${r.role}"
            style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; text-align: left; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; gap: 4px;"
            onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#f8fafc'; this.style.transform='translateY(-1px)';"
            onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#ffffff'; this.style.transform='none';"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 1rem; color: #0f172a;">${r.label}</strong>
              <span style="font-size: 0.72rem; font-weight: 600; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; border: 1px solid #bfdbfe;">${r.badge}</span>
            </div>
            <p style="margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.35;">${r.description}</p>
          </button>
        `).join('')}
      </div>

      <div style="padding: 12px 20px; border-top: 1px solid var(--border, #e2e8f0); background: #f8fafc; text-align: right;">
        <button type="button" id="cancelDemoRoleModal" style="padding: 8px 16px; font-size: 0.85rem; font-weight: 500; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 6px; cursor: pointer; color: #475569;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => {
    modal.remove();
    document.removeEventListener('keydown', onKeyDown);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);

  document.getElementById('closeDemoRoleModal')?.addEventListener('click', close);
  document.getElementById('cancelDemoRoleModal')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  modal.querySelectorAll('.demo-role-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedRole = btn.getAttribute('data-role');
      btn.style.opacity = '0.7';
      btn.textContent = 'Launching…';
      startDemoLogin(selectedRole, remember);
    });
  });
}

// One-click demo login button
const demoLoginButton = document.getElementById('demoLoginButton');
if (demoLoginButton) {
  demoLoginButton.addEventListener('click', () => {
    openDemoRoleModal(false);
  });
}

// Main sign-in form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = loginForm.querySelector('[type="submit"]');
    const email = normalizeEmail(document.getElementById('loginEmail').value);
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe')?.checked === true;

    if (!isValidEmail(email)) {
      showMessage('loginMessage', 'Enter a valid email address.');
      return;
    }

    setButtonBusy(submit, true, 'Signing In…');

    // Built-in demo credentials check
    const demoOk = email === 'admin@mfcyouth.local' && password === 'admin123';
    if (demoOk) {
      setButtonBusy(submit, false, 'Sign In');
      openDemoRoleModal(remember);
      return;
    }

    // Authenticate via cloud backend with prototype fallback
    try {
      const payload = await apiJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (payload?.mfaRequired) {
        sessionStorage.setItem('mfa_pending', JSON.stringify({
          factorId: payload.factorId,
          tempSession: payload.tempSession,
          user: payload.user,
          remember
        }));
        navigateWithLoader('/mfa-verify.html');
        return;
      }

      const session = backendSessionFromResponse(payload, remember);
      navigateWithLoader(destinationFor(session));
      return;
    } catch (backendError) {
      const users = getUsers();
      const user = users.find(item => item.email === email && item.password === password);

      if (!user) {
        setButtonBusy(submit, false);
        showMessage('loginMessage', backendError?.message || 'Account not found or password is incorrect.');
        return;
      }

      if (user.role === 'legacy') {
        setButtonBusy(submit, false);
        showMessage('loginMessage', 'This older account is not linked to a member record. Ask an Area-level servant to add or link you from the Members page.');
        return;
      }

      if (user.isActive === false) {
        setButtonBusy(submit, false);
        showMessage('loginMessage', 'This account is currently inactive. Contact an Area-level servant.');
        return;
      }

      const session = {
        userId: user.id,
        memberId: user.memberId ?? null,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: normalizeAccessRole(user.role || 'member'),
        chapterId: user.chapterId ?? null,
        loginAt: new Date().toISOString(),
        mustChangePassword: user.mustChangePassword === true,
        needsAreaSetup: false,
        demo: false
      };

      saveSession(session, remember);
      navigateWithLoader(destinationFor(session));
    }
  });
}

// Section 7: Servant Leader Registration Flow
const adminRegistrationForm = document.getElementById('adminRegistrationForm');
if (adminRegistrationForm) {
  adminRegistrationForm.addEventListener('submit', async event => {
    event.preventDefault();

    const submit = document.getElementById('adminRegisterButton') || adminRegistrationForm.querySelector('[type="submit"]');
    const displayName = String(document.getElementById('adminDisplayName')?.value || '').trim();
    const email = normalizeEmail(document.getElementById('adminEmail')?.value || '');
    const role = String(document.getElementById('adminRole')?.value || '').trim();
    const verificationCode = String(document.getElementById('adminVerificationCode')?.value || '');
    const password = String(document.getElementById('adminPassword')?.value || '');
    const confirmPassword = String(document.getElementById('adminPasswordConfirm')?.value || '');

    if (!displayName) {
      showMessage('adminRegistrationMessage', 'Enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      showMessage('adminRegistrationMessage', 'Enter a valid email address.');
      return;
    }
    if (!['national_coordinator', 'couple_coordinator', 'area_servant', 'lit_servant', 'campus_servant', 'mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(role)) {
      showMessage('adminRegistrationMessage', 'Select your System Access Level.');
      return;
    }
    if (!verificationCode) {
      showMessage('adminRegistrationMessage', 'Enter the administrator registration password.');
      return;
    }

    const pError = passwordError(password);
    if (pError) {
      showMessage('adminRegistrationMessage', pError);
      return;
    }
    if (password !== confirmPassword) {
      showMessage('adminRegistrationMessage', 'Passwords do not match.');
      return;
    }

    setButtonBusy(submit, true, 'Creating Account…');

    try {
      const payload = await apiJson('/api/auth/admin-register', {
        method: 'POST',
        body: JSON.stringify({
          displayName,
          email,
          role,
          verificationCode,
          password,
          confirmPassword
        })
      });

      const session = backendSessionFromResponse(payload, true);
      session.needsAreaSetup = true;
      updateSession(session);
      showMessage('adminRegistrationMessage', 'Account created with your chosen password. Redirecting to Area setup…', 'success');
      setTimeout(() => { navigateWithLoader('/dashboard'); }, 550);
    } catch (error) {
      setButtonBusy(submit, false);
      showMessage('adminRegistrationMessage', error?.message || 'Unable to create the account.');
    }
  });
}

// Section 8: Member Portal Account Claim Flow
const memberClaimForm = document.getElementById('memberClaimForm');
if (memberClaimForm) {
  memberClaimForm.addEventListener('submit', async event => {
    event.preventDefault();

    const submit = document.getElementById('memberClaimButton');
    const email = normalizeEmail(document.getElementById('memberClaimEmail')?.value || '');
    const password = String(document.getElementById('memberClaimPassword')?.value || '');
    const confirmation = String(document.getElementById('memberClaimPasswordConfirm')?.value || '');

    if (!isValidEmail(email)) {
      showMessage('memberClaimMessage', 'Enter the email address stored in your Member record.');
      return;
    }
    const pError = passwordError(password);
    if (pError) {
      showMessage('memberClaimMessage', pError);
      return;
    }
    if (password !== confirmation) {
      showMessage('memberClaimMessage', 'Passwords do not match.');
      return;
    }

    setButtonBusy(submit, true, 'Creating Account…');
    try {
      const payload = await apiJson('/api/auth/member-claim', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (payload.verificationRequired) {
        setButtonBusy(submit, false);
        showMessage('memberClaimMessage', payload.message || 'Check your email to verify your account, then sign in.', 'success');
        return;
      }

      const session = backendSessionFromResponse(payload, false);
      showMessage('memberClaimMessage', 'Your Member Portal account is ready. Redirecting…', 'success');
      setTimeout(() => navigateWithLoader(destinationFor(session)), 550);
    } catch (error) {
      setButtonBusy(submit, false);
      showMessage('memberClaimMessage', error?.message || 'Unable to create your Member Portal account. Please try again.');
    }
  });
}

// Section 9: Password Update & Force Change Flow
const backToLoginButton = document.getElementById('backToLoginButton');
if (backToLoginButton) {
  backToLoginButton.addEventListener('click', async () => {
    const activeSession = getSession();
    backToLoginButton.disabled = true;
    backToLoginButton.textContent = 'Signing Out…';

    if (activeSession?.backendAuth && !activeSession?.demo && activeSession?.accessToken) {
      try {
        await apiJson('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ scope: 'local' })
        });
      } catch {
        // Local browser state is still cleared so the user is not left signed in on this device.
      }
    }

    clearSession();
    navigateWithLoader('/');
  });
}

const forcePasswordForm = document.getElementById('forcePasswordForm');
if (forcePasswordForm) {
  const session = getSession();
  const accountEmail = document.getElementById('passwordAccountEmail');
  const pageTitle = document.getElementById('passwordPageTitle');
  const pageIntro = document.getElementById('passwordPageIntro');

  if (!session) {
    navigateWithLoader('/', true);
  } else if (session.demo) {
    showMessage('passwordMessage', 'The built-in demo administrator password cannot be changed from this prototype.', 'error');
    forcePasswordForm.querySelectorAll('input, button[type="submit"]').forEach(el => { el.disabled = true; });
  } else {
    if (accountEmail) accountEmail.textContent = session.email;
    if (session.mustChangePassword) {
      if (pageTitle) pageTitle.textContent = 'Secure Your Account';
      if (pageIntro) pageIntro.textContent = 'Your account requires a password update before continuing.';
    }

    forcePasswordForm.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = forcePasswordForm.querySelector('[type="submit"]');
      const currentPassword = document.getElementById('currentPassword').value;
      const password = document.getElementById('newPassword').value;
      const confirmation = document.getElementById('newPasswordConfirm').value;
      const pError = passwordError(password);

      if (!currentPassword) {
        showMessage('passwordMessage', 'Enter your current password.');
        return;
      }
      if (pError) {
        showMessage('passwordMessage', pError);
        return;
      }
      if (password !== confirmation) {
        showMessage('passwordMessage', 'New passwords do not match.');
        return;
      }
      if (password === currentPassword) {
        showMessage('passwordMessage', 'Choose a new password that is different from your current password.');
        return;
      }

      // Backend-authenticated users: call the Supabase change-password API
      if (session.backendAuth && !session.demo) {
        setButtonBusy(submit, true, 'Updating…');
        try {
          await apiJson('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword: password })
          });

          const updatedSession = { ...session, mustChangePassword: false };
          updateSession(updatedSession);
          showMessage('passwordMessage', 'Password updated successfully. Redirecting…', 'success');
          setTimeout(() => { navigateWithLoader(destinationFor(updatedSession)); }, 650);
        } catch (error) {
          setButtonBusy(submit, false);
          showMessage('passwordMessage', error?.message || 'Unable to update your password. Please try again.');
        }
        return;
      }

      // Local prototype fallback for browser-only demo accounts
      const users = getUsers();
      const user = users.find(item => String(item.id) === String(session.userId)) || users.find(item => item.email === session.email);
      if (!user || user.password !== currentPassword) {
        showMessage('passwordMessage', 'Your current password is incorrect.');
        return;
      }

      user.password = password;
      user.mustChangePassword = false;
      user.passwordUpdatedAt = new Date().toISOString();
      saveUsers(users);

      const updatedSession = { ...session, mustChangePassword: false };
      updateSession(updatedSession);
      showMessage('passwordMessage', 'Password updated successfully. Redirecting…', 'success');
      setTimeout(() => { navigateWithLoader(destinationFor(updatedSession)); }, 650);
    });
  }
}

// ----------------------------------------------------------------------------
// 10. Email Address Change Flow
// ----------------------------------------------------------------------------
const changeEmailForm = document.getElementById('changeEmailForm');
if (changeEmailForm) {
  const emailSession = getSession();
  const newEmailInput = document.getElementById('newAccountEmail');

  if (!emailSession || emailSession.demo || !emailSession.backendAuth) {
    changeEmailForm.querySelectorAll('input, button').forEach(element => { element.disabled = true; });
    showMessage('emailChangeMessage', 'Email changes are available only for signed-in cloud accounts.');
  } else {
    changeEmailForm.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = changeEmailForm.querySelector('[type="submit"]');
      const newEmail = normalizeEmail(newEmailInput?.value || '');

      if (!isValidEmail(newEmail)) {
        showMessage('emailChangeMessage', 'Enter a valid new email address.');
        newEmailInput?.focus();
        return;
      }
      if (newEmail === normalizeEmail(emailSession.email || '')) {
        showMessage('emailChangeMessage', 'Enter an email address different from your current email.');
        newEmailInput?.focus();
        return;
      }

      setButtonBusy(submit, true, 'Requesting…');
      try {
        const payload = await apiJson('/api/auth/change-email', {
          method: 'POST',
          body: JSON.stringify({ newEmail })
        });

        showMessage(
          'emailChangeMessage',
          payload?.message || 'Email change requested. Complete the confirmation email process before the new address becomes active.',
          'success'
        );
        changeEmailForm.reset();
      } catch (error) {
        showMessage('emailChangeMessage', error?.message || 'Unable to request the email change. Please try again.');
      } finally {
        setButtonBusy(submit, false);
      }
    });
  }
}

// Initialize show/hide password toggle buttons
attachPasswordToggles();
