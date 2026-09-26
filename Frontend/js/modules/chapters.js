/**
 * MFC Youth Area Management System - Chapters & Local Communities
 *
 * What this file does:
 * Manages local MFC Youth chapters, displays chapter rosters, handles member assignments,
 * and provides Chapter Servants with their localized chapter management dashboard.
 *
 * Backup plan if it breaks:
 * If a Chapter Servant is not linked to a chapter yet, the system shows a friendly notice
 * asking an Area Servant to assign them, rather than crashing or showing unauthorized data.
 * All edits and deletions verify safety rules (e.g., chapters with members cannot be deleted).
 */

let chapterSearch = '';

/**
 * Display Chapter Servant Dashboard
 *
 * What it does:
 * Builds the special home screen for a Chapter Servant, showing their chapter's total roster,
 * active member count, total GIG offerings, and recent activity reports.
 *
 * Backup plan if it breaks:
 * If the user's account is not assigned to a chapter yet, it displays an empty state guiding them
 * to contact their Area Servant or Couple Coordinator.
 */
function renderChapterServantDashboard(data) {
  const chapter = scopedChapter(data);

  if (!chapter) {
    content.innerHTML =
      pageHeader(
        'Chapter Dashboard',
        'Your Chapter Servant account is not assigned to a chapter yet.'
      ) +
      emptyState(
        'No chapter assignment',
        'Ask an Area Servant, Area LIT Servant, Campus Servant, Area Kids Servant, or Couple Coordinator to assign your member record to a chapter.'
      );
    return;
  }

  const members = data.members
    .filter(member => String(member.chapterId) === String(chapter.id))
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const activeMembers = members.filter(
    member => String(member.status || 'Active') === 'Active'
  );

  const memberIds = new Set(members.map(member => String(member.id)));

  const gigRows = data.gig.filter(
    item => memberIds.has(String(item.memberId))
  );

  const gigTotal = gigRows.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const chapterReports = data.reports
    .filter(report => report.chapter === chapter.name)
    .sort((a, b) => parseEventTimestamp(b.date) - parseEventTimestamp(a.date));

  const unassignedCount = data.members.filter(isUnassignedMember).length;
  const unassignedLabel = session?.backendAuth && !session?.demo
    ? 'Unassigned members available on demand'
    : `${unassignedCount} unassigned member${unassignedCount === 1 ? '' : 's'} available`;

  content.innerHTML =
    pageHeader(
      `${esc(chapter.name)} Chapter`,
      'Chapter Servant dashboard. Your access is limited to this assigned chapter.',
      `
        <button
          class="btn blue"
          id="chapterAssignMembers"
          type="button"
        >
          + Add Unassigned Members
        </button>
      `
    ) +
    `
    <div class="chapter-scope-banner">
      <div>
        <span class="member-eyebrow">CHAPTER SERVANT ACCESS</span>
        <strong>${esc(chapter.name)} Chapter</strong>
      </div>
      <span class="scope-chip">${esc(unassignedLabel)}</span>
    </div>

    <div class="stat-grid">
      <section class="card stat-card">
        <span>Chapter Members</span>
        <strong>${members.length}</strong>
      </section>

      <section class="card stat-card">
        <span>Active Members</span>
        <strong>${activeMembers.length}</strong>
      </section>

      <section class="card stat-card">
        <span>Activity Reports</span>
        <strong>${chapterReports.length}</strong>
      </section>

      <section class="card stat-card">
        <span>Total Chapter GIG</span>
        <strong>${esc(money(gigTotal))}</strong>
      </section>
    </div>

    <div class="grid-2 chapter-dashboard-grid">
      <section class="card panel">
        <div class="panel-heading-row">
          <div>
            <span class="member-eyebrow">MEMBERS</span>
            <h3>Chapter Roster</h3>
          </div>
          <span class="scope-chip">${members.length} total</span>
        </div>

        ${members.length
          ? `
            <div class="table-wrap chapter-roster-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Status</th>
                    <th>Services</th>
                    <th>GIG</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${members.map(member => {
                    const total = data.gig
                      .filter(item => String(item.memberId) === String(member.id))
                      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

                    return `
                      <tr>
                        <td>
                          <strong>${esc(fullName(member))}</strong>
                          <div class="muted">${esc(member.email || 'No email')}</div>
                        </td>
                        <td>
                          <span class="badge ${member.status === 'Active' ? 'active' : 'inactive'}">
                            ${esc(member.status || 'Active')}
                          </span>
                        </td>
                        <td>${esc((member.services || []).join(', ') || 'No Service Assigned')}</td>
                        <td>${esc(money(total))}</td>
                        <td class="actions-cell">
                          <button class="btn" onclick='viewMember(${inlineJsArg(member.id)})'>View</button>
                          <button class="btn" onclick='gigMember(${inlineJsArg(member.id)})'>GIG</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `
          : emptyState(
              'No chapter members',
              'Use Add Unassigned Members to assign available members to this chapter.'
            )
        }
      </section>

      <section class="card panel">
        <div class="panel-heading-row">
          <div>
            <span class="member-eyebrow">RECENT</span>
            <h3>Chapter Activity</h3>
          </div>
        </div>

        ${chapterReports.length
          ? `
            <div class="chapter-activity-list">
              ${chapterReports.slice(0, 6).map(report => `
                <div class="chapter-activity-item">
                  <div>
                    <strong>${esc(report.title || report.activity || 'Activity')}</strong>
                    <span>${esc(report.type || 'Activity Report')}</span>
                  </div>
                  <time>${esc(fmtDate(report.date))}</time>
                </div>
              `).join('')}
            </div>
          `
          : emptyState(
              'No chapter activity reports',
              'Reports created for this chapter will appear here.'
            )
        }
      </section>
    </div>
  `;

  document.getElementById('chapterAssignMembers')?.addEventListener('click', () => {
    window.addMembersToChapter(chapter.id);
  });
}

/**
 * Display All Chapters Screen
 *
 * What it does:
 * Renders the chapters directory table with search, member count totals, and action buttons.
 * If signed in as a Chapter Servant, it automatically shows your personal chapter dashboard instead.
 *
 * Backup plan if it breaks:
 * If no chapters match the search keyword, it shows a friendly "No matching chapters" message
 * with a quick button to clear the search filter.
 */
function renderChapters() {
  const data = db();

  if (isChapterServantSession()) {
    renderChapterServantDashboard(data);
    return;
  }

  const list =
    data.chapters.filter(
      chapter =>
        chapter.name
          .toLowerCase()
          .includes(
            chapterSearch.toLowerCase()
          )
    );

  content.innerHTML =
    pageHeader(
      'Chapters',
      'Create and manage MFC Youth chapters and view their assigned members.',
      `
        <button
          class="btn blue"
          id="addChapter"
        >
          + Add Chapter
        </button>
      `
    ) +
    `
    <div class="toolbar">

      <div class="grow">
        <input
          class="search-input"
          id="chapterSearch"
          placeholder="Search chapters..."
          value="${esc(
      chapterSearch
    )}"
        >
      </div>

      <button
        class="btn"
        id="clearChapterSearch"
      >
        Clear
      </button>

    </div>

    <div class="result-count">
      Showing
      ${list.length}
      of
      ${data.chapters.length}
      chapter${data.chapters.length === 1
      ? ''
      : 's'
    }
    </div>

    <section class="card table-wrap">

      ${list.length
      ? `
            <table class="data-table">

              <thead>
                <tr>
                  <th>Chapter</th>
                  <th>Member Count</th>
                  <th>Active Members</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${list
        .map(
          chapter => {
            const members =
              data.members.filter(
                member =>
                  String(member.chapterId) ===
                  String(chapter.id)
              );

            return `
                        <tr>

                          <td>
                            <strong>
                              ${esc(
              chapter.name
            )}
                            </strong>
                          </td>

                          <td>
                            ${members.length}
                          </td>

                          <td>
                            ${members.filter(
              member =>
                member.status ===
                'Active'
            ).length
              }
                          </td>

                          <td
                            class="actions-cell"
                          >
                            <button
                              class="btn"
                              onclick='viewChapter(${inlineJsArg(chapter.id)})'
                            >
                              View Members
                            </button>

                            <button
                              class="btn"
                              onclick='window.addMembersToChapter(${inlineJsArg(chapter.id)})'
                            >
                              + Add Members
                            </button>

                            <button
                              class="btn"
                              onclick='editChapter(${inlineJsArg(chapter.id)})'
                            >
                              Rename
                            </button>

                            <button
                              class="btn red"
                              onclick='deleteChapter(${inlineJsArg(chapter.id)})'
                            >
                              Delete
                            </button>
                          </td>

                        </tr>
                      `;
          }
        )
        .join('')}

              </tbody>

            </table>
          `
      : emptyState(
        'No matching chapters',
        data.chapters.length
          ? 'Change or clear your search.'
          : 'Add your first chapter.'
      )
    }

    </section>
  `;

  document.getElementById(
    'addChapter'
  ).onclick = () =>
      chapterModal();

  document.getElementById(
    'chapterSearch'
  ).oninput = event => {
    chapterSearch =
      event.target.value;

    renderChapters();
  };

  document.getElementById(
    'clearChapterSearch'
  ).onclick = () => {
    chapterSearch = '';

    renderChapters();
  };
}

/**
 * Add or Rename Chapter Form
 *
 * What it does:
 * Opens a popup card to add a new chapter or rename an existing chapter.
 *
 * Backup plan if it breaks:
 * Checks for duplicate names before saving to prevent confusion. If renamed, automatically
 * updates corresponding member records and reports so data stays linked properly.
 */
function chapterModal(id = null) {
  if (denyUnlessAreaAdmin()) return;

  const data = db();

  const chapter = id
    ? data.chapters.find(
      item => String(item.id) === String(id)
    )
    : {};

  openModal(
    id
      ? 'Rename Chapter'
      : 'Add Chapter',

    field(
      'Chapter Name',
      'cName',
      'text',
      chapter?.name || '',
      'required maxlength="100"'
    ),

    async close => {
      const name = document.getElementById('cName').value.trim();

      if (!name) {
        toast('Chapter name is required.', 'error');
        return;
      }

      if (data.chapters.some(item =>
        String(item.id) !== String(id || '') &&
        item.name.toLowerCase() === name.toLowerCase()
      )) {
        toast('That chapter already exists.', 'error');
        return;
      }

      try {
        if (session?.backendAuth && !session?.demo) {
          await backendApi('/api/chapters', {
            method: id ? 'PATCH' : 'POST',
            body: JSON.stringify(id ? { id, name } : { name })
          });
          await refreshAllCloudData({ render: false });
        } else if (id) {
          const oldName = chapter.name;
          chapter.name = name;
          data.members.filter(member => String(member.chapterId) === String(id)).forEach(member => { member.chapterName = name; });
          data.reports.filter(report => report.chapter === oldName).forEach(report => { report.chapter = name; });
          save(data);
        } else {
          data.chapters.push({ id: uid(), name });
          save(data);
        }

        close();
        toast(id ? 'Chapter renamed.' : 'Chapter added.');
        renderChapters();
      } catch (error) {
        toast(error?.message || 'Unable to save the chapter.', 'error');
      }
    }
  );
}

window.editChapter = chapterModal;

/**
 * Delete Chapter
 *
 * What it does:
 * Deletes an empty chapter record after asking for confirmation.
 *
 * Backup plan if it breaks:
 * Safety check: Refuses to delete any chapter that still has youth members in it, protecting
 * member records from accidentally being left orphaned without a chapter.
 */
window.deleteChapter = async id => {
  if (denyUnlessAreaAdmin()) return;

  const data = db();
  if (data.members.some(member => String(member.chapterId) === String(id))) {
    alert('Move or remove members from this chapter before deleting it.');
    return;
  }
  if (!confirm('Delete this chapter?')) return;

  try {
    if (session?.backendAuth && !session?.demo) {
      await backendApi(`/api/chapters?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshAllCloudData({ render: false });
    } else {
      data.chapters = data.chapters.filter(chapter => String(chapter.id) !== String(id));
      save(data);
    }
    toast('Chapter deleted.');
    renderChapters();
  } catch (error) {
    toast(error?.message || 'Unable to delete the chapter.', 'error');
  }
};

