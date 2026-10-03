/**
 * Frontend Authentication, Session Management, and Credential Validator
 *
 * What it Does: Simple non IT Terms
 * Handles signing in, registering, claiming accounts, resetting passwords, and remembering
 * who is currently logged into the app. It checks security requirements and saves login tokens.
 */

// Storage Keys & Access Level Configuration
window.SESSION_KEY = window.SESSION_KEY || 'mfc_auth_session';

/** The list of recognized leadership and member roles in the system */
window.ACCESS_ROLE_VALUES = window.ACCESS_ROLE_VALUES || new Set([
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

/**
 * Clean Up Role Names
 *
 * What it does:
 * Takes any role text (even if messy, capitalized, or an older nickname like "area_admin")
 * and converts it into the exact standard role name the system expects.
 *
 * Backup plan if it breaks:
 * If the text is missing, misspelled, or completely unknown, it safely defaults the user to a regular "member".
 */
function normalizeAccessRole(value) {
  const role = String(value || 'member').trim().toLowerCase();
  if (role === 'area_admin') return 'area_servant';
  return ACCESS_ROLE_VALUES.has(role) ? role : 'member';
}


/**
 * Safe Information Reader
 *
 * What it does:
 * Reads saved text from storage and turns it back into readable data without crashing the website.
 *
 * Backup plan if it breaks:
 * If the saved text is corrupted or unreadable, it ignores the bad text and gives back a safe empty backup value.
 */
function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

/**
 * Clean Up Email Address
 *
 * What it does:
 * Trims extra spaces and turns all letters into lowercase so "User@Email.com" and "user@email.com" match.
 *
 * Backup plan if it breaks:
 * If no email is provided, it safely returns an empty string instead of causing an error.
 */
function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}


// ---------------------------------------------------------------------------
// Login Memory & Screen Directions
// ---------------------------------------------------------------------------

/**
 * Check Who Is Logged In
 *
 * What it does:
 * Looks in your browser to see if someone already signed in on this computer,
 * and checks whether their login pass has expired.
 *
 * Backup plan if it breaks:
 * If the login pass is expired, missing, or corrupted, it clears out the bad pass
 * and returns empty so the user is asked to sign in safely.
 */
function getSession() {
  const raw = safeParse(localStorage.getItem(SESSION_KEY), null) || safeParse(sessionStorage.getItem(SESSION_KEY), null);
  if (!raw) return null;

  // Check if login time has expired and automatically sign out if too old and not refreshable
  if (raw.expiresAt && !raw.refreshToken) {
    const expiresAtMs = typeof raw.expiresAt === 'number' ? raw.expiresAt * 1000 : new Date(raw.expiresAt).getTime();
    if (Date.now() >= expiresAtMs) {
      clearSession();
      return null;
    }
  }

  return raw;
}

/**
 * Remember Who Signed In
 *
 * What it does:
 * Saves the current user's login information into the browser. If "Remember Me" is checked,
 * it saves it long-term; otherwise, it only keeps it until the browser tab is closed.
 *
 * Backup plan if it breaks:
 * Clears any conflicting old login passes first to prevent two accounts from getting mixed up.
 */
function saveSession(session, remember) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Update Current Login Information
 *
 * What it does:
 * Updates the saved login information (like when changing a password or updating an area)
 * in whatever storage spot it was originally saved in.
 *
 * Backup plan if it breaks:
 * Writes to temporary tab storage if long-term storage is unavailable.
 */
function updateSession(session) {
  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

/**
 * Sign Out
 *
 * What it does:
 * Completely wipes out the login pass from the browser so no one else using this computer can see your account.
 *
 * Backup plan if it breaks:
 * Cleans both permanent and temporary browser storage locations to guarantee complete sign-out.
 */
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Pick Next Screen
 *
 * What it does:
 * Figures out where to send the user right after signing in. If they need to change their
 * password, it sends them to the password screen; if they are a regular member, it takes them
 * to the Member Portal; if they are a coordinator or servant, it opens the Management Dashboard.
 *
 * Backup plan if it breaks:
 * If the role is unknown or missing, it safely routes the user to the main dashboard.
 */
function destinationFor(session) {
  if (session?.mustChangePassword) return '/change-password';
  if (session?.needsAreaSetup) return '/dashboard';
  if (session?.role === 'member') return '/member';
  if (session?.role === 'chapter_servant') return '/dashboard';
  return '/dashboard';
}

// ---------------------------------------------------------------------------
// Talking to the Server
// ---------------------------------------------------------------------------

/**
 * Send Message to Server
 *
 * What it does:
 * Sends requests (like signing in, claiming an account, or saving changes) to the central server,
 * attaching the user's secret digital badge so the server knows who is asking.
 *
 * Backup plan if it breaks:
 * If the server responds with a security code requirement (two-step verification), it smoothly
 * directs the user to the verification screen. If the login pass was rejected, it clears the expired
 * pass so the user can re-authenticate. If the network is down, it throws a clear human-readable error.
 */
async function apiJson(path, options = {}) {
  const activeSession = getSession();
  const accessToken = activeSession?.backendAuth
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

/**
 * Format Server Login Response
 *
 * What it does:
 * Takes the raw answer from the server after signing in and converts it into a clean,
 * standardized user profile that our website screens can easily understand.
 *
 * Backup plan if it breaks:
 * Provides safe defaults for every missing piece of information (such as defaulting missing roles to 'member').
 */
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
    backendAuth: true
  };
  saveSession(session, remember);
  return session;
}

// ---------------------------------------------------------------------------
// On-Screen Alerts, Warnings & Visual Helpers
// ---------------------------------------------------------------------------

/**
 * Show Alert Banner
 *
 * What it does:
 * Displays a colorful banner (green for success, red for errors) with a friendly message
 * and a close button so the user knows what just happened.
 *
 * Backup plan if it breaks:
 * If the message box element does not exist on the current page, it exits silently without throwing an error.
 */
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

/**
 * Text Safety Cleaner
 *
 * What it does:
 * Converts dangerous special characters (like `<`, `>`, and quotes) into harmless text
 * so hackers cannot tamper with the screen.
 *
 * Backup plan if it breaks:
 * Returns an empty string if no text was provided.
 */
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

/**
 * Email Format Checker
 *
 * What it does:
 * Checks if the entered email contains standard email symbols (like an '@' and a domain name).
 *
 * Backup plan if it breaks:
 * Returns false if the text is empty or invalid, allowing the form to prompt the user kindly.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Password Strength Checker
 *
 * What it does:
 * Checks if a new password is at least 8 characters long and contains both letters and numbers.
 *
 * Backup plan if it breaks:
 * Returns a clear, friendly instruction explaining what needs to be added if it is too short or weak.
 */
function passwordError(password) {
  if (typeof window !== 'undefined' && typeof window.passwordError === 'function') {
    return window.passwordError(password);
  }
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one number.';
  return '';
}

/**
 * Freeze Button During Work
 *
 * What it does:
 * Temporarily disables a button and changes its label to "Please wait..." so users don't
 * accidentally click it multiple times while an action is saving.
 *
 * Backup plan if it breaks:
 * Restores the original label and unlocks the button whenever the action finishes or encounters an error.
 */
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

/**
 * Show / Hide Password Peek Button
 *
 * What it does:
 * Hooks up the "Show/Hide" toggle next to password boxes so you can view what you typed.
 *
 * Backup plan if it breaks:
 * If an input box is missing, it safely skips that button without causing any errors.
 */
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

/**
 * Smooth Card Entrance Animations
 *
 * What it does:
 * Gently fades and slides in cards one after another when you open the page.
 *
 * Backup plan if it breaks:
 * If a user's computer is set to reduce motion, or if the browser doesn't support animations,
 * it immediately shows all cards normally.
 */
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

// If someone is already signed in, don't show them the sign-in form again; send them directly to their workspace
const currentSession = getSession();
if (currentSession && document.body.dataset.allowAuthenticated !== 'true') {
  navigateWithLoader(destinationFor(currentSession), true);
}


// ---------------------------------------------------------------------------
// Main Login Form Submission
// ---------------------------------------------------------------------------
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
      setButtonBusy(submit, false);
      showMessage('loginMessage', backendError?.message || 'Invalid email or password.');
    }
  });
}

