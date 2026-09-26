/**
 * ============================================================================
 * MFC Youth Area Management System - User Interface & Visual Tools
 * ============================================================================
 * What this file is:
 * This script handles popup alerts (toasts), dialog windows (modals),
 * date/money formatters, and the mobile navigation menu.
 *
 * Backup plan if something breaks:
 * If an alert or popup fails to close normally, this script includes built-in
 * safety timers and keyboard escape keys to ensure you are never stuck on screen.
 * ============================================================================
 */

// Section 1: Unique IDs, Text Safety, and Date/Money Formatters

// Unique ID counter
let uidSequence = 0;

/**
 * Generates a Unique ID Number
 *
 * What it does:
 * Creates a unique number for every new member, event, or report so no two items clash.
 *
 * Backup plan if it breaks:
 * Combines the exact current millisecond with a rotating number, guaranteeing that
 * even items created in the same split second have different IDs.
 */
function uid() {
  return Date.now() * 1000 + (++uidSequence % 1000);
}

/**
 * Text Safety Guard (Escapes Symbols)
 *
 * What it does:
 * Cleans user-entered text before printing it on screen so characters like < or "
 * cannot break the layout or run harmful scripts.
 *
 * Backup plan if it breaks:
 * If given blank or missing text, it returns an empty string safely.
 */
function esc(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
  );
}

/**
 * Currency Formatter (Philippine Pesos)
 *
 * What it does:
 * Formats a number as Philippine Pesos (e.g. 150 becomes "₱150.00").
 *
 * Backup plan if it breaks:
 * If the value is missing or not a number, it safely returns "₱0.00".
 */
function money(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP'
  });
}

/**
 * Simple Date Formatter
 *
 * What it does:
 * Turns computer dates into readable Philippine dates (e.g. "Sep 27, 2026").
 *
 * Backup plan if it breaks:
 * If the date is missing or invalid, it cleanly shows a dash ("—").
 */
function fmtDate(value) {
  if (!value) return '—';

  const d = new Date(
    `${value}`.length === 10
      ? `${value}T00:00:00`
      : value
  );

  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
}

/**
 * Date and Time Formatter
 *
 * What it does:
 * Formats both the date and time for events (e.g. "Sep 27, 2026, 3:00 PM").
 *
 * Backup plan if it breaks:
 * If either component is invalid, it returns a neat dash ("—").
 */
function fmtDateTime(value) {
  if (!value) return '—';

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
}

/**
 * Date to Numeric Time (For Sorting)
 *
 * What it does:
 * Converts any date into a number of milliseconds so gatherings can be sorted
 * from earliest to latest.
 *
 * Backup plan if it breaks:
 * If the date is invalid, it returns 0 so unreadable events move to the bottom.
 */
