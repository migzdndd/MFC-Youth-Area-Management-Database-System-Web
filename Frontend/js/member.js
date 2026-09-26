/**
 * ============================================================================
 * MFC Youth Member Portal - Client Application
 * ============================================================================
 * Purpose:
 * Provides the member-facing portal for MFC Youth members.
 * - Displays member profile details, assigned chapter, and ministries/services.
 * - Lists upcoming and recent events with personal registration/attendance status.
 * - Synchronizes cloud data (Supabase backend) with localStorage for offline/fast UI.
 * - Supports administrative "Preview Mode" allowing area leaders to view the portal.
 * ============================================================================
 */

// Section 1: Storage Keys & Standard Services
const SESSION_KEY = 'mfc_demo_session';
const DB_KEY = 'mfc_web_database_v1';
const USER_KEY = 'mfc_demo_users';

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

/** Mapping of access level roles to default community services */
const ACCESS_ROLE_SERVICE_MAP = Object.freeze({
  area_servant: 'Area Servant',
  lit_servant: 'Area LIT Servant',
  campus_servant: 'Campus Servant',
  mfc_high_servant: 'MFC High Servant',
  area_kids_servant: 'Area Kids Servant',
  chapter_servant: 'Chapter Servant'
});

// Section 2: Service Normalization & Role Inference

/** Normalizes service title strings to canonical display names */
function normalizePortalServiceName(value) {
  const service = String(value || '').trim().replace(/\s+/g, ' ');
  if (!service) return '';
  const key = service.toLowerCase();
  if (key === 'lit servant' || key === 'lit_servant') return 'Area LIT Servant';
  if (key === 'kids servant' || key === 'area_kids_servant') return 'Area Kids Servant';
  return service;
}

/** Resolves explicit services assigned to a member, or infers one from access level */
function detectedPortalServices(member) {
  const explicit = Array.isArray(member?.services)
    ? [...new Set(member.services.map(normalizePortalServiceName).filter(Boolean))]
    : [];
  if (explicit.length) return [explicit[0]];
  const role = String(member?.accessLevel || 'member').trim().toLowerCase();
  const inferred = ACCESS_ROLE_SERVICE_MAP[role];
  return inferred ? [inferred] : [];
}

// Section 3: General Utilities: Safe JSON, Session, Sanitization & Date Formatting

/** Safely parses JSON strings with a fallback return value */
function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

/** Retrieves the active user session from localStorage or sessionStorage */
function getSession() {
  return (
    safeParse(localStorage.getItem(SESSION_KEY), null) ||
    safeParse(sessionStorage.getItem(SESSION_KEY), null)
  );
}

/** Escapes special HTML characters to prevent XSS injection */
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

/** Formats ISO dates or YYYY-MM-DD strings into localized Philippine dates */
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

/** Formats dates with both date and time components */
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

/** Combines first, middle, and last names into a clean full name */
function fullName(member) {
  return [
    member?.firstName,
    member?.middleName,
    member?.lastName
  ].filter(Boolean).join(' ');
}

// Section 4: Event Card & Registration UI Helpers

/** Looks up registration status for a given member and event */
function eventRegistration(participants, memberId, eventId) {
  return participants.find(
    participant =>
      String(participant.memberId) === String(memberId) &&
      String(participant.eventId) === String(eventId)
  ) || null;
}

/** Generates an empty state card for community events */
function memberEmptyState(title, subtitle) {
  return `
    <div class="member-empty-card">
      <strong>${esc(title)}</strong>
      <span>${esc(subtitle)}</span>
    </div>
  `;
}

/** Generates a compact, balanced event row for the 2-column split Events card */
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

// Global session initialization & admin preview check
const session = getSession();
const previewMode = Boolean(
  session &&
  session.role !== 'member' &&
  new URLSearchParams(window.location.search).get('preview') === '1'
);

// Section 5: Cloud Data Synchronization

// In-flight GET request deduplication for Member Portal
const activePortalRequests = new Map();

/**
 * Authenticated GET client for Member Portal with:
 * - Request deduplication
 * - Max 2 exponential backoff retries for transient 502/503/504 errors
 * - Automatic 403 MFA elevation & 401 session expiration handling
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

/** Maps a backend member database record to client schema format */
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

/** Synchronizes the current area's cloud state (members, events, services) to local cache */
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

// ----------------------------------------------------------------------------
// 6. Preview Mode Mock Generator
// Creates a temporary synthetic member object when an admin previews this page.
// ----------------------------------------------------------------------------
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

// Section 6: Member Portal Initialization & Rendering Flow
async function bootstrapMemberPortal() {
  try {
    await syncMemberPortalCloudCache();
  } catch (error) {
    console.warn('Member Portal cloud sync skipped:', error?.message || error);
  }

  // Auth & role check: redirect if not logged in or if user must change password
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

    // Validate account status
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
      // In preview mode, add exit button to return to administration dashboard
      if (previewMode) {
        document.body.classList.add('member-preview-mode');
        const actions = document.querySelector('.member-portal-actions');
        if (actions) {
          actions.innerHTML = `
            <button class="btn" id="exitMemberPreview" type="button">Return to Admin Dashboard</button>
          `;
        }
      }

      // Filter upcoming vs. completed events
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

      // Render the revamped member portal layout
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

        <!-- Member Hero Card (Aligned with Dashboard Hero) -->
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

        <!-- Metrics: Primary Big Card & Secondary Stack -->
        <section class="dashboard-metrics-section member-metrics-section animate-in is-visible" aria-label="Member Activity Metrics">
          <div class="dashboard-metrics-layout">
            <!-- Primary: Event Participation & Registration (Big Card) -->
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

            <!-- Secondary Stack: Community Chapter & Profile Status -->
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

        <!-- Big Events Card: 2-Column Split Layout (Matches Dashboard Big Events Card!) -->
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

            <!-- Right Column: Recent Gatherings & Attendance History -->
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

        <!-- Member Profile Section (Revamped Non-Stretched Grid) -->
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
              <!-- Column 1: Personal Contact Info -->
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

              <!-- Column 2: Affiliation & Ministries -->
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

              <!-- Column 3: Membership Status & Access -->
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

      window.MFCPageSkeleton?.clear?.();

      // Return to admin button for preview mode
      document.getElementById('exitMemberPreview')?.addEventListener('click', () => {
        navigateWithLoader('/dashboard');
      });

      // Inline change password button
      document.getElementById('inlineChangePasswordBtn')?.addEventListener('click', () => {
        navigateWithLoader('/change-password');
      });
    }
  }

  // Section 7: Event Listeners: Logout & Change Password Actions
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

      // Invalidate backend session token if signed in to cloud
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
          console.warn('Backend logout could not be confirmed; clearing this browser session anyway.', error?.message || error);
        }
      }

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

// Section 8: Execute Bootstrap
bootstrapMemberPortal().catch(error => {
  console.error('Member Portal failed to load:', error);
  const root = document.getElementById('memberPortalContent');
  if (root) root.innerHTML = `<div class="member-empty-card"><strong>Unable to load the Member Portal.</strong><span>Please refresh and try again.</span></div>`;
});
