/**
 * ============================================================================
 * MFC Youth Member Portal - Web Script
 * ============================================================================
 * What this file is:
 * This is the main script for the Member Portal screen.
 * It shows the member's profile, chapter, ministry service, and gatherings.
 *
 * Backup plan if something breaks:
 * If the internet is down or the online server is slow, this script uses
 * saved copies of your records on your device so the screen stays working.
 * ============================================================================
 */

// Section 1: Saved Information Names & Ministry List

// Names used to find your saved login and records on this computer/phone
const SESSION_KEY = 'mfc_demo_session';
const DB_KEY = 'mfc_web_database_v1';
const USER_KEY = 'mfc_demo_users';

// Standard list of MFC Youth ministries and servant roles
const STANDARD_SERVICES = [
  'Unit Servant',
  'Household Servant',
  'Chapter Servant',
  'Area Servant',
  'Area LIT Servant',
  'Campus Servant',
  'Area Kids Servant',
  'MFC High Servant',
  'Music',
  'Dance',
  'Creative Writing',
  'Graphics & Promo',
  'Photography & Videography'
];

// Connects leadership roles to their default ministry title
const ACCESS_ROLE_SERVICE_MAP = Object.freeze({
  area_servant: 'Area Servant',
  lit_servant: 'Area LIT Servant',
  campus_servant: 'Campus Servant',
  mfc_high_servant: 'MFC High Servant',
  area_kids_servant: 'Area Kids Servant',
  chapter_servant: 'Chapter Servant'
});

// Converts system role codes into clean, friendly titles
const ACCESS_ROLE_LABELS = Object.freeze({
  national_coordinator: 'National Coordinator',
  couple_coordinator: 'Couple Coordinator',
  area_servant: 'Area Servant',
  lit_servant: 'Area LIT Servant',
  campus_servant: 'Campus Servant',
  mfc_high_servant: 'MFC High Servant',
  area_kids_servant: 'Area Kids Servant',
  chapter_servant: 'Chapter Servant',
  member: 'Youth Member'
});

// Section 2: Ministry and Role Helpers

/**
 * Normalizes Ministry / Service Name
 *
 * What it does:
 * Cleans up ministry titles so they all look neat and consistent
 * (for example, turns "lit servant" into "Area LIT Servant").
 *
 * Backup plan if it breaks:
 * If the input is empty or blank, it returns an empty text. If it is already
 * clean or unknown, it keeps the original text so nothing gets lost.
 */
function normalizePortalServiceName(value) {
  const service = String(value || '').trim().replace(/\s+/g, ' ');
  if (!service) return '';
  const key = service.toLowerCase();
  if (key === 'lit servant' || key === 'lit_servant') return 'Area LIT Servant';
  if (key === 'kids servant' || key === 'area_kids_servant') return 'Area Kids Servant';
  return service;
}

/**
 * Detects Member Ministry
 *
 * What it does:
 * Looks up what ministry a member is part of. If none is written down,
 * it checks if they have a leadership role (like Chapter Servant) and uses that.
 *
 * Backup plan if it breaks:
 * If no ministry is recorded and they do not have a leadership title,
 * it safely returns an empty list so the profile still displays smoothly.
 */
function detectedPortalServices(member) {
  const explicit = Array.isArray(member?.services)
    ? [...new Set(member.services.map(normalizePortalServiceName).filter(Boolean))]
    : [];
  if (explicit.length) return [explicit[0]];
  const role = String(member?.accessLevel || 'member').trim().toLowerCase();
  const inferred = ACCESS_ROLE_SERVICE_MAP[role];
  return inferred ? [inferred] : [];
}

/**
 * Formats Role for Display
 *
 * What it does:
 * Turns internal account codes into friendly titles (e.g. "Youth Member").
 *
 * Backup plan if it breaks:
 * If the role code is unrecognized or missing, it safely shows "Youth Member".
 */
function accessRoleLabel(role) {
  const key = String(role || 'member').trim().toLowerCase();
  return ACCESS_ROLE_LABELS[key] || 'Youth Member';
}

// Section 3: Everyday Helpers (Safe Data Reading, Dates, and Text Cleaning)

