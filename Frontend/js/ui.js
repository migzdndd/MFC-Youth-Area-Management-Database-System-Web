/**
 * ============================================================================
 * MFC Youth Area Management System - UI Components & Helper Utilities
 * ============================================================================
 */

// Section 6: Formatting, Validation & Helper Utilities

let uidSequence = 0;
function uid() {
  return Date.now() * 1000 + (++uidSequence % 1000);
}

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

function money(value) {
  return Number(value || 0).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP'
  });
}

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

function parseEventTimestamp(val) {
  if (!val) return 0;
  const str = String(val);
  const d = new Date(str.length === 10 ? `${str}T00:00:00` : str);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fullName(member) {
  return [
    member.firstName,
    member.middleName,
    member.lastName
  ]
    .filter(Boolean)
    .join(' ');
}

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

function participantName(data, participant) {
  const member = participantMember(data, participant);

  return member
    ? fullName(member)
    : [participant?.first, participant?.mi, participant?.last]
      .filter(Boolean)
      .join(' ');
}

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

function validEmail(value) {
  return (
    !value ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

// Section 7: Toast Notifications (Alpine.js Toast Queue Component)

const toastStore = {
  items: [],
  add(item) {
    this.items.push(item);
  },
  remove(id) {
    const item = this.items.find(t => t.id === id);
    if (!item) return;
    item.visible = false;
    setTimeout(() => {
      this.items = this.items.filter(t => t.id !== id);
    }, 250);
  }
};

function ensureToastWrap() {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-atomic', 'true');
    wrap.setAttribute('x-data', 'toastQueue');
    wrap.setAttribute('x-cloak', '');
    wrap.innerHTML = `
      <template x-for="item in items" :key="item.id">
        <div
          class="toast card"
          :class="[item.type, { 'toast-hide': !item.visible }]"
          :role="item.type === 'error' ? 'alert' : 'status'"
          x-show="item.visible"
          x-transition:leave="toast-hide"
          @mouseenter="item.pause()"
          @mouseleave="item.resume()"
        >
          <svg class="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,186.7C672,149,768,107,864,112C960,117,1056,171,1152,181.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <div class="icon-container">
            <template x-if="item.type === 'success'">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
                <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>
              </svg>
            </template>
            <template x-if="item.type !== 'success'">
              <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true">
                <path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"></path>
              </svg>
            </template>
          </div>
          <div class="message-text-container">
            <p class="message-text" x-text="item.title"></p>
            <p class="sub-text" x-text="item.message"></p>
          </div>
          <svg class="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" fill="none" role="button" tabindex="0" aria-label="Dismiss notification" @click="dismiss(item.id)" @keydown.enter="dismiss(item.id)" @keydown.space.prevent="dismiss(item.id)">
            <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clip-rule="evenodd" fill-rule="evenodd"></path>
          </svg>
        </div>
      </template>
    `;
    document.body.appendChild(wrap);
  }
  return wrap;
}

function registerAlpineToast() {
  if (window.Alpine && !window.Alpine._toastRegistered) {
    window.Alpine._toastRegistered = true;
    window.Alpine.data('toastQueue', () => ({
      get items() {
        return toastStore.items;
      },
      dismiss(id) {
        toastStore.remove(id);
      }
    }));
  }
}

document.addEventListener('alpine:init', registerAlpineToast);

function toast(text, type = 'success', duration = 4000) {
  ensureToastWrap();
  registerAlpineToast();

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const defaultTitle = isSuccess ? 'Success' : (isError ? 'Error' : 'Notice');

  let title = defaultTitle;
  let message = text;

  if (typeof text === 'object' && text !== null) {
    title = text.title || defaultTitle;
    message = text.message || text.text || '';
  }

  const id = uid();
  let timer = null;

  const item = {
    id,
    title,
    message,
    type,
    visible: true,
    pause() {
      if (timer) clearTimeout(timer);
    },
    resume() {
      timer = setTimeout(() => toastStore.remove(id), duration);
    }
  };

  item.resume();
  toastStore.add(item);
  return item;
}

window.toast = toast;

// Section 8: Modal Dialogs (Alpine.js Declarative x-show Modal Component)

let activeModalCleanup = null;

const modalState = {
  open: false,
  title: '',
  hasSave: false,
  saveText: 'Save',
  onSaveCallback: null,
  close() {
    this.open = false;
    if (activeModalCleanup) {
      const cleanup = activeModalCleanup;
      activeModalCleanup = null;
      cleanup();
    }
  }
};

function registerAlpineModal() {
  if (window.Alpine && !window.Alpine._modalRegistered) {
    window.Alpine._modalRegistered = true;
    window.Alpine.data('modalDialog', () => ({
      get open() { return modalState.open; },
      get title() { return modalState.title; },
      get hasSave() { return modalState.hasSave; },
      get saveText() { return modalState.saveText; },
      close() { modalState.close(); },
      handleSave() {
        if (modalState.onSaveCallback) {
          modalState.onSaveCallback(() => modalState.close());
        }
      }
    }));
  }
}

document.addEventListener('alpine:init', registerAlpineModal);

function ensureModalRootTemplate() {
  const root = document.getElementById('modalRoot');
  if (root && !root.querySelector('.modal-backdrop')) {
    root.setAttribute('x-data', 'modalDialog');
    root.setAttribute('x-cloak', '');
    root.innerHTML = `
      <div
        class="modal-backdrop"
        id="modalBackdrop"
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
            <h2 id="modalTitle" x-text="title"></h2>
            <button
              class="icon-btn"
              id="closeModal"
              type="button"
              aria-label="Close dialog"
              @click="close()"
            >×</button>
          </header>

          <div class="modal-body" id="modalBody"></div>

          <footer class="modal-footer">
            <button
              class="btn"
              id="cancelModal"
              type="button"
              @click="close()"
              x-text="hasSave ? 'Cancel' : 'Close'"
            ></button>
            <button
              class="btn blue"
              id="saveModal"
              type="button"
              x-show="hasSave"
              x-text="saveText"
              @click="handleSave()"
            ></button>
          </footer>
        </section>
      </div>
    `;
  }
}

function openModal(
  title,
  body,
  onSave = null,
  saveText = 'Save'
) {
  ensureModalRootTemplate();
  registerAlpineModal();

  const root = document.getElementById('modalRoot');
  if (!root) return;

  if (activeModalCleanup) {
    activeModalCleanup();
  }

  modalState.title = title;
  modalState.hasSave = Boolean(onSave);
  modalState.saveText = saveText;
  modalState.onSaveCallback = onSave;

  const bodyEl = document.getElementById('modalBody');
  if (bodyEl) {
    bodyEl.innerHTML = body;
  }

  const close = () => {
    modalState.close();
  };

  activeModalCleanup = close;
  modalState.open = true;

  requestAnimationFrame(() =>
    root.querySelector('input, select, textarea, button')?.focus()
  );
}

function closeModal() {
  modalState.close();
}

window.openModal = openModal;
window.closeModal = closeModal;

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

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
    </div>
  `;
}

// Section 10: Mobile Sidebar & Navigation UI (Alpine.js Declarative Toggle)

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

document.addEventListener('DOMContentLoaded', () => {
  ensureModalRootTemplate();
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