/**
 * View Chapter Members List
 *
 * What it does:
 * Opens a modal window listing all youth members assigned to the clicked chapter.
 *
 * Backup plan if it breaks:
 * Prevents unauthorized viewing (Chapter Servants can only view their own chapter) and displays
 * an empty state message if the chapter has no members yet.
 */
window.viewChapter = id => {
  const data = db();

  const chapter =
    data.chapters.find(
      item => String(item.id) === String(id)
    );

  if (!chapter) return;

  if (
    isChapterServantSession() &&
    String(scopedChapter(data)?.id) !== String(chapter.id)
  ) {
    toast('You can only view your assigned chapter.', 'error');
    return;
  }

  const members =
    data.members.filter(
      member =>
        String(member.chapterId) === String(id)
    );

  openModal(
    `${esc(
      chapter.name
    )} Members`,

    members.length
      ? `
        <div class="mini-list">

          ${members
        .map(
          member => `
                <div class="mini-row">

                  <strong>
                    ${esc(
            fullName(
              member
            )
          )}
                  </strong>

                  <span>
                    ${esc(
            member.chapterName ||
            'No Chapter'
          )}
                  </span>

                </div>
              `
        )
        .join('')}

        </div>
      `
      : emptyState(
        'No members',
        'This chapter has no assigned members yet.'
      )
  );
};

