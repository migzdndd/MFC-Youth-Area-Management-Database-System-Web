/**
 * ============================================================================
 * MFC Youth Area Management System - Dashboard Module
 * ============================================================================
 */

// Section 11: Dashboard Module

let cachedAreasPromise = null;
async function fetchCachedAreas() {
  if (!cachedAreasPromise) {
    cachedAreasPromise = backendApi('/api/areas').catch(err => {
      cachedAreasPromise = null;
      throw err;
    });
  }
  return cachedAreasPromise;
}

async function openAreaSelectionModal() {
  const CANONICAL_AREAS = [
    { id: 'NCR-CENTRAL', name: 'NCR Central' },
    { id: 'NCR-EAST', name: 'NCR East' },
    { id: 'NCR-NORTH', name: 'NCR North' },
    { id: 'NCR-SOUTH', name: 'NCR South' }
  ];

  document.getElementById('ncAreaSelectModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'ncAreaSelectModal';
  modal.className = 'modal-backdrop active';
  modal.setAttribute('x-data', '{ open: true, close() { this.open = false; setTimeout(() => modal.remove(), 220); } }');
  modal.setAttribute('x-show', 'open');
  modal.setAttribute('x-transition.opacity', '');
  modal.setAttribute('x-cloak', '');
  modal.setAttribute('@keydown.escape.window', 'close()');
  modal.setAttribute('@click.self', 'close()');
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;';

  modal.innerHTML = `
    <div class="card" x-show="open" x-transition style="background: #ffffff; border-radius: 20px; max-width: 600px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalFadeIn 0.2s ease-out;">
      <div style="padding: 24px 28px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #0f172a;">Select Registered Area</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.86rem; color: #64748b;">Choose an area to access its records and database metrics.</p>
        </div>
        <button type="button" id="closeNcAreaModal" @click="close()" style="background: transparent; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;" aria-label="Close modal">&times;</button>
      </div>

      <div style="padding: 24px; max-height: 70vh; overflow-y: auto;">
        <div id="ncAreaModalGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px;">
          ${CANONICAL_AREAS.map(area => `
            <div
              role="button"
              tabindex="0"
              style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; position: relative; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.04); min-height: 130px;"
              onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#93c5fd'; this.style.boxShadow='0 8px 20px rgba(37,99,235,0.1)';"
              onmouseout="this.style.transform='none'; this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)';"
              onclick='closeNcAreaModalAndVisit(${inlineJsArg(area.id)}, ${inlineJsArg(area.name)})'
              onkeydown='if(event.key===\"Enter\"||event.key===\" \"){closeNcAreaModalAndVisit(${inlineJsArg(area.id)}, ${inlineJsArg(area.name)}); event.preventDefault();}'
            >
              <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                ${esc(area.name)}
              </div>
              <p style="margin: 0 0 18px 0; color: #64748b; font-size: 0.84rem;">
                Click to view database
              </p>
              <span style="font-size: 0.82rem; font-weight: 600; color: #2563eb; margin-top: auto; display: inline-flex; align-items: center; gap: 4px;">
                Visit Area &rarr;
              </span>
              <div style="position: absolute; bottom: 0; left: 16px; right: 16px; height: 3px; background: #3b82f6; border-radius: 2px 2px 0 0;"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  try {
    const response = await fetchCachedAreas();
    const apiAreas = Array.isArray(response?.areas) && response.areas.length > 0
      ? response.areas
      : CANONICAL_AREAS;

    const grid = document.getElementById('ncAreaModalGrid');
    if (grid) {
      grid.innerHTML = apiAreas.map(area => `
        <div
          role="button"
          tabindex="0"
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; position: relative; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.04); min-height: 130px;"
          onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='#93c5fd'; this.style.boxShadow='0 8px 20px rgba(37,99,235,0.1)';"
          onmouseout="this.style.transform='none'; this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)';"
          onclick='closeNcAreaModalAndVisit(${inlineJsArg(area.id)}, ${inlineJsArg(area.name)})'
          onkeydown='if(event.key===\"Enter\"||event.key===\" \"){closeNcAreaModalAndVisit(${inlineJsArg(area.id)}, ${inlineJsArg(area.name)}); event.preventDefault();}'
        >
          <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
            ${esc(area.name)}
          </div>
          <p style="margin: 0 0 18px 0; color: #64748b; font-size: 0.84rem;">
            Click to view database
          </p>
          <span style="font-size: 0.82rem; font-weight: 600; color: #2563eb; margin-top: auto; display: inline-flex; align-items: center; gap: 4px;">
            Visit Area &rarr;
          </span>
          <div style="position: absolute; bottom: 0; left: 16px; right: 16px; height: 3px; background: #3b82f6; border-radius: 2px 2px 0 0;"></div>
        </div>
      `).join('');
    }
  } catch (err) {}
}