/**
 * Safe Data Reader
 *
 * What it does:
 * Reads saved information from the device storage and unpacks it safely.
 *
 * Backup plan if it breaks:
 * If the saved text is damaged, scrambled, or empty, it catches the error
 * and hands back a safe default value (like an empty list) instead of crashing.
 */
function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

/**
 * Gets Active Login Session
 *
 * What it does:
 * Checks whether you are currently logged in by looking in device memory.
 *
 * Backup plan if it breaks:
 * If the login data is missing or corrupted, it returns null so the page
 * knows to send you to the sign-in screen.
 */
function getSession() {
  return (
    safeParse(localStorage.getItem(SESSION_KEY), null) ||
    safeParse(sessionStorage.getItem(SESSION_KEY), null)
  );
}

/**
 * Text Cleaner (Safety Guard)
 *
 * What it does:
 * Cleans up names and notes so symbols (like < or >) don't mess up the screen
 * or allow malicious tricks.
 *
 * Backup plan if it breaks:
 * If there is nothing to clean, it safely returns blank text.
 */
function esc(value = '') {
  return String(value).replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]
  );
}

/**
 * Simple Date Formatter
 *
 * What it does:
 * Turns raw computer dates into clear Philippine dates (e.g. "Sep 27, 2026").
 *
 * Backup plan if it breaks:
 * If the date is missing, blank, or invalid, it displays a neat dash ("—").
 */