function parseEventTimestamp(val) {
  if (!val) return 0;
  const str = String(val);
  const d = new Date(str.length === 10 ? `${str}T00:00:00` : str);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Today's Date String
 *
 * What it does:
 * Returns today's date formatted as YYYY-MM-DD for form calendar inputs.
 *
 * Backup plan if it breaks:
 * Reads from the user device's local clock.
 */
function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Member Full Name Builder
 *
 * What it does:
 * Combines first, middle, and last names into a clean, complete name.
 *
 * Backup plan if it breaks:
 * If any part is missing (like middle name), it skips it without leaving extra spaces.
 */
function fullName(member) {
  return [
    member.firstName,
    member.middleName,
    member.lastName
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Calculates Age from Birth Date
 *
 * What it does:
 * Calculates a youth member's age in years based on their birth date.
 *
 * Backup plan if it breaks:
 * If the date is blank, in the future, or invalid, it returns null so the
 * member profile does not display impossible negative numbers.
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;

  const parsed = new Date(
    `${birthDate}T00:00:00`
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDelta = today.getMonth() - parsed.getMonth();

  if (
    monthDelta < 0 ||
    (
      monthDelta === 0 &&
      today.getDate() < parsed.getDate()
    )
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

/**
 * Finds Member Profile for a Participant
 *
 * What it does:
 * Connects an event attendee back to their full official Member profile.
 *
 * Backup plan if it breaks:
 * Checks member ID first; if unlinked, it tries matching their contact phone number.
 * If neither matches, it returns null.
 */
function participantMember(data, participant) {
  if (!participant || !data) return null;

  if (participant.memberId !== null && participant.memberId !== undefined) {
    const linked = data.members.find(
      member => String(member.id) === String(participant.memberId)
    );

    if (linked) return linked;
  }

  if (participant.contact) {
    const matches = data.members.filter(
      member => String(member.contact || '') === String(participant.contact || '')
    );

    if (matches.length === 1) return matches[0];
  }

  return null;
}

/**
 * Gets Participant Full Name
 *
 * What it does:
 * Returns the readable name for an event attendee.
 *
 * Backup plan if it breaks:
 * Uses their linked member profile name if found; otherwise glues together
 * whatever manual name fields they typed when registering.
 */
function participantName(data, participant) {
  const member = participantMember(data, participant);

  return member
    ? fullName(member)
    : [participant?.first, participant?.mi, participant?.last]
      .filter(Boolean)
      .join(' ');
}

/**
 * Checks if Member Has No Chapter
 *
 * What it does:
 * Identifies youth members who have not yet been assigned to a Chapter community.
 *
 * Backup plan if it breaks:
 * Checks both chapter ID and chapter name to make sure neither is set.
 */
function isUnassignedMember(member) {
  if (!member || typeof member !== 'object') {
    return false;
  }

  const chapterId = member.chapterId;
  const chapterName = member.chapterName;

  const hasEmptyId =
    chapterId === null ||
    chapterId === undefined ||
    chapterId === '' ||
    String(chapterId).trim() === '';

  const hasEmptyName =
    !chapterName ||
    String(chapterName).trim() === '';

  return hasEmptyId && hasEmptyName;
}

/**
 * Validates Email Format
 *
 * What it does:
 * Checks if an email address is shaped properly (like user@example.com).
 *
 * Backup plan if it breaks:
 * Allows empty values for optional fields, and returns false for broken emails.
 */
function validEmail(value) {
  return (
    !value ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

// Section 2: Popup Notifications (Toast Messages)

/**
 * Ensures Notification Container Exists
 *
 * What it does:
 * Checks if the screen has an element to hold floating alert messages.
 *
 * Backup plan if it breaks:
 * If missing from the page HTML, it creates one on the fly and attaches it.
 */
function ensureToastWrap() {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-atomic', 'true');
    document.body.appendChild(wrap);
  }
  return wrap;
}

/**
 * Shows a Floating Alert Notification (Toast)
 *
 * What it does:
 * Pops up a brief message in the corner of your screen (green for success,
 * red for errors, or blue for notices). It pauses when you hover over it
 * and closes automatically after a few seconds.
 *
 * Backup plan if it breaks:
 * Includes a manual close button (x) and fallback timers so the notification
 * will always close and clean itself up even if animations fail.
 */
function toast(text, type = 'success', duration = 4000) {
  const wrap = ensureToastWrap();
  const isSuccess = type === 'success';
  const defaultTitle = isSuccess ? 'Success' : (type === 'error' ? 'Error' : 'Notice');

  let title = defaultTitle;
  let message = text;

  if (typeof text === 'object' && text !== null) {
    title = text.title || defaultTitle;
    message = text.message || text.text || '';
  }

  const el = document.createElement('div');
  el.className = `toast card ${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.setAttribute('x-data', `{ visible: true, pause() { clearTimeout(this._timer); }, resume() { this._timer = setTimeout(() => this.dismiss(), ${duration}); }, dismiss() { this.visible = false; setTimeout(() => el.remove(), 250); } }`);
  el.setAttribute('x-show', 'visible');
  el.setAttribute('x-transition:leave', 'toast-hide');
  el.setAttribute('@mouseenter', 'pause()');
  el.setAttribute('@mouseleave', 'resume()');
  el.setAttribute('x-init', 'resume()');
  el.innerHTML = `
    <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,186.7C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
    <div class="icon-container">
      ${isSuccess
        ? `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path></svg>`
        : `<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"></path></svg>`
      }
    </div>
    <div class="message-text-container">
      <p class="message-text">${esc(title)}</p>
      <p class="sub-text">${esc(message)}</p>
    </div>
    <svg class="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" role="button" tabindex="0" aria-label="Dismiss notification" @click="dismiss()">
      <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clip-rule="evenodd" fill-rule="evenodd"></path>
    </svg>
  `;

  // Fallback timer so the toast disappears even without script interactions
  let timer = setTimeout(() => {
    el.classList.add('toast-hide');
    setTimeout(() => el.remove(), 250);
  }, duration);

  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => {
    timer = setTimeout(() => {
      el.classList.add('toast-hide');
      setTimeout(() => el.remove(), 250);
    }, duration);
  });

  const closeIcon = el.querySelector('.cross-icon');
  if (closeIcon) {
    closeIcon.addEventListener('click', () => {
      clearTimeout(timer);
      el.classList.add('toast-hide');
      setTimeout(() => el.remove(), 250);
    });
  }

  wrap.appendChild(el);
  if (window.Alpine) {
    window.Alpine.initTree(el);
  }
  return el;
}

window.toast = toast;

// Section 3: Popup Windows (Modal Dialogs)

/**
 * Opens a Dialog Window (Modal)
 *
 * What it does:
 * Pops up a window in the center of the screen with a title, form fields,
 * and buttons (like Add Member, Edit Chapter, or Register for Event).
 *
 * Backup plan if it breaks:
 * - Automatically closes any previously stuck modal before opening.
 * - Allows closing by pressing the Escape key, clicking outside the window,
 *   or clicking Cancel.
 * - Automatically places your typing cursor into the first input field so
 *   you can start typing right away.
 */
function openModal(
  title,
  body,
  onSave = null,
  saveText = 'Save'
) {
  const root = document.getElementById('modalRoot');
  if (!root) return;

  if (activeModalCleanup) {
    activeModalCleanup();
  }

  const hasSave = Boolean(onSave);

  root.innerHTML = `
    <div
      class="modal-backdrop"
      id="modalBackdrop"
      x-data="{
        open: true,
        close() {
          this.open = false;
          setTimeout(() => {
            if (!this.open && root.innerHTML !== '') {
              root.innerHTML = '';
            }
          }, 200);
        }
      }"
      x-show="open"
      x-transition.opacity
      @click.self="close()"
      @keydown.escape.window="if (open) close()"
    >
      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        x-show="open"
        x-transition
      >
        <header class="modal-header">
          <h2 id="modalTitle">${esc(title)}</h2>
          <button
            class="icon-btn"
            id="closeModal"
            type="button"
            aria-label="Close dialog"
            @click="close()"
          >×</button>
        </header>

        <div class="modal-body" id="modalBody">${body}</div>

        <footer class="modal-footer">
          <button
            class="btn"
            id="cancelModal"
            type="button"
            @click="close()"
          >${hasSave ? 'Cancel' : 'Close'}</button>
          ${hasSave ? `
            <button
              class="btn blue"
              id="saveModal"
              type="button"
            >${esc(saveText)}</button>
          ` : ''}
        </footer>
      </section>
    </div>
  `;

  if (window.Alpine) {
    window.Alpine.initTree(root);
  }

  const closeFn = () => {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop?._x_dataStack?.[0]?.close) {
      backdrop._x_dataStack[0].close();
    } else if (root) {
      root.innerHTML = '';
    }
    activeModalCleanup = null;
  };

  activeModalCleanup = closeFn;

  const closeBtn = document.getElementById('closeModal');
  if (closeBtn) closeBtn.onclick = closeFn;
  const cancelBtn = document.getElementById('cancelModal');
  if (cancelBtn) cancelBtn.onclick = closeFn;

  if (hasSave) {
    const saveBtn = document.getElementById('saveModal');
    if (saveBtn) {
      saveBtn.onclick = () => onSave(closeFn);
    }
  }

  requestAnimationFrame(() =>
    root.querySelector('input, select, textarea, button')?.focus()
  );
}

/**
 * Closes the Active Dialog Window
 *
 * What it does:
 * Dismisses whatever popup window is currently on screen.
 *
 * Backup plan if it breaks:
 * If the normal animation doesn't finish, it directly clears the modal container
 * so the backdrop veil is completely removed.
 */
function closeModal() {
  if (activeModalCleanup) {
    activeModalCleanup();
    return;
  }
  const root = document.getElementById('modalRoot');
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop?._x_dataStack?.[0]?.close) {
    backdrop._x_dataStack[0].close();
  } else if (root) {
    root.innerHTML = '';
  }
}

window.openModal = openModal;
window.closeModal = closeModal;

// Section 4: Form Input Helpers

/**
 * Builds a Text Input Field
 *
 * What it does:
 * Generates HTML for a labeled input box.
 *
 * Backup plan if it breaks:
 * Cleans the value with esc() so quotes don't break the input tag.
 */
function field(
  label,
  id,
  type = 'text',
  value = '',
  extra = ''
) {
  return `
    <div class="form-group">
      <label for="${id}">
        ${label}
      </label>

      <input
        class="text-input"
        id="${id}"
        type="${type}"
        value="${esc(value)}"
        ${extra}
      >
    </div>
  `;
}

/**
 * Builds a Dropdown Menu Field
 *
 * What it does:
 * Generates HTML for a select dropdown with options.
 *
 * Backup plan if it breaks:
 * Checks which option was previously chosen and marks it as selected automatically.
 */
function selectField(
  label,
  id,
  options,
  value = ''
) {
  return `
    <div class="form-group">
      <label for="${id}">
        ${label}
      </label>

      <select
        class="select-input"
        id="${id}"
      >
        ${options
      .map(
        option => `
              <option
                ${option === value ? 'selected' : ''}
              >
                ${esc(option)}
              </option>
            `
      )
      .join('')}
      </select>
    </div>
  `;
}

/**
 * Builds Page Top Header
 *
 * What it does:
 * Creates the banner at the top of each admin page with a title, subtitle,
 * and action buttons (like "Add Member").
 *
 * Backup plan if it breaks:
 * Renders cleanly even if no subtitle or buttons are provided.
 */
function pageHeader(
  title,
  subtitle,
  actions = ''
) {
  return `
    <header class="page-header">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>

      <div class="page-actions">
        ${actions}
      </div>
    </header>
  `;
}

/**
 * Builds Empty State Box
 *
 * What it does:
 * Generates an informative placeholder card whenever a table or list is empty.
 *
 * Backup plan if it breaks:
 * Cleans text to prevent symbols from breaking the card.
 */
function emptyState(title, text) {
  return `
    <div class="empty-state">
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </div>
  `;
}

// Section 5: Mobile Sidebar Menu (For Phones & Tablets)

/**
 * Mobile Navigation Drawer Manager
 *
 * What it does:
 * Opens and closes the slide-out navigation menu when tapping the hamburger button
 * on mobile screens.
 *
 * Backup plan if it breaks:
 * - Dims the background with a screen scrim.
 * - Closes automatically if you tap the background, tap any menu link, or press Escape.
 */
const sidebarState = {
  open: false,
  toggle() {
    this.open = !this.open;
    this.sync();
  },
  close() {
    this.open = false;
    this.sync();
  },
  sync() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    const scrim = document.getElementById('sidebarScrim');
    if (sidebar) sidebar.classList.toggle('open', this.open);
    if (scrim) scrim.classList.toggle('show', this.open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(this.open));
  }
};

/**
 * Connects Sidebar to Alpine Library
 *
 * What it does:
 * Registers the mobile menu state so click directives can control it smoothly.
 *
 * Backup plan if it breaks:
 * Prevents double-registration if the page re-renders.
 */
function registerAlpineSidebar() {
  if (window.Alpine && !window.Alpine._sidebarRegistered) {
    window.Alpine._sidebarRegistered = true;
    window.Alpine.data('sidebarNavigation', () => ({
      get open() { return sidebarState.open; },
      toggle() { sidebarState.toggle(); },
      close() { sidebarState.close(); }
    }));
  }
}

document.addEventListener('alpine:init', registerAlpineSidebar);

// Set up mobile menu and toast container once page HTML is loaded
document.addEventListener('DOMContentLoaded', () => {
  ensureToastWrap();
  registerAlpineSidebar();

  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');

  if (sidebar && menuBtn) {
    let scrim = document.getElementById('sidebarScrim');
    if (!scrim) {
      scrim = document.createElement('button');
      scrim.type = 'button';
      scrim.className = 'sidebar-scrim';
      scrim.id = 'sidebarScrim';
      scrim.setAttribute('aria-label', 'Close navigation menu');
      document.body.appendChild(scrim);
    }

    menuBtn.setAttribute('aria-controls', 'sidebar');
    menuBtn.setAttribute('aria-expanded', 'false');

    menuBtn.addEventListener('click', () => sidebarState.toggle());
    scrim.addEventListener('click', () => sidebarState.close());

    sidebar.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => sidebarState.close())
    );

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && sidebarState.open) {
        sidebarState.close();
      }
    });
  }
});