window.openAreaSelectionModal = openAreaSelectionModal;

window.closeNcAreaModalAndVisit = (areaId, areaName) => {
  document.getElementById('ncAreaSelectModal')?.remove();
  visitArea(areaId, areaName);
};

async function renderNationalCoordinatorDashboard(data) {
  let areasCount = 4;
  try {
    const response = await fetchCachedAreas();
    const apiAreas = Array.isArray(response?.areas) && response.areas.length > 0 ? response.areas : null;
    if (apiAreas) areasCount = apiAreas.length;
  } catch (err) {
    console.warn('Loaded canonical area count for National Coordinator:', err);
  }

  const membersCount = data.members?.length || 0;
  const activeMembers = data.members.filter(m => m.status === 'Active').length;
  const servicesCount = 5;
  const reportsCount = data.reports?.length || 0;
  const eventsCount = data.events?.length || 0;
  const registrationsCount = data.participants?.length || 0;
  const attendedCount = data.participants?.filter(p => p.attended).length || 0;

  const chapterCounts = (data.chapters || [])
    .map(chapter => ({
      name: chapter.name,
      count: (data.members || []).filter(m => String(m.chapterId) === String(chapter.id)).length
    }))
    .sort((a, b) => b.count - a.count);

  const now = Date.now();
  const upcomingEvents = [...(data.events || [])]
    .filter(event => event.date && parseEventTimestamp(event.date) >= now)
    .sort((a, b) => parseEventTimestamp(a.date) - parseEventTimestamp(b.date))
    .slice(0, 5);

  const recentEvents = [...(data.events || [])]
    .filter(event => event.date && parseEventTimestamp(event.date) < now)
    .sort((a, b) => parseEventTimestamp(b.date) - parseEventTimestamp(a.date))
    .slice(0, 5);

  content.innerHTML = `
    <section class="dashboard-hero animate-in is-visible">
      <div class="dashboard-hero-copy">
        <div class="dashboard-kicker"><span class="dashboard-live-dot"></span> National Workspace</div>
        <h1>Welcome back, ${esc(session?.name || 'National Coordinator')}.</h1>
        <p>You have Super Admin access across the national network. Select an Area below to view and manage its database, or review national records.</p>
        <div class="dashboard-identity-row">
          <span>National Coordinator</span>
          <span>Super Admin Access</span>
          <span>Cloud Connected</span>
        </div>
      </div>
      <div class="dashboard-hero-actions">
        <button type="button" class="btn blue" onclick="openAreaSelectionModal()">View Areas</button>
        <a class="btn" href="/events">Manage Events</a>
      </div>
    </section>

    <!-- Metrics: Primary (Member Count) & Secondary (Services, Reports) -->
    <section class="dashboard-metrics-section" aria-label="National Metrics">
      <div class="dashboard-metrics-layout">
        <!-- Primary: Member Count Card (Big Card) -->
        <a class="metric-card-primary" href="/members" title="View National Members Directory">
          <div class="metric-primary-header">
            <span class="metric-primary-label">National Members</span>
            <span class="metric-badge-primary">Primary</span>
          </div>

          <div>
            <div class="metric-primary-number">${membersCount}</div>
            <p class="metric-primary-caption">Total members registered across all regional areas</p>
          </div>

          <div class="metric-primary-footer">
            <div class="metric-pill-group">
              <span class="metric-pill active">
                <span style="width: 7px; height: 7px; background: #16a34a; border-radius: 50%; display: inline-block;"></span>
                ${activeMembers} Active
              </span>
              <button
                type="button"
                class="metric-pill"
                onclick="event.preventDefault(); openAreaSelectionModal();"
                style="cursor: pointer; border: none;"
                title="Browse Registered Areas"
              >
                <strong>${areasCount}</strong> Active Areas &rarr;
              </button>
            </div>
            <span class="metric-action-hint">Open Directory &rarr;</span>
          </div>
        </a>

        <!-- Secondary Stack: Services & Activity Reports -->
        <div class="metric-secondary-stack">
          <a class="metric-card-secondary services" href="/services" title="View Ministry Services">
            <div class="metric-secondary-header">
              <span class="metric-secondary-label">Services</span>
              <span class="metric-badge-secondary">Secondary</span>
            </div>
            <div class="metric-secondary-body">
              <span class="metric-secondary-number">${servicesCount}</span>
              <p class="metric-secondary-caption">Core ministry services</p>
            </div>
            <div class="metric-secondary-footer">
              <span class="summary-link-hint" style="font-size: 0.76rem; color: #2563eb; font-weight: 600;">Manage services &rarr;</span>
            </div>
          </a>

          <a class="metric-card-secondary reports" href="/reports" title="View National Activity Reports">
            <div class="metric-secondary-header">
              <span class="metric-secondary-label">Activity Reports</span>
              <span class="metric-badge-secondary">Secondary</span>
            </div>
            <div class="metric-secondary-body">
              <span class="metric-secondary-number">${reportsCount}</span>
              <p class="metric-secondary-caption">Reports filed across all areas</p>
            </div>
            <div class="metric-secondary-footer">
              <span class="summary-link-hint" style="font-size: 0.76rem; color: #059669; font-weight: 600;">View reports &rarr;</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- Members by Chapter (Above the events card) -->
    <section class="card panel members-by-chapter-panel" aria-label="National Chapter Distribution">
      <div class="panel-header-flex">
        <div>
          <h3>Members by Chapter</h3>
          <p class="muted" style="font-size: 0.8rem; margin: 2px 0 0;">Distribution of registered members across chapters</p>
        </div>
        <div class="panel-header-badges">
          <span class="scope-chip" style="font-size: 0.76rem;">${chapterCounts.length} Chapter${chapterCounts.length === 1 ? '' : 's'}</span>
          <a href="/chapters" class="btn" style="padding: 4px 10px; font-size: 0.76rem;">View Chapters &rarr;</a>
        </div>
      </div>

      ${chapterCounts.length
        ? `
            <div class="bar-list">
              ${chapterCounts
                .slice(0, 7)
                .map(item => {
                  const max = Math.max(...chapterCounts.map(row => row.count), 1);
                  return `
                    <div class="bar-row">
                      <span>${esc(item.name)}</span>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: ${(item.count / max) * 100}%"></div>
                      </div>
                      <strong>${item.count}</strong>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
        : emptyState(
            'No chapter data yet',
            'Registered chapters and member totals will appear here.'
          )
      }
    </section>

    <!-- Big Events Card (Bottom, fitting both Upcoming & Recent events) -->
    <section class="card panel dashboard-events-big-card" aria-label="National Events Overview">
      <div class="events-big-card-header">
        <div class="events-big-card-title-group">
          <h3>Events Overview</h3>
          <p>Scheduled activities, recent gatherings, and participation tracking</p>
        </div>
        <div class="events-big-card-pills">
          <span class="metric-pill"><strong>${eventsCount}</strong> Total Events</span>
          <span class="metric-pill"><strong>${registrationsCount}</strong> Registrations</span>
          <span class="metric-pill"><strong>${attendedCount}</strong> Attended</span>
          <a class="btn blue" href="/events" style="padding: 6px 12px; font-size: 0.8rem;">Manage Events</a>
        </div>
      </div>

      <div class="dashboard-events-split">
        <!-- Upcoming Events Column -->
        <div class="events-column">
          <div class="events-column-header">
            <span class="badge active">UPCOMING</span>
            <h4>Upcoming Activities</h4>
            <span class="muted" style="margin-left: auto; font-size: 0.76rem;">${upcomingEvents.length} scheduled</span>
          </div>

          ${upcomingEvents.length
            ? `
                <div class="mini-list">
                  ${upcomingEvents
                    .map(
                      event => `
                        <div class="mini-row">
                          <div>
                            <strong>${esc(event.name)}</strong>
                            <div class="muted">${esc(event.venue || 'No venue')}</div>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.78rem; color: #64748b;">${fmtDateTime(event.date)}</span>
                            <button
                              class="btn"
                              type="button"
                              onclick='viewEvent(${inlineJsArg(event.id)})'
                              style="padding: 3px 8px; font-size: 0.76rem;"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `
            : emptyState('No upcoming events', 'Future events you add will appear here.')
          }
        </div>

        <!-- Recent Events Column -->
        <div class="events-column">
          <div class="events-column-header">
            <span class="badge" style="background: #e2e8f0; color: #475569;">RECENT</span>
            <h4>Recent Gatherings</h4>
            <span class="muted" style="margin-left: auto; font-size: 0.76rem;">${recentEvents.length} recorded</span>
          </div>

          ${recentEvents.length
            ? `
                <div class="mini-list">
                  ${recentEvents
                    .map(
                      event => `
                        <div class="mini-row">
                          <div>
                            <strong>${esc(event.name)}</strong>
                            <div class="muted">${esc(event.venue || 'No venue')}</div>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.78rem; color: #64748b;">${fmtDate(event.date)}</span>
                            <button
                              class="btn"
                              type="button"
                              onclick='viewEvent(${inlineJsArg(event.id)})'
                              style="padding: 3px 8px; font-size: 0.76rem;"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `
            : emptyState('No past events yet', 'Completed events will appear here automatically.')
          }
        </div>
      </div>
    </section>
  `;
}

window.visitArea = async (areaId, areaName) => {
  session.areaId = areaId;
  session.areaName = areaName;
  updateStoredSession(session);
  
  if (session.backendAuth && !session.demo) {
    toast(`Switching to ${areaName}...`);
    try {
      await refreshAllCloudData({ render: false });
      toast(`Welcome to ${areaName}`);
    } catch (error) {
      toast('Failed to load area data', 'error');
    }
  } else {
    toast(`Switched to ${areaName}`);
  }
  
  navigateWithLoader('/members', true);
};

function renderDashboard() {
  const data = db();

  if (session?.role === 'national_coordinator') {
    renderNationalCoordinatorDashboard(data);
    return;
  }

  const cloudSummary = session?.backendAuth && !session?.demo
    ? data.cloudDashboard
    : null;

  const allCardDefs = {
    members: [
      'members',
      'Total Members',
      (session?.role === 'campus_servant' || session?.role === 'mfc_high_servant' || isChapterServantSession())
        ? getVisibleMembers(data).length
        : (cloudSummary?.members ?? data.members.length),
      'People currently on record',
      (isChapterServantSession() ? '/chapters' : '/members')
    ],
    services: (() => {
      let count = cloudSummary?.services ?? data.services.length;
      if (['area_servant', 'national_coordinator', 'couple_coordinator', 'lit_servant'].includes(session?.role)) count = 5;
      else if (session?.role === 'campus_servant') count = 2;
      else if (['mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(session?.role)) count = 1;
      
      return [
        'services',
        (session?.role === 'campus_servant' || session?.role === 'mfc_high_servant') ? 'Service' : 'Services',
        count,
        count === 1 ? 'Available service role' : 'Available service roles',
        '/services'
      ];
    })(),
    chapters: [
      'chapters',
      (session?.role === 'lit_servant' || isChapterServantSession()) ? 'Chapter' : 'Chapters',
      cloudSummary?.chapters ?? data.chapters.length,
      'Registered chapters',
      '/chapters'
    ],
    reports: [
      'reports',
      'Activity Reports',
      cloudSummary?.reports ?? data.reports.length,
      'Reports currently filed',
      '/reports'
    ],
    events: [
      'events',
      'Events',
      cloudSummary?.events ?? data.events.length,
      'Events currently recorded',
      '/events'
    ]
  };

  const ROLE_DASHBOARD_CARDS = {
    area_servant: ['members', 'services', 'chapters', 'reports', 'events'],
    couple_coordinator: ['members', 'services', 'chapters', 'reports', 'events'],
    lit_servant: ['members', 'services', 'reports', 'events'],
    area_kids_servant: ['members', 'services', 'reports', 'events'],
    chapter_servant: ['members', 'reports', 'events'],
    mfc_high_servant: ['members', 'reports', 'events'],
    campus_servant: ['members', 'reports', 'events']
  };

  const cardKeys = ROLE_DASHBOARD_CARDS[session?.role] || [
    'members',
    'services',
    'chapters',
    'reports',
    'events'
  ];

  const cards = cardKeys.map(key => allCardDefs[key]).filter(Boolean);

  const chapterCounts =
    data.chapters
      .map(chapter => ({
        name: chapter.name,

        count: getVisibleMembers(data).filter(
          member =>
            String(member.chapterId) ===
            String(chapter.id)
        ).length
      }))
      .sort(
        (a, b) =>
          b.count - a.count
      );

  const now = Date.now();

  // FUTURE / CURRENT EVENTS ONLY
  const upcomingEvents = [
    ...data.events
  ]
    .filter(
      event =>
        event.date &&
        parseEventTimestamp(event.date) >= now
    )
    .sort(
      (a, b) =>
        parseEventTimestamp(a.date) -
        parseEventTimestamp(b.date)
    )
    .slice(0, 5);

  // PAST EVENTS ONLY
  const recentEvents = [
    ...data.events
  ]
    .filter(
      event =>
        event.date &&
        parseEventTimestamp(event.date) < now
    )
    .sort(
      (a, b) =>
        parseEventTimestamp(b.date) -
        parseEventTimestamp(a.date)
    )
    .slice(0, 5);

  const activeMembers = (session.role === 'campus_servant' || session.role === 'mfc_high_servant') 
    ? getVisibleMembers(data).filter(member => member.status === 'Active').length 
    : (cloudSummary?.activeMembers ?? data.members.filter(
    member => member.status === 'Active'
  ).length);

  const attended = cloudSummary?.attended ?? data.participants.filter(
    participant => participant.attended
  ).length;

  const dashboardAreaName = session?.areaName || 'Your Area';
  const dashboardRole = accessRoleLabel(session?.role);

  const membersCount = (session?.role === 'campus_servant' || session?.role === 'mfc_high_servant' || isChapterServantSession())
    ? getVisibleMembers(data).length
    : (cloudSummary?.members ?? data.members.length);

  const servicesCard = allCardDefs.services;
  const servicesCount = servicesCard[2];
  const servicesTitle = servicesCard[1];
  const servicesCaption = servicesCard[3];

  const hasReports = cardKeys.includes('reports');
  const reportsCount = cloudSummary?.reports ?? data.reports.length;

  const totalEventsCount = cloudSummary?.events ?? data.events.length;
  const registrationsCount = cloudSummary?.registrations ?? data.participants.length;

  content.innerHTML = `
    <section class="dashboard-hero animate-in is-visible">
      <div class="dashboard-hero-copy">
        <div class="dashboard-kicker"><span class="dashboard-live-dot"></span> Cloud workspace</div>
        <h1>Welcome back, ${esc(session?.name || 'Area User')}.</h1>
        <p>Here is the latest overview of ${esc(dashboardAreaName)}. Your records are organized, synced, and ready for action.</p>
        <div class="dashboard-identity-row">
          <span>${esc(dashboardRole)}</span>
          <span>${esc(dashboardAreaName)}</span>
          <span>Supabase connected</span>
        </div>
      </div>
      <div class="dashboard-hero-actions">
        ${isChapterServantSession()
          ? '<a class="btn blue" href="/chapters">View Chapter</a>'
          : '<a class="btn blue" href="/members">View Members</a>'}
        <a class="btn" href="/events">Manage Events</a>
      </div>
    </section>

    <!-- Metrics: Primary (Member Count) & Secondary (Services, Reports) -->
    <section class="dashboard-metrics-section" aria-label="Dashboard Metrics">
      <div class="dashboard-metrics-layout">
        <!-- Primary: Member Count Card (Big Card) -->
        <a class="metric-card-primary" href="${isChapterServantSession() ? '/chapters' : '/members'}" title="View Members Directory">
          <div class="metric-primary-header">
            <span class="metric-primary-label">${isChapterServantSession() ? 'Chapter Members' : 'Total Members'}</span>
            <span class="metric-badge-primary">Primary</span>
          </div>

          <div>
            <div class="metric-primary-number">${membersCount}</div>
            <p class="metric-primary-caption">${isChapterServantSession() ? 'Members in your assigned chapter' : `People currently on record in ${esc(dashboardAreaName)}`}</p>
          </div>

          <div class="metric-primary-footer">
            <div class="metric-pill-group">
              <span class="metric-pill active">
                <span style="width: 7px; height: 7px; background: #16a34a; border-radius: 50%; display: inline-block;"></span>
                ${activeMembers} Active
              </span>
              ${(membersCount - activeMembers) > 0 ? `<span class="metric-pill">${membersCount - activeMembers} Inactive</span>` : ''}
            </div>
            <span class="metric-action-hint">Open Directory &rarr;</span>
          </div>
        </a>

        <!-- Secondary Stack: Services & Activity Reports -->
        <div class="metric-secondary-stack">
          <a class="metric-card-secondary services" href="/services" title="View Services">
            <div class="metric-secondary-header">
              <span class="metric-secondary-label">${esc(servicesTitle)}</span>
              <span class="metric-badge-secondary">Secondary</span>
            </div>
            <div class="metric-secondary-body">
              <span class="metric-secondary-number">${servicesCount}</span>
              <p class="metric-secondary-caption">${esc(servicesCaption)}</p>
            </div>
            <div class="metric-secondary-footer">
              <span class="summary-link-hint" style="font-size: 0.76rem; color: #2563eb; font-weight: 600;">Manage services &rarr;</span>
            </div>
          </a>

          ${hasReports ? `
          <a class="metric-card-secondary reports" href="/reports" title="View Activity Reports">
            <div class="metric-secondary-header">
              <span class="metric-secondary-label">Activity Reports</span>
              <span class="metric-badge-secondary">Secondary</span>
            </div>
            <div class="metric-secondary-body">
              <span class="metric-secondary-number">${reportsCount}</span>
              <p class="metric-secondary-caption">Reports filed in system</p>
            </div>
            <div class="metric-secondary-footer">
              <span class="summary-link-hint" style="font-size: 0.76rem; color: #059669; font-weight: 600;">View reports &rarr;</span>
            </div>
          </a>
          ` : ''}
        </div>
      </div>
    </section>

    <!-- Members by Chapter (Above the events card) -->
    <section class="card panel members-by-chapter-panel" aria-label="Members by Chapter Distribution">
      <div class="panel-header-flex">
        <div>
          <h3>Members by Chapter</h3>
          <p class="muted" style="font-size: 0.8rem; margin: 2px 0 0;">Distribution of registered members across chapters</p>
        </div>
        <div class="panel-header-badges">
          <span class="scope-chip" style="font-size: 0.76rem;">${chapterCounts.length} Chapter${chapterCounts.length === 1 ? '' : 's'}</span>
          <a href="/chapters" class="btn" style="padding: 4px 10px; font-size: 0.76rem;">View Chapters &rarr;</a>
        </div>
      </div>

      ${chapterCounts.length
        ? `
            <div class="bar-list">
              ${chapterCounts
                .slice(0, 7)
                .map(item => {
                  const max = Math.max(...chapterCounts.map(row => row.count), 1);
                  return `
                    <div class="bar-row">
                      <span>${esc(item.name)}</span>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: ${(item.count / max) * 100}%"></div>
                      </div>
                      <strong>${item.count}</strong>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
        : emptyState(
            'No chapter data yet',
            'Add chapters and members to see distribution.'
          )
      }
    </section>

    <!-- Big Events Card (Bottom, fitting both Upcoming & Recent events) -->
    <section class="card panel dashboard-events-big-card" aria-label="Events Overview">
      <div class="events-big-card-header">
        <div class="events-big-card-title-group">
          <h3>Events Overview</h3>
          <p>Scheduled activities, recent gatherings, and participation tracking</p>
        </div>
        <div class="events-big-card-pills">
          <span class="metric-pill"><strong>${totalEventsCount}</strong> Total Events</span>
          <span class="metric-pill"><strong>${registrationsCount}</strong> Registrations</span>
          <span class="metric-pill"><strong>${attended}</strong> Attended</span>
          <a class="btn blue" href="/events" style="padding: 6px 12px; font-size: 0.8rem;">Manage Events</a>
        </div>
      </div>

      <div class="dashboard-events-split">
        <!-- Upcoming Events Column -->
        <div class="events-column">
          <div class="events-column-header">
            <span class="badge active">UPCOMING</span>
            <h4>Upcoming Activities</h4>
            <span class="muted" style="margin-left: auto; font-size: 0.76rem;">${upcomingEvents.length} scheduled</span>
          </div>

          ${upcomingEvents.length
            ? `
                <div class="mini-list">
                  ${upcomingEvents
                    .map(
                      event => `
                        <div class="mini-row">
                          <div>
                            <strong>${esc(event.name)}</strong>
                            <div class="muted">${esc(event.venue || 'No venue')}</div>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.78rem; color: #64748b;">${fmtDateTime(event.date)}</span>
                            <button
                              class="btn"
                              type="button"
                              onclick='viewEvent(${inlineJsArg(event.id)})'
                              style="padding: 3px 8px; font-size: 0.76rem;"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `
            : emptyState('No upcoming events', 'Future events you add will appear here.')
          }
        </div>

        <!-- Recent Events Column -->
        <div class="events-column">
          <div class="events-column-header">
            <span class="badge" style="background: #e2e8f0; color: #475569;">RECENT</span>
            <h4>Recent Gatherings</h4>
            <span class="muted" style="margin-left: auto; font-size: 0.76rem;">${recentEvents.length} recorded</span>
          </div>

          ${recentEvents.length
            ? `
                <div class="mini-list">
                  ${recentEvents
                    .map(
                      event => `
                        <div class="mini-row">
                          <div>
                            <strong>${esc(event.name)}</strong>
                            <div class="muted">${esc(event.venue || 'No venue')}</div>
                          </div>
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 0.78rem; color: #64748b;">${fmtDate(event.date)}</span>
                            <button
                              class="btn"
                              type="button"
                              onclick='viewEvent(${inlineJsArg(event.id)})'
                              style="padding: 3px 8px; font-size: 0.76rem;"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `
            : emptyState('No past events yet', 'Completed events will appear here automatically.')
          }
        </div>
      </div>
    </section>
  `;
}