function fmtDate(value) {
  if (!value) return '—';

  const d = new Date(
    String(value).length === 10
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
 * Formats both the date and the time for gatherings (e.g. "Sep 27, 2026, 3:00 PM").
 *
 * Backup plan if it breaks:
 * If the time or date is broken or missing, it shows a neat dash ("—").
 */
function fmtDateTime(value) {
  if (!value) return '—';

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
}

/**
 * Full Name Builder
 *
 * What it does:
 * Combines first, middle, and last names into a clean, complete name.
 *
 * Backup plan if it breaks:
 * If any part is missing (like no middle name), it skips it without leaving
 * awkward double spaces.
 */
function fullName(member) {
  return [
    member?.firstName,
    member?.middleName,
    member?.lastName
  ].filter(Boolean).join(' ');
}

// Section 4: Gathering / Event Cards Helpers

/**
 * Checks Event Registration
 *
 * What it does:
 * Checks if a member has registered for a specific gathering.
 *
 * Backup plan if it breaks:
 * If no registration record exists, it returns null so the event is labeled
 * "Not Registered" rather than causing an error.
 */
function eventRegistration(participants, memberId, eventId) {
  return participants.find(
    participant =>
      String(participant.memberId) === String(memberId) &&
      String(participant.eventId) === String(eventId)
  ) || null;
}

/**
 * Empty List Card
 *
 * What it does:
 * Shows a friendly, informative message when there are no events to show.
 *
 * Backup plan if it breaks:
 * Always returns a neat HTML placeholder so the screen is never left empty.
 */
function memberEmptyState(title, subtitle) {
  return `
    <div class="member-empty-card">
      <strong>${esc(title)}</strong>
      <span>${esc(subtitle)}</span>
    </div>
  `;
}

/**
 * Event Row Builder
 *
 * What it does:
 * Builds the visual card for an individual gathering with its date badge,
 * gathering title, venue, fee (or Free), and your registration status.
 *
 * Backup plan if it breaks:
 * - If the gathering name is missing, it shows "MFC Youth Gathering".
 * - If the date cannot be read, it shows a simple placeholder badge.
 * - If the fee is 0 or unlisted, it displays "Free".
 */
function memberEventRow(event, registration, timing) {
  const isUpcoming = timing === 'upcoming';
  const isAttended = Boolean(registration?.attended);
  const isRegistered = Boolean(registration);

  const statusText = isUpcoming
    ? (isRegistered ? 'Registered' : 'Not Registered')
    : (isAttended ? 'Attended' : (isRegistered ? 'Registered (Missed)' : 'Did Not Attend'));

  const statusStyle = isUpcoming
    ? (isRegistered ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;' : 'background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;')
    : (isAttended ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;' : (isRegistered ? 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;' : 'background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0;'));

  const dateObj = new Date(event.date);
  const monthStr = Number.isNaN(dateObj.getTime())
    ? 'EVENT'
    : dateObj.toLocaleDateString('en-PH', { month: 'short' }).toUpperCase();
  const dayStr = Number.isNaN(dateObj.getTime())
    ? '—'
    : dateObj.toLocaleDateString('en-PH', { day: '2-digit' });

  const feeNum = Number(event.fee || 0);

  return `
    <div class="member-event-item">
      <div class="member-event-date-badge">
        <span>${esc(monthStr)}</span>
        <strong>${esc(dayStr)}</strong>
      </div>

      <div class="member-event-info">
        <div class="member-event-title-row">
          <strong class="member-event-title">${esc(event.name || 'MFC Youth Gathering')}</strong>
          <span class="badge" style="${statusStyle}">${esc(statusText)}</span>
        </div>

        <div class="member-event-meta">
          <span>📅 ${esc(fmtDateTime(event.date))}</span>
          ${event.venue ? `<span>📍 ${esc(event.venue)}</span>` : ''}
          ${feeNum > 0 ? `<span class="event-fee-pill">₱${feeNum.toLocaleString()}</span>` : '<span class="event-fee-pill free">Free</span>'}
        </div>

        ${event.description ? `<p class="member-event-snippet">${esc(event.description)}</p>` : ''}
      </div>
    </div>
  `;
}

// Current login session and preview mode check (for leaders testing the page)
const session = getSession();
const previewMode = Boolean(
  session &&
  session.role !== 'member' &&
  new URLSearchParams(window.location.search).get('preview') === '1'
);

// Section 5: Online Server Communication

// Keeps track of active questions asked to the server so we don't ask twice
const activePortalRequests = new Map();

/**
 * Asks the Online Server for Updated Information
 *
 * What it does:
 * Connects securely to the cloud to fetch the latest member records and events.
 * It also prevents asking the server for the exact same thing twice at once.
 *
 * Backup plan if it breaks:
 * - If the connection drops or server is busy, it waits and retries up to 2 times automatically.
 * - If a request takes more than 8 seconds, it cancels the wait so your page doesn't freeze.
 * - If your login expired, it safely signs you out.
 * - If extra security verification is needed, it forwards you to the verification page.
 * - If you have no internet at all, it throws a safe error so the page can use previously saved offline data.
 */
async function portalBackendApi(path, options = {}) {
  const maxRetries = Math.min(Math.max(Number(options.maxRetries ?? 2), 0), 2);
  const dedupeKey = `${path}:${session?.accessToken || ''}`;

  if (activePortalRequests.has(dedupeKey)) {
    return activePortalRequests.get(dedupeKey);
  }

  const execute = async (attempt = 0) => {
    const token = session?.accessToken || '';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(path, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const body = await response.json().catch(() => ({ ok: false, error: 'Invalid server response.' }));

      if (!response.ok) {
        if (response.status === 403 && body?.code === 'MFA_REQUIRED') {
          window.location.href = '/mfa-verify.html';
          return;
        }
        if (response.status === 401 && (body?.code === 'INVALID_SESSION' || body?.code === 'AUTH_REQUIRED')) {
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
        }

        if (attempt < maxRetries && (response.status === 502 || response.status === 503 || response.status === 504)) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 3000);
          await new Promise(r => setTimeout(r, delay));
          return execute(attempt + 1);
        }

        throw new Error(body?.error || 'Request failed.');
      }
      return body;
    } catch (err) {
      if (err instanceof TypeError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 3000);
        await new Promise(r => setTimeout(r, delay));
        return execute(attempt + 1);
      }
      throw err;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const promise = execute().finally(() => {
    activePortalRequests.delete(dedupeKey);
  });
  activePortalRequests.set(dedupeKey, promise);
  return promise;
}

/**
 * Formats Cloud Member Record
 *
 * What it does:
 * Takes raw database details from the server and organizes them into a clean,
 * standard member record that this page knows how to display.
 *
 * Backup plan if it breaks:
 * If any detail (like phone or address) is missing from the server, it preserves
 * previous saved values or sets safe blank text instead of failing.
 */
function portalCloudMember(member, previous = {}) {
  return {
    ...previous,
    id: member.id,
    areaId: member.area_id || null,
    chapterId: member.chapter_id || null,
    firstName: member.first_name || '',
    middleName: member.middle_name || '',
    lastName: member.last_name || '',
    birthDate: member.birth_date || '',
    contact: member.contact_number || '',
    email: String(member.email || '').trim().toLowerCase(),
    address: member.address || '',
    status: member.status || 'Active',
    firstAttendedYouthCamp: member.first_attended_youth_camp || '',
    accessLevel: member.access_level || 'member',
    services: Array.isArray(previous.services) ? previous.services : [],
    chapterName: previous.chapterName || '',
    cloudBacked: true
  };
}

/**
 * Syncs Online Data to Device Storage
 *
 * What it does:
 * Downloads the freshest list of members, chapters, ministries, and events from the
 * server and saves an offline copy on your device so everything loads fast next time.
 *
 * Backup plan if it breaks:
 * - If you have no internet or are testing in demo mode, it skips syncing gracefully.
 * - The portal continues to load and display your existing offline data without any interruption.
 */
async function syncMemberPortalCloudCache() {
  if (!session?.backendAuth || session?.demo || !session?.areaId) return;

  const [membersPayload, syncPayload] = await Promise.all([
    portalBackendApi('/api/members'),
    portalBackendApi('/api/sync')
  ]);

  const data = safeParse(localStorage.getItem(DB_KEY) || '{}', {});
  const previousMembers = Array.isArray(data.members) ? data.members : [];
  const cloudMembers = Array.isArray(membersPayload?.members) ? membersPayload.members : [];
  const chapters = Array.isArray(syncPayload?.chapters) ? syncPayload.chapters : [];
  const services = Array.isArray(syncPayload?.services) ? syncPayload.services : [];
  const serviceLinks = Array.isArray(syncPayload?.memberServices) ? syncPayload.memberServices : [];
  const chapterNameById = new Map(chapters.map(row => [String(row.id), row.name]));
  const serviceNameById = new Map(services.map(row => [String(row.id), normalizePortalServiceName(row.name)]));
  const servicesByMember = new Map();

  // Group services per member
  serviceLinks.forEach(link => {
    const memberId = String(link.member_id || '');
    const name = serviceNameById.get(String(link.service_id || ''));
    if (!memberId || !name) return;
    if (!servicesByMember.has(memberId)) servicesByMember.set(memberId, []);
    servicesByMember.get(memberId).push(name);
  });

  // Reconcile member list with chapter and service relations
  data.members = cloudMembers.map(row => {
    const previous = previousMembers.find(item => String(item.id) === String(row.id)) || {};
    const member = portalCloudMember(row, previous);
    member.chapterName = member.chapterId ? (chapterNameById.get(String(member.chapterId)) || '') : '';
    member.services = servicesByMember.get(String(member.id)) || [];
    member.services = detectedPortalServices(member);
    return member;
  });

  data.chapters = chapters.map(row => ({ id: row.id, name: row.name, areaId: row.area_id, cloudBacked: true }));
  data.services = [...new Set([
    ...STANDARD_SERVICES,
    ...services.map(row => normalizePortalServiceName(row.name)).filter(Boolean)
  ])];
  data.events = (Array.isArray(syncPayload?.events) ? syncPayload.events : []).map(row => {
    let localDateTime = '';
    if (row.starts_at) {
      const date = new Date(row.starts_at);
      if (!Number.isNaN(date.getTime())) {
        localDateTime = new Date(date.getTime() + (8 * 60 * 60 * 1000)).toISOString().slice(0, 16);
      }
    }
    return {
      id: row.id,
      name: row.name || '',
      date: localDateTime,
      venue: row.venue || '',
      fee: Number(row.fee || 0),
      peopleAttended: Number(row.manual_attendance || 0),
      description: row.description || '',
      cloudBacked: true
    };
  });
  data.participants = (Array.isArray(syncPayload?.participants) ? syncPayload.participants : []).map(row => ({
    id: row.id,
    eventId: row.event_id,
    memberId: row.member_id,
    paymentMode: row.mode_of_payment || 'Cash',
    paymentStatus: row.payment_status || 'Unpaid',
    attended: Boolean(row.attended),
    cloudBacked: true
  }));

  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Section 6: Leader Preview Mode

/**
 * Creates Sample Profile for Leader Preview
 *
 * What it does:
 * Creates a temporary sample member profile when an Area Leader or Servant
 * clicks "Preview" to see what ordinary members see.
 *
 * Backup plan if it breaks:
 * If the leader's account name is missing, it uses friendly defaults like
 * "Area Servant" so the preview renders cleanly without crashing.
 */
function previewMemberFromSession(currentSession) {
  const name = String(currentSession?.name || currentSession?.email || 'Area Servant').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    id: currentSession?.memberId || `preview-${currentSession?.userId || 'admin'}`,
    firstName: parts[0] || 'Area',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : 'Servant',
    email: currentSession?.email || 'preview@mfcyouth.local',
    chapterName: 'Member View Preview',
    contact: '',
    firstAttendedYouthCamp: '',
    services: []
  };
}

// Section 7: Startup Engine (Builds and Displays the Member Portal)

/**
 * Member Portal Main Startup
 *
 * What it does:
 * 1. Checks if you are logged in and authorized.
 * 2. Tries to get the latest updates from the server.
 * 3. Sorts gatherings into Upcoming and Past events.
 * 4. Counts your registered and attended events.
 * 5. Draws the entire screen: Welcome Hero card, Activity Stats, Events list, and Profile.
 *
 * Backup plan if it breaks:
 * - If you are not logged in, it redirects you to the sign-in page.
 * - If you still need to set a new password, it sends you to the change password page.
 * - If your account was turned inactive or deleted, it logs you out safely.
 * - If the internet is down, it skips cloud syncing and uses your saved offline data.
 * - In Leader Preview Mode, it adds a button to return to the Admin Dashboard.
 */
async function bootstrapMemberPortal() {
  try {
    await syncMemberPortalCloudCache();
  } catch (error) {
    console.warn('Member Portal cloud sync skipped:', error?.message || error);
  }

  // Check login status: redirect if logged out or if password reset is required
  if (!session) {
    navigateWithLoader('/', true);
  } else if (session.mustChangePassword) {
    navigateWithLoader('/change-password', true);
  } else if (session.role !== 'member' && !previewMode) {
    navigateWithLoader('/dashboard', true);
  } else {
    const data = safeParse(localStorage.getItem(DB_KEY) || '{}', {});
    const members = Array.isArray(data.members) ? data.members : [];
    const linkedMember = members.find(
      item => String(item.id) === String(session.memberId)
    ) || members.find(
      item => String(item.email || '').trim().toLowerCase() === String(session.email || '').trim().toLowerCase()
    );
    const member = linkedMember || (previewMode ? previewMemberFromSession(session) : null);

    const users = safeParse(localStorage.getItem(USER_KEY) || '[]', []);
    const account = Array.isArray(users)
      ? users.find(item => String(item.id) === String(session.userId))
      : null;

    // Safety check: ensure account is active and member record exists
    if (
      !previewMode &&
      (
        !member ||
        (!session.backendAuth && !account) ||
        account?.isActive === false ||
        String(member?.status || 'Active') === 'Inactive'
      )
    ) {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      navigateWithLoader('/', true);
    } else if (member) {
      // In preview mode, add an exit button so leaders can return to the admin dashboard
      if (previewMode) {
        document.body.classList.add('member-preview-mode');
        const actions = document.querySelector('.member-portal-actions');
        if (actions) {
          actions.innerHTML = `
            <button class="btn" id="exitMemberPreview" type="button">Return to Admin Dashboard</button>
          `;
        }
      }

      // Filter upcoming vs. completed gatherings
      const events = Array.isArray(data.events)
        ? data.events.filter(event => event && event.date)
        : [];

      const participants = Array.isArray(data.participants)
        ? data.participants
        : [];

      const now = Date.now();

      const allUpcomingEvents = events
        .filter(event => new Date(event.date).getTime() >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const allRecentEvents = events
        .filter(event => new Date(event.date).getTime() < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const upcomingEvents = allUpcomingEvents.slice(0, 6);
      const recentEvents = allRecentEvents.slice(0, 6);

      const myRegistrations = participants.filter(
        participant => String(participant.memberId) === String(member.id)
      );

      const registeredUpcoming = allUpcomingEvents.filter(event =>
        Boolean(eventRegistration(participants, member.id, event.id))
      ).length;

      const attendedRecent = allRecentEvents
        .slice(0, 6)
        .filter(event =>
          eventRegistration(participants, member.id, event.id)?.attended
        ).length;

      // Draw the complete member portal screen
      document.getElementById('memberPortalContent').innerHTML = `
        ${previewMode ? `
          <section class="member-preview-banner animate-in" role="status">
            <div class="preview-banner-text">
              <strong>Member Portal Preview</strong>
              <span>You are viewing the dashboard as seen by a regular member. Your administrator session is preserved.</span>
            </div>
            <button class="btn" id="exitMemberPreview" type="button">Return to Admin Dashboard</button>
          </section>
        ` : ''}

        <!-- Top Welcome Banner -->
        <section class="dashboard-hero member-hero animate-in is-visible" id="overview">
          <div class="dashboard-hero-copy">
            <div class="dashboard-kicker">
              <span class="dashboard-live-dot"></span>
              ${previewMode ? 'Member Preview Mode' : 'MFC Youth Member Portal'}
            </div>
            <h1>Welcome, ${esc(member.firstName || fullName(member))}!</h1>
            <p>
              Your personal MFC Youth portal. Track upcoming gatherings, view your attendance history, and stay connected with ${esc(member.chapterName || 'your chapter')}.
            </p>
            <div class="dashboard-identity-row">
              <span>Chapter: ${esc(member.chapterName || 'Unassigned')}</span>
              <span>Role: ${esc((member.services || []).join(', ') || 'Youth Member')}</span>
              <span>Status: Active</span>
              <span>${previewMode ? 'Simulated View' : 'Cloud Synced'}</span>
            </div>
          </div>
          <div class="dashboard-hero-actions">
            <a class="btn blue" href="#events">View Events &rarr;</a>
            <a class="btn" href="#profile">My Profile</a>
          </div>
        </section>

        <!-- Quick Activity Stats Cards -->
        <section class="dashboard-metrics-section member-metrics-section animate-in is-visible" aria-label="Member Activity Metrics">
          <div class="dashboard-metrics-layout">
            <!-- Event Participation Card -->
            <a class="metric-card-primary member-metric-primary" href="#events" title="Jump to Community Gatherings">
              <div class="metric-primary-header">
                <span class="metric-primary-label">Event Participation & Attendance</span>
                <span class="metric-badge-primary">Primary Record</span>
              </div>

              <div>
                <div class="metric-primary-number">${registeredUpcoming}</div>
                <p class="metric-primary-caption">
                  ${registeredUpcoming === 1
                    ? `You are registered for 1 upcoming event out of ${allUpcomingEvents.length} scheduled.`
                    : `You are registered for ${registeredUpcoming} upcoming events out of ${allUpcomingEvents.length} scheduled.`}
                </p>
              </div>

              <div class="metric-primary-footer">
                <div class="metric-pill-group">
                  <span class="metric-pill active">
                    <span style="width: 7px; height: 7px; background: #16a34a; border-radius: 50%; display: inline-block;"></span>
                    ${registeredUpcoming} Registered
                  </span>
                  <span class="metric-pill">
                    ✓ ${attendedRecent} Attended recently
                  </span>
                  <span class="metric-pill">
                    ${myRegistrations.length} Total records
                  </span>
                </div>
                <span class="metric-action-hint">Browse Schedule &rarr;</span>
              </div>
            </a>

            <!-- Chapter and Status Side Cards -->
            <div class="metric-secondary-stack">
              <a class="metric-card-secondary services" href="#profile" title="View Community Affiliation">
                <div class="metric-secondary-header">
                  <span class="metric-secondary-label">Assigned Chapter</span>
                  <span class="metric-badge-secondary">Community</span>
                </div>
                <div class="metric-secondary-body">
                  <span class="metric-secondary-number" style="font-size: 1.35rem; line-height: 1.25;">
                    ${esc(member.chapterName || 'No Chapter Assigned')}
                  </span>
                  <p class="metric-secondary-caption">
                    Service: ${esc((member.services || []).join(', ') || 'Youth Member')}
                  </p>
                </div>
                <div class="metric-secondary-footer">
                  <span class="summary-link-hint" style="font-size: 0.76rem; color: #2563eb; font-weight: 600;">View community details &rarr;</span>
                </div>
              </a>

              <a class="metric-card-secondary reports" href="#profile" title="View Member Profile">
                <div class="metric-secondary-header">
                  <span class="metric-secondary-label">Official Record Status</span>
                  <span class="metric-badge-secondary">Verified</span>
                </div>
                <div class="metric-secondary-body">
                  <span class="metric-secondary-number" style="font-size: 1.35rem; color: #059669; line-height: 1.25;">
                    ${esc(member.status || 'Active Member')}
                  </span>
                  <p class="metric-secondary-caption">Connected to official Area records database</p>
                </div>
                <div class="metric-secondary-footer">
                  <span class="summary-link-hint" style="font-size: 0.76rem; color: #059669; font-weight: 600;">Check profile info &rarr;</span>
                </div>
              </a>
            </div>
          </div>
        </section>

        <!-- Events List: 2 Columns for Upcoming and Past Gatherings -->
        <section class="dashboard-events-big-card member-events-card animate-in is-visible" id="events">
          <div class="events-big-card-header">
            <div class="events-big-card-title-group">
              <h3>Community Gatherings & Events</h3>
              <p>Upcoming MFC Youth activities, household meetings, and your personal attendance log.</p>
            </div>
            <div class="events-big-card-pills">
              <span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700;">
                ${allUpcomingEvents.length} Upcoming
              </span>
              <span class="badge" style="background: #dcfce7; color: #15803d; font-weight: 700;">
                ${registeredUpcoming} Registered
              </span>
              <span class="badge" style="background: #f1f5f9; color: #475569; font-weight: 700;">
                ${allRecentEvents.length} Past Gatherings
              </span>
            </div>
          </div>

          <div class="dashboard-events-split">
            <!-- Left Column: Upcoming Gatherings -->
            <div class="events-column" id="upcoming">
              <div class="events-column-header">
                <span class="badge" style="background: #0284c7; color: #ffffff;">UPCOMING</span>
                <h4>What's Next</h4>
                <span class="muted" style="margin-left: auto; font-size: 0.76rem;">${upcomingEvents.length} shown</span>
              </div>

              ${upcomingEvents.length
                ? `
                  <div class="member-event-list">
                    ${upcomingEvents.map(event => memberEventRow(event, eventRegistration(participants, member.id, event.id), 'upcoming')).join('')}
                  </div>
                `
                : memberEmptyState('No upcoming events scheduled yet', 'New activities will appear here when posted by your Area leaders.')
              }
            </div>

            <!-- Right Column: Past Gatherings and Attendance History -->
            <div class="events-column" id="recent">
              <div class="events-column-header">
                <span class="badge" style="background: #e2e8f0; color: #475569;">RECENT</span>
                <h4>Attendance History</h4>
                <span class="muted" style="margin-left: auto; font-size: 0.76rem;">${recentEvents.length} recorded</span>
              </div>

              ${recentEvents.length
                ? `
                  <div class="member-event-list">
                    ${recentEvents.map(event => memberEventRow(event, eventRegistration(participants, member.id, event.id), 'past')).join('')}
                  </div>
                `
                : memberEmptyState('No recent gatherings on record', 'Your participation history will build up as activities conclude.')
              }
            </div>
          </div>
        </section>

        <!-- Member Profile Details Card -->
        <section class="member-profile-section animate-in is-visible" id="profile">
          <div class="card member-profile-card">
            <div class="member-profile-header">
              <div class="profile-header-avatar">
                ${esc((member.firstName?.[0] || 'M') + (member.lastName?.[0] || 'Y'))}
              </div>
              <div>
                <h2>${esc(fullName(member) || 'MFC Youth Member')}</h2>
                <p>Official Area Member Record & Account Affiliation</p>
              </div>
              <div class="profile-header-status">
                <span class="badge active" style="font-size: 0.78rem; padding: 5px 12px;">Active Member</span>
              </div>
            </div>

            <div class="member-profile-grid">
              <!-- Column 1: Contact Information -->
              <div class="profile-group-box">
                <span class="profile-group-title">Personal Information</span>
                <dl class="profile-field-list">
                  <div>
                    <dt>Full Name</dt>
                    <dd>${esc(fullName(member) || '—')}</dd>
                  </div>
                  <div>
                    <dt>Email Address</dt>
                    <dd>${esc(member.email || '—')}</dd>
                  </div>
                  <div>
                    <dt>Contact Number</dt>
                    <dd>${esc(member.contact || 'None provided')}</dd>
                  </div>
                </dl>
              </div>

              <!-- Column 2: Chapter & Ministries -->
              <div class="profile-group-box">
                <span class="profile-group-title">MFC Youth Affiliation</span>
                <dl class="profile-field-list">
                  <div>
                    <dt>Assigned Chapter</dt>
                    <dd><strong>${esc(member.chapterName || 'No Chapter Assigned')}</strong></dd>
                  </div>
                  <div>
                    <dt>Service / Ministry</dt>
                    <dd>${esc((member.services || []).join(', ') || 'Youth Member')}</dd>
                  </div>
                  <div>
                    <dt>First Youth Camp</dt>
                    <dd>${esc(fmtDate(member.firstAttendedYouthCamp))}</dd>
                  </div>
                </dl>
              </div>

              <!-- Column 3: Membership Status & Password Options -->
              <div class="profile-group-box">
                <span class="profile-group-title">Account & Security</span>
                <dl class="profile-field-list">
                  <div>
                    <dt>Access Level</dt>
                    <dd>${esc(accessRoleLabel(member.accessLevel || 'member'))}</dd>
                  </div>
                  <div>
                    <dt>Database Record</dt>
                    <dd><span class="badge" style="background: #e0f2fe; color: #0284c7;">Supabase Connected</span></dd>
                  </div>
                  <div>
                    <dt>Account Security</dt>
                    <dd>
                      ${!previewMode
                        ? '<button class="btn" id="inlineChangePasswordBtn" type="button" style="padding: 4px 10px; font-size: 0.78rem; margin-top: 4px;">Update Password</button>'
                        : '<span style="color: #64748b;">Preview Protected</span>'
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      `;

      // Remove loading skeletons once the page content has finished drawing
      window.MFCPageSkeleton?.clear?.();

      // Return button when an administrator is in Preview Mode
      document.getElementById('exitMemberPreview')?.addEventListener('click', () => {
        navigateWithLoader('/dashboard');
      });

      // Quick button inside the profile card to change your password
      document.getElementById('inlineChangePasswordBtn')?.addEventListener('click', () => {
        navigateWithLoader('/change-password');
      });
    }
  }

  // Section 8: Button Click Actions (Logout and Change Password)
  if (!previewMode) {
    document.getElementById('memberLogoutBtn')?.addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const originalText = button?.textContent || 'Logout';
      const alpineData = button?._x_dataStack?.[0];
      if (alpineData) {
        alpineData.loading = true;
      } else if (button) {
        button.disabled = true;
        button.textContent = 'Signing Out…';
      }

      // Tell the server to end this login session
      if (session?.backendAuth && !session?.demo && session?.accessToken) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`
            },
            body: JSON.stringify({ scope: 'local' })
          });
        } catch (error) {
          // Backup plan: Even if the server doesn't respond, we still log you out on this device
          console.warn('Server logout skipped; clearing device session anyway.', error?.message || error);
        }
      }

      // Erase login keys from device memory so you are safely signed out
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      if (alpineData) {
        alpineData.loading = false;
      } else if (button) {
        button.textContent = originalText;
      }
      navigateWithLoader('/');
    });

    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
      navigateWithLoader('/change-password');
    });
  }
}

// Section 9: Start the Member Portal

/**
 * Fires the startup function.
 *
 * Backup plan if it breaks:
 * If a fatal error stops the page from starting, it catches the error and draws
 * a clean friendly card asking you to refresh, instead of leaving a blank broken screen.
 */
bootstrapMemberPortal().catch(error => {
  console.error('Member Portal failed to load:', error);
  const root = document.getElementById('memberPortalContent');
  if (root) {
    root.innerHTML = `
      <div class="member-empty-card">
        <strong>Unable to load the Member Portal.</strong>
        <span>Please refresh your page or check your connection.</span>
      </div>
    `;
  }
});
