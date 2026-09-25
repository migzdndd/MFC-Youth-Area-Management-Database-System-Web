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

// Section 7: Toast Notifications

function toast(text, type = 'success') {
  const wrap = document.getElementById('toastWrap');

  if (!wrap) return;

  const item = document.createElement('div');

  item.className = `toast ${type}`;
  item.setAttribute('role', 'status');
  item.textContent = text;

  wrap.appendChild(item);

  setTimeout(() => item.remove(), 3000);
}

// Section 8: Modal Dialogs & Confirmation Prompts

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

  root.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <header class="modal-header">
          <h2 id="modalTitle">${esc(title)}</h2>

          <button
            class="icon-btn"
            id="closeModal"
            type="button"
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>

        <div class="modal-body">
          ${body}
        </div>

        <footer class="modal-footer">
          <button
            class="btn"
            id="cancelModal"
            type="button"
          >
            ${onSave ? 'Cancel' : 'Close'}
          </button>

          ${onSave
      ? `
                <button
                  class="btn blue"
                  id="saveModal"
                  type="button"
                >
                  ${saveText}
                </button>
              `
      : ''
    }
        </footer>
      </section>
    </div>
  `;

  const close = () => {
    document.removeEventListener(
      'keydown',
      onKeyDown
    );

    root.innerHTML = '';

    if (activeModalCleanup === close) {
      activeModalCleanup = null;
    }
  };

  activeModalCleanup = close;

  const onKeyDown = event => {
    if (event.key === 'Escape') {
      close();
    }
  };

  document.addEventListener(
    'keydown',
    onKeyDown
  );

  document.getElementById(
    'closeModal'
  ).onclick = close;

  document.getElementById(
    'cancelModal'
  ).onclick = close;

  document
    .getElementById('modalBackdrop')
    .addEventListener('click', event => {
      if (event.target.id === 'modalBackdrop') {
        close();
      }
    });

  if (onSave) {
    document.getElementById(
      'saveModal'
    ).onclick = () => onSave(close);
  }

  requestAnimationFrame(() =>
    root
      .querySelector(
        'input, select, textarea, button'
      )
      ?.focus()
  );
}

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

// Section 10: Mobile Sidebar & Navigation UI

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');

  if (sidebar && menuBtn) {
    const scrim = document.createElement('button');
    scrim.type = 'button';
    scrim.className = 'sidebar-scrim';
    scrim.id = 'sidebarScrim';
    scrim.setAttribute('aria-label', 'Close navigation menu');

    document.body.appendChild(scrim);

    const closeMenu = () => {
      sidebar.classList.remove('open');
      scrim.classList.remove('show');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    const toggleMenu = () => {
      const open = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', open);
      scrim.classList.toggle('show', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };

    menuBtn.setAttribute('aria-controls', 'sidebar');
    menuBtn.setAttribute('aria-expanded', 'false');

    menuBtn.addEventListener('click', toggleMenu);
    scrim.addEventListener('click', closeMenu);

    sidebar.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', closeMenu)
    );

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  }
});