/**
 * Add Unassigned Members to Chapter
 *
 * What it does:
 * Opens a checklist of registered youth members in the area who do not belong to any chapter yet,
 * allowing you to select and enroll them into this chapter.
 *
 * Backup plan if it breaks:
 * If all members are already assigned to a chapter, it informs you immediately with an empty state.
 * If saving fails, it alerts you with a clear message and leaves existing chapter assignments unchanged.
 */
window.addMembersToChapter = async id => {
  const data = db();

  const chapter = data.chapters.find(
    item => String(item.id) === String(id)
  );

  if (!chapter) {
    toast('Chapter could not be found.', 'error');
    return;
  }

  if (isChapterServantSession()) {
    const assignedChapter = scopedChapter(data);

    if (!assignedChapter || String(assignedChapter.id) !== String(chapter.id)) {
      toast('You can only add unassigned members to your assigned chapter.', 'error');
      return;
    }
  } else if (!isAreaAdminSession()) {
    toast('You do not have permission to assign chapter members.', 'error');
    return;
  }

  let unassigned = [];

  try {
    if (session?.backendAuth && !session?.demo) {
      const result = await backendApi(
        `/api/chapters/assign-members?chapterId=${encodeURIComponent(chapter.id)}`,
        { timeoutMs: 8000 }
      );

      unassigned = (Array.isArray(result?.members) ? result.members : [])
        .map(row => ({
          id: row.id,
          firstName: row.first_name || '',
          middleName: row.middle_name || '',
          lastName: row.last_name || '',
          email: row.email || '',
          contact: row.contact_number || '',
          status: row.status || 'Active',
          chapterId: null,
          chapterName: '',
          cloudBacked: true
        }))
        .sort((a, b) => fullName(a).localeCompare(fullName(b)));
    } else {
      unassigned = data.members
        .filter(isUnassignedMember)
        .sort((a, b) => fullName(a).localeCompare(fullName(b)));
    }
  } catch (error) {
    toast(error?.message || 'Unable to load unassigned members.', 'error');
    return;
  }

  if (!unassigned.length) {
    openModal(
      `Add Members to ${esc(chapter.name)}`,
      emptyState(
        'No unassigned members',
        'All registered members are already assigned to a chapter.'
      )
    );
    return;
  }

  const memberRows = unassigned
    .map(member => {
      const searchable = [
        member.firstName,
        member.middleName,
        member.lastName,
        member.email,
        member.contact
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return `
        <label
          class="check-row member-check-row"
          data-member-search="${esc(searchable)}"
        >
          <input
            type="checkbox"
            name="chapterMember"
            value="${esc(member.id)}"
          >

          <span>
            <strong>${esc(fullName(member) || 'Unnamed Member')}</strong>
            <small>
              ${esc(member.email || 'No email')}
              ${member.contact ? ` · ${esc(member.contact)}` : ''}
            </small>
          </span>
        </label>
      `;
    })
    .join('');

  openModal(
    `Add Members to ${esc(chapter.name)}`,
    `
      <p class="muted assignment-help">
        Select one or more unassigned members to add to ${esc(chapter.name)} Chapter.
      </p>

      <input
        class="search-input assignment-search"
        id="chapterMemberSearch"
        type="search"
        placeholder="Search unassigned members..."
        autocomplete="off"
      >

      <div class="assignment-list" id="chapterMemberList">
        ${memberRows}
      </div>

      <p class="muted assignment-empty hidden" id="chapterMemberEmpty">
        No unassigned members match your search.
      </p>
    `,
    async close => {
      const selectedIds = [
        ...document.querySelectorAll('input[name="chapterMember"]:checked')
      ].map(input => String(input.value)).filter(Boolean);

      if (!selectedIds.length) {
        toast('Select at least one member.', 'error');
        return;
      }

      try {
        let assignedCount = 0;
        if (session?.backendAuth && !session?.demo) {
          const result = await backendApi('/api/chapters/assign-members', {
            method: 'POST',
            body: JSON.stringify({ chapterId: chapter.id, memberIds: selectedIds })
          });
          assignedCount = Number(result?.assignedCount || 0);
          await refreshAllCloudData({ render: false });
        } else {
          data.members.forEach(member => {
            if (selectedIds.includes(String(member.id)) && isUnassignedMember(member)) {
              member.chapterId = chapter.id;
              member.chapterName = chapter.name;
              assignedCount += 1;
            }
          });
          save(data);
        }

        if (!assignedCount) {
          toast('The selected members are no longer available for assignment.', 'error');
          return;
        }

        close();
        toast(`${assignedCount} member${assignedCount === 1 ? '' : 's'} added to ${chapter.name} Chapter.`);
        renderChapters();
      } catch (error) {
        toast(error?.message || 'Unable to assign the selected members.', 'error');
      }
    },
    'Add Selected Members'
  );

  const searchInput = document.getElementById('chapterMemberSearch');
  const emptyMessage = document.getElementById('chapterMemberEmpty');
  const rows = [
    ...document.querySelectorAll('[data-member-search]')
  ];

  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    let visible = 0;

    rows.forEach(row => {
      const matches = !query ||
        (row.dataset.memberSearch || '').includes(query);

      row.classList.toggle('hidden', !matches);
      if (matches) visible += 1;
    });

    emptyMessage?.classList.toggle('hidden', visible !== 0);
  });
};