// ---------------------------------------------------------------------------
// Servant Leader & Coordinator Sign-Up Form
// ---------------------------------------------------------------------------
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
    if (!['couple_coordinator', 'area_servant', 'lit_servant', 'campus_servant', 'mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(role)) {
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

// ---------------------------------------------------------------------------
// Member Portal Account Activation (Claim Account)
// ---------------------------------------------------------------------------
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

    setButtonBusy(submit, true, 'Claiming Account…');
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
      showMessage('memberClaimMessage', error?.message || 'Unable to claim your Member Portal account. Please try again.');
    }
  });
}

// ---------------------------------------------------------------------------
// Password Change and Mandatory Account Update Form
// ---------------------------------------------------------------------------
const backToLoginButton = document.getElementById('backToLoginButton');
if (backToLoginButton) {
  backToLoginButton.addEventListener('click', async () => {
    const activeSession = getSession();
    backToLoginButton.disabled = true;
    backToLoginButton.textContent = 'Signing Out…';

    if (activeSession?.backendAuth && activeSession?.accessToken) {
      try {
        await apiJson('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ scope: 'local' })
        });
      } catch {
        // Even if server call fails, local browser login is always cleared so user is logged out on this device
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

  if (!session || !session.backendAuth) {
    navigateWithLoader('/', true);
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

      // Online server accounts: update password via cloud endpoint
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
    });
  }
}

// ---------------------------------------------------------------------------
// Email Address Change Request Form
// ---------------------------------------------------------------------------
const changeEmailForm = document.getElementById('changeEmailForm');
if (changeEmailForm) {
  const emailSession = getSession();
  const newEmailInput = document.getElementById('newAccountEmail');

  if (!emailSession || !emailSession.backendAuth) {
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

// Initialize show/hide password toggle buttons across the page
attachPasswordToggles();

