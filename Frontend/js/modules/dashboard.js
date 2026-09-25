/**
 * ============================================================================
 * MFC Youth Area Management System - Dashboard Module
 * ============================================================================
 */

// Section 11: Dashboard Module

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
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;';

  modal.innerHTML = `
    <div class="card" style="background: #ffffff; border-radius: 20px; max-width: 600px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: modalFadeIn 0.2s ease-out;">
      <div style="padding: 24px 28px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2 style="margin: 0; font-size: 1.3rem; font-weight: 700; color: #0f172a;">Select Registered Area</h2>
          <p style="margin: 4px 0 0 0; font-size: 0.86rem; color: #64748b;">Choose an area to access its records and database metrics.</p>
        </div>
        <button type="button" id="closeNcAreaModal" style="background: transparent; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;" aria-label="Close modal">&times;</button>
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

  const closeModal = () => modal.remove();
  document.getElementById('closeNcAreaModal')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  try {
    const response = await backendApi('/api/areas');
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

    <section>
      <div class="section-heading">
        <h2>National Overview</h2>
        <p>Key records across all Areas</p>
        <div class="section-line"></div>
      </div>

      <div class="summary-card card">
        <div class="summary-item" role="button" tabindex="0" onclick="openAreaSelectionModal()" onkeydown="if(event.key==='Enter'||event.key===' '){openAreaSelectionModal(); event.preventDefault();}" style="cursor: pointer; display: flex; flex-direction: column;" title="Browse Registered Areas">
          <div class="summary-label">Areas</div>
          <div class="summary-value" id="nc-areas-count">4</div>
          <p class="summary-caption">Active regional areas</p>
          <span class="summary-link-hint">Browse Areas &rarr;</span>
        </div>
        <a class="summary-item reports" href="/reports" style="text-decoration: none; color: inherit; display: flex; flex-direction: column;" title="View Activity Reports">
          <div class="summary-label">Activity Reports</div>
          <div class="summary-value">${data.reports?.length || 0}</div>
          <p class="summary-caption">Reports filed across areas</p>
          <span class="summary-link-hint">View Reports &rarr;</span>
        </a>
        <a class="summary-item events" href="/events" style="text-decoration: none; color: inherit; display: flex; flex-direction: column;" title="View Events">
          <div class="summary-label">Events</div>
          <div class="summary-value">${data.events?.length || 0}</div>
          <p class="summary-caption">Events recorded in system</p>
          <span class="summary-link-hint">View Events &rarr;</span>
        </a>
      </div>
    </section>
  `;

  try {
    const response = await backendApi('/api/areas');
    const apiAreas = Array.isArray(response?.areas) && response.areas.length > 0 ? response.areas : null;
    const count = apiAreas ? apiAreas.length : 4;
    const countElem = document.getElementById('nc-areas-count');
    if (countElem) countElem.textContent = String(count);
  } catch (err) {
    console.warn('Loaded canonical area count for National Coordinator:', err);
  }
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

    <section>
      <div class="section-heading">
        <h2>Area Summary</h2>

        <p>
          Current totals from your Area cloud database
        </p>

        <div class="section-line"></div>
      </div>

      <div class="summary-card card">
        ${cards
      .map(
        card => `
              <a
                class="summary-item ${card[0]}"
                href="${card[4] || `/${card[0]}`}"
                style="text-decoration: none; color: inherit; display: flex; flex-direction: column;"
                title="View ${esc(card[1])}"
              >
                <div class="summary-label">
                  ${card[1]}

                  <div
                    class="label-line"
                  ></div>
                </div>

                <strong
                  class="summary-number"
                >
                  ${card[2]}
                </strong>

                <p>
                  ${card[3]}
                </p>
                <span class="summary-link-hint" style="font-size: 0.76rem; color: var(--blue); font-weight: 600; margin-top: auto; padding-top: 6px; display: inline-flex; align-items: center; gap: 4px;">
                  Open module &rarr;
                </span>
              </a>
            `
      )
      .join('')}
      </div>
    </section>

    <div class="quick-stat-row">
      <span>
        <strong>
          ${activeMembers}
        </strong>
        Active Members
      </span>

      <span>
        <strong>
          ${cloudSummary?.registrations ?? data.participants.length}
        </strong>
        Event Registrations
      </span>

      <span>
        <strong>
          ${attended}
        </strong>
        Recorded Attendances
      </span>
    </div>

    <div class="grid-2">

      <section class="card panel">
        <h3>
          Members by Chapter
        </h3>

        ${chapterCounts.length
      ? `
              <div class="bar-list">
                ${chapterCounts
        .slice(0, 7)
        .map(item => {
          const max =
            Math.max(
              ...chapterCounts.map(
                row => row.count
              ),
              1
            );

          return `
                      <div class="bar-row">
                        <span>
                          ${esc(
            item.name
          )}
                        </span>

                        <div
                          class="bar-track"
                        >
                          <div
                            class="bar-fill"
                            style="
                              width:
                              ${(item.count /
              max) *
            100
            }%
                            "
                          ></div>
                        </div>

                        <strong>
                          ${item.count}
                        </strong>
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

      <section class="card panel">
        <h3>
          Upcoming Events
        </h3>

        ${upcomingEvents.length
      ? `
              <div class="mini-list">
                ${upcomingEvents
        .map(
          event => `
                      <div class="mini-row">

                        <div>
                          <strong>
                            ${esc(
            event.name
          )}
                          </strong>

                          <div
                            class="muted"
                          >
                            ${esc(
            event.venue ||
            'No venue'
          )}
                          </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span>
                            ${fmtDateTime(
            event.date
          )}
                          </span>
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
      : emptyState(
        'No upcoming events',
        'Future events you add will appear here.'
      )
    }
      </section>

    </div>

    <div class="grid-2">

      <section class="card panel">
        <h3>
          Recent Events
        </h3>

        ${recentEvents.length
      ? `
              <div class="mini-list">
                ${recentEvents
        .map(
          event => `
                      <div class="mini-row">

                        <div>
                          <strong>
                            ${esc(
            event.name
          )}
                          </strong>

                          <div
                            class="muted"
                          >
                            ${esc(
            event.venue ||
            'No venue'
          )}
                          </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span>
                            ${fmtDate(
            event.date
          )}
                          </span>
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
      : emptyState(
        'No past events yet',
        'Completed events will appear here automatically.'
      )
    }
      </section>


    </div>
  `;
}
