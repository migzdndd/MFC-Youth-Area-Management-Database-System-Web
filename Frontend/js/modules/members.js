/**
 * ============================================================================
 * MFC Youth Area Management System - Members Module & GIG Tracker
 * ============================================================================
 */

// Section 12: Members Module & GIG Contribution Management

let memberFilters = {
  search: '',
  status: 'All',
  chapter: 'All'
};

function getVisibleMembers(data) {
  if (!session) return [];
  
  if (session.role === 'campus_servant') {
    return data.members.filter(m => m.academicTrack === 'SHS' || m.academicTrack === 'College');
  }
  
  if (session.role === 'mfc_high_servant') {
    return data.members.filter(m => m.academicTrack === 'HS');
  }
  
  if (isChapterServantSession()) {
    const chapter = scopedChapter(data);
    if (!chapter) return [];
    return data.members.filter(m => String(m.chapterId) === String(chapter.id));
  }
  
  // For other roles like Area Admin, Couple Coordinator, Area LIT Servant, etc.
  return data.members;
}

function filteredMembers(data) {
  const visible = getVisibleMembers(data);
  return visible.filter(member => {
    const haystack = `
      ${member.firstName}
      ${member.middleName || ''}
      ${member.lastName}
      ${member.email || ''}
      ${member.contact || ''}
      ${member.chapterName || ''}
      ${(member.services || []).join(' ')}
    `.toLowerCase();

    if (
      !haystack.includes(
        memberFilters.search.toLowerCase()
      )
    ) {
      return false;
    }

    if (
      memberFilters.status !== 'All' &&
      member.status !== memberFilters.status
    ) {
      return false;
    }

    if (
      memberFilters.chapter !== 'All' &&
      member.chapterName !==
      memberFilters.chapter
    ) {
      return false;
    }

    return true;
  });
}


function renderChapterServantMembers(data) {
  const chapter = scopedChapter(data);

  if (!chapter) {
    content.innerHTML =
      pageHeader(
        'Members',
        'Your account is not assigned to a chapter yet.'
      ) +
      emptyState(
        'No chapter assignment',
        'Ask an Area Servant, Area LIT Servant, Campus Servant, Area Kids Servant, or Couple Coordinator to assign your account to a chapter.'
      );
    return;
  }

  const chapterMembers = data.members
    .filter(member => String(member.chapterId) === String(chapter.id));

  const list = chapterMembers.filter(member => {
    const haystack = `
      ${member.firstName || ''}
      ${member.middleName || ''}
      ${member.lastName || ''}
      ${member.email || ''}
      ${member.contact || ''}
      ${(member.services || []).join(' ')}
    `.toLowerCase();

    if (!haystack.includes(memberFilters.search.toLowerCase())) {
      return false;
    }

    if (
      memberFilters.status !== 'All' &&
      member.status !== memberFilters.status
    ) {
      return false;
    }

    return true;
  });

  content.innerHTML =
    pageHeader(
      'Members',
      `View members and add new member records for ${esc(chapter.name)} Chapter. Existing records remain view-only for Chapter Servants.`,
      `
        <button class="btn blue" id="addChapterMember" type="button">
          + Add Member
        </button>
        <span class="scope-chip">${esc(chapter.name)} Chapter · View + Add</span>
      `
    ) +
    `
    <div class="toolbar">
      <div class="grow">
        <input
          class="search-input"
          id="memberSearch"
          placeholder="Search ${esc(chapter.name)} members..."
          value="${esc(memberFilters.search)}"
        >
      </div>

      <select
        class="select-input compact-filter"
        id="memberStatus"
      >
        <option>All</option>
        <option ${memberFilters.status === 'Active' ? 'selected' : ''}>Active</option>
        <option ${memberFilters.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
      </select>

      <button class="btn" id="clearMemberFilters">Clear</button>
    </div>

    <div class="result-count">
      Showing ${list.length} of ${chapterMembers.length}
      ${esc(chapter.name)} member${chapterMembers.length === 1 ? '' : 's'}
    </div>

    <section class="card table-wrap">
      ${list.length
        ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Services</th>
                <th>Contact Number</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(member => `
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
                  <td>${esc(member.contact || '—')}</td>
                  <td class="actions-cell">
                    <button class="btn" onclick='viewMember(${inlineJsArg(member.id)})'>View</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
        : emptyState(
            'No matching members',
            chapterMembers.length
              ? 'Change or clear the filters to see other chapter members.'
              : 'This chapter does not have assigned members yet.'
          )
      }
    </section>
  `;

  document.getElementById('addChapterMember').onclick = () => memberModal();

  document.getElementById('memberSearch').oninput = event => {
    memberFilters.search = event.target.value;
    renderMembers();
  };

  document.getElementById('memberStatus').onchange = event => {
    memberFilters.status = event.target.value;
    renderMembers();
  };

  document.getElementById('clearMemberFilters').onclick = () => {
    memberFilters.search = '';
    memberFilters.status = 'All';
    memberFilters.chapter = 'All';
    renderMembers();
  };
}

function renderMembers() {
  const data = db();

  if (isChapterServantSession()) {
    renderChapterServantMembers(data);
    return;
  }

  const list =
    filteredMembers(data);

  content.innerHTML =
    pageHeader(
      'Members',
      'Manage registered MFC Youth members, chapter assignments, services, and GIG records.',
      `
        <button
          class="btn blue"
          id="addMember"
        >
          + Add Member
        </button>
      `
    ) +
    `
    <div class="toolbar">

      <div class="grow">
        <input
          class="search-input"
          id="memberSearch"
          placeholder="Search members, email, contact, chapter, or service..."
          value="${esc(
      memberFilters.search
    )}"
        >
      </div>

      <select
        class="select-input compact-filter"
        id="memberStatus"
      >
        <option>
          All
        </option>

        <option
          ${memberFilters.status ===
      'Active'
      ? 'selected'
      : ''
    }
        >
          Active
        </option>

        <option
          ${memberFilters.status ===
      'Inactive'
      ? 'selected'
      : ''
    }
        >
          Inactive
        </option>
      </select>

      <select
        class="select-input compact-filter"
        id="memberChapter"
      >
        <option>
          All
        </option>

        ${data.chapters
      .map(
        chapter => `
              <option
                ${memberFilters.chapter ===
            chapter.name
            ? 'selected'
            : ''
          }
              >
                ${esc(
            chapter.name
          )}
              </option>
            `
      )
      .join('')}
      </select>

      <button
        class="btn"
        id="clearMemberFilters"
      >
        Clear
      </button>

    </div>

    <div class="result-count">
      Showing
      ${list.length}
      of
      ${getVisibleMembers(data).length}
      member${getVisibleMembers(data).length === 1
      ? ''
      : 's'}
    </div>

    <section class="card table-wrap">

      ${list.length
      ? `
            <table class="data-table">

              <thead>
                <tr>
                  <th>Member</th>
                  <th>Chapter</th>
                  <th>Status</th>
                  <th>Services</th>
                  <th>Access</th>
                  <th>Contact Number</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${list
        .map(
          member => `
                      <tr>

                        <td>
                          <strong>
                            ${esc(
            fullName(
              member
            )
          )}
                          </strong>

                          <div
                            class="muted"
                          >
                            ${esc(
            member.email ||
            'No email'
          )}
                          </div>
                        </td>

                        <td>
                          ${esc(
            member.chapterName ||
            '—'
          )}
                        </td>

                        <td>
                          <span
                            class="badge ${member.status ===
              'Active'
              ? 'active'
              : 'inactive'}"
                          >
                            ${esc(
              member.status ||
              'Active'
            )}
                          </span>
                        </td>

                        <td>
                          ${esc(
              (
                member.services ||
                []
              ).join(
                ', '
              ) ||
              'No Service Assigned'
            )}
                        </td>

                        <td>
                          ${esc(accessRoleLabel(member.accessLevel))}
                        </td>

                        <td>
                          ${esc(
              member.contact ||
              '—'
            )}
                        </td>

                        <td
                          class="actions-cell"
                        >
                          <button
                            class="btn"
                            onclick='viewMember(${inlineJsArg(member.id)})'
                          >
                            View
                          </button>

                          <button
                            class="btn"
                            onclick='editMember(${inlineJsArg(member.id)})'
                          >
                            Edit
                          </button>

                          <button
                            class="btn"
                            onclick='serviceMember(${inlineJsArg(member.id)})'
                          >
                            Services
                          </button>

                          <button
                            class="btn"
                            onclick='gigMember(${inlineJsArg(member.id)})'
                          >
                            GIG
                          </button>

                          ${isOwnMemberRecord(member)
                            ? `
                              <span
                                class="badge active"
                                title="Your own member record cannot be deleted from the Members tab."
                              >
                                Your Account
                              </span>
                            `
                            : `
                              <button
                                class="btn red"
                                onclick='deleteMember(${inlineJsArg(member.id)})'
                              >
                                Delete
                              </button>
                            `}
                        </td>

                      </tr>
                    `
        )
        .join('')}

              </tbody>

            </table>
          `
      : emptyState(
        'No matching members',
        getVisibleMembers(data).length
          ? 'Change or clear the filters to see other members.'
          : 'Add the first MFC Youth member to begin managing your Area.'
      )
    }

    </section>
  `;

  document.getElementById(
    'addMember'
  ).onclick = () => memberModal();

  document.getElementById(
    'memberSearch'
  ).oninput = event => {
    memberFilters.search =
      event.target.value;

    renderMembers();
  };

  document.getElementById(
    'memberStatus'
  ).onchange = event => {
    memberFilters.status =
      event.target.value;

    renderMembers();
  };

  document.getElementById(
    'memberChapter'
  ).onchange = event => {
    memberFilters.chapter =
      event.target.value;

    renderMembers();
  };

  document.getElementById(
    'clearMemberFilters'
  ).onclick = () => {
    memberFilters = {
      search: '',
      status: 'All',
      chapter: 'All'
    };

    renderMembers();
  };
}

window.viewMember = function(id) {
  const data = db();

  const member = data.members.find(
    item => String(item.id) === String(id)
  );

  if (!member) return;

  if (
    isChapterServantSession() &&
    !canManageOwnChapterMember(data, member)
  ) {
    toast('You can only view members assigned to your chapter.', 'error');
    return;
  }

  const rows = data.gig
    .filter(item => String(item.memberId) === String(id))
    .sort((a, b) => parseEventTimestamp(b.date) - parseEventTimestamp(a.date));

  const totalContributions = rows.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const age = calculateAge(member.birthDate);
  const services = Array.isArray(member.services)
    ? member.services.filter(Boolean).map(String)
    : [];

  const chapterLabel = member.chapterName && String(member.chapterName).trim()
    ? member.chapterName
    : 'No Chapter Assigned';

  const addressLabel = member.address && String(member.address).trim()
    ? member.address
    : 'No Address Provided';

  const serviceList = services.length
    ? `
      <ul class="detail-list">
        ${services
          .map(
            service =>
              `<li class="detail-list-item"><span class="detail-pill">${esc(service)}</span></li>`
          )
          .join('')}
      </ul>
    `
    : '<span class="muted">No Services Assigned</span>';

  const gigHistory = rows.length
    ? `
      <div class="detail-history">
        ${rows
          .map(
            row => `
              <div class="detail-history-item">
                <div class="detail-history-head">
                  <span>${esc(fmtDate(row.date))}</span>
                  <strong>${esc(money(row.amount || 0))}</strong>
                </div>
                <div class="detail-history-note">${esc(row.note || '—')}</div>
              </div>
            `
          )
          .join('')}
      </div>
    `
    : '<span class="muted">No GIG contributions recorded.</span>';

  openModal(
    'Member Details',
    `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Full Name</span>
          <div class="detail-value">${esc(fullName(member) || '—')}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Status</span>
          <div class="detail-value">${esc(member.status || 'Active')}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">First Name</span>
          <div class="detail-value">${esc(member.firstName || '—')}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Middle Name</span>
          <div class="detail-value">${esc(member.middleName || '—')}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Last Name</span>
          <div class="detail-value">${esc(member.lastName || '—')}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Current Age</span>
          <div class="detail-value">${age === null ? '—' : esc(String(age))}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Birth Date</span>
          <div class="detail-value">${esc(fmtDate(member.birthDate))}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">First Attended Youth Camp</span>
          <div class="detail-value">${esc(fmtDate(member.firstAttendedYouthCamp))}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Contact Number</span>
          <div class="detail-value">${esc(member.contact || '—')}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Email Address</span>
          <div class="detail-value">
            ${member.email && String(member.email).trim()
              ? `<a href="mailto:${esc(member.email)}">${esc(member.email)}</a>`
              : '<span class="muted">No Email Provided</span>'}
          </div>
        </div>

        <div class="detail-item">
          <span class="detail-label">System Access</span>
          <div class="detail-value">${esc(accessRoleLabel(member.accessLevel))}</div>
        </div>

        <div class="detail-item">
          <span class="detail-label">Chapter</span>
          <div class="detail-value">${esc(chapterLabel)}</div>
        </div>

        <div class="detail-item full">
          <span class="detail-label">Address</span>
          <div class="detail-value">${esc(addressLabel)}</div>
        </div>

        <div class="detail-item full">
          <span class="detail-label">Assigned Services</span>
          <div class="detail-value">${serviceList}</div>
        </div>

        <div class="detail-item full">
          <span class="detail-label">Total GIG Contributions</span>
          <div class="detail-value">
            <div class="detail-total">${esc(money(totalContributions))}</div>
            <div class="detail-section-label">GIG contribution history</div>
            ${gigHistory}
          </div>
        </div>
      </div>
    `
  );
};

function memberModal(id = null) {
  if (id) {
    if (denyUnlessAreaAdmin()) return;
  } else if (!isAreaAdminSession() && !isChapterServantSession()) {
    toast('Only Area-level servant accounts and Chapter Servants can add members.', 'error');
    return;
  }

  const data = db();

  const chapterServantChapter = isChapterServantSession()
    ? scopedChapter(data)
    : null;

  if (!id && isChapterServantSession() && !chapterServantChapter) {
    toast('Your account is not assigned to a chapter.', 'error');
    return;
  }

  const member = id
    ? data.members.find(
      item => String(item.id) === String(id)
    )
    : {};

  const body = `
    <div class="form-grid">

      ${field(
    'First Name',
    'mFirst',
    'text',
    member.firstName || '',
    'required maxlength="60"'
  )}

      ${field(
    'Middle Name (optional)',
    'mMiddle',
    'text',
    member.middleName || '',
    'maxlength="60"'
  )}

      ${field(
    'Last Name',
    'mLast',
    'text',
    member.lastName || '',
    'required maxlength="60"'
  )}

      ${field(
    'Birth Date',
    'mBirth',
    'date',
    member.birthDate || '',
    `required max="${todayISO()}"`
  )}

      ${field(
    'First Attended Youth Camp',
    'mFirstYouthCamp',
    'date',
    member.firstAttendedYouthCamp || '',
    `max="${todayISO()}"`
  )}

      ${field(
    'Contact Number',
    'mContact',
    'tel',
    member.contact || '',
    'maxlength="11" inputmode="numeric" placeholder="09XXXXXXXXX" required'
  )}

      ${field(
    'Email Address',
    'mEmail',
    'email',
    member.email || '',
    'required autocomplete="email"'
  )}

      ${selectField(
    'Status',
    'mStatus',
    [
      'Active',
      'Inactive'
    ],
    member.status ||
    'Active'
  )}

      <div class="form-group">
        <label for="mAccessLevel">
          System Access Level
        </label>

        ${isChapterServantSession() && !id
          ? `
            <input
              class="text-input"
              id="mAccessLevelDisplay"
              type="text"
              value="Member"
              readonly
              aria-readonly="true"
            >
            <input id="mAccessLevel" type="hidden" value="member">
            <small class="field-help">
              Chapter Servants can create member accounts, but only Area-level servant accounts can grant elevated system access.
            </small>
          `
          : `
            <select
              class="select-input"
              id="mAccessLevel"
            >
              ${ACCESS_LEVELS
                .map(level => `
                  <option
                    value="${level.value}"
                    ${normalizeAccessRole(member.accessLevel || 'member') === level.value ? 'selected' : ''}
                  >
                    ${esc(level.label)}
                  </option>
                `)
                .join('')}
            </select>
            <small class="field-help">
              Chapter Servants are automatically scoped to the chapter selected below.
            </small>
          `}
      </div>

      <div class="form-group">

        <label for="mChapter">
          Chapter
        </label>

        <select
          class="select-input"
          id="mChapter"
        >

          ${chapterServantChapter ? '' : `
            <option value="">
              No Chapter
            </option>
          `}

          ${(chapterServantChapter ? [chapterServantChapter] : data.chapters)
      .map(
        chapter => `
                <option
                  value="${chapter.id}"
                  ${String(member.chapterId) ===
            String(chapter.id)
            ? 'selected'
            : ''
          }
                >
                  ${esc(
            chapter.name
          )}
                </option>
              `
      )
      .join('')}

        </select>

      </div>

      <div class="form-group full">
        <label for="mAcademicTrack">Academic Track</label>
        <select class="select-input" id="mAcademicTrack">
          <option value="">Select Academic Track</option>
          <option value="High School (HS)" ${member.academicTrack === 'High School (HS)' ? 'selected' : ''}>High School (HS)</option>
          <option value="Senior High School (SHS)" ${member.academicTrack === 'Senior High School (SHS)' ? 'selected' : ''}>Senior High School (SHS)</option>
          <option value="College" ${member.academicTrack === 'College' ? 'selected' : ''}>College</option>
          <option value="Graduated" ${member.academicTrack === 'Graduated' ? 'selected' : ''}>Graduated</option>
        </select>
      </div>

      <div class="form-group full">
        <label for="mGradeLevel">Grade / Year Level</label>
        <select class="select-input" id="mGradeLevel">
          <option value="">Select Grade Level</option>
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(n => `<option value="${n}" ${String(member.gradeLevel) === String(n) ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>

      ${field(
        'School',
        'mSchool',
        'text',
        member.school || '',
        'maxlength="100"'
      )}

      <div
        class="form-group full"
      >

        <label for="mAddress">
          Address
        </label>

        <textarea
          class="textarea-input"
          id="mAddress"
          maxlength="250"
        >${esc(
        member.address || ''
      )}</textarea>

      </div>

    </div>
  `;

  openModal(
    id
      ? 'Edit Member'
      : 'Add Member',

    body,

    async close => {
      const firstName =
        document
          .getElementById('mFirst')
          .value.trim();

      const lastName =
        document
          .getElementById('mLast')
          .value.trim();

      const birthDate =
        document.getElementById(
          'mBirth'
        ).value;

      const contact =
        document
          .getElementById('mContact')
          .value.trim();

      const email =
        document
          .getElementById('mEmail')
          .value.trim()
          .toLowerCase();

      if (
        !firstName ||
        !lastName ||
        !birthDate ||
        !email
      ) {
        toast(
          'First name, last name, birth date, and email address are required.',
          'error'
        );

        return;
      }

      if (
        birthDate > todayISO()
      ) {
        toast(
          'Birth date cannot be in the future.',
          'error'
        );

        return;
      }

      const firstAttendedYouthCamp =
        document.getElementById(
          'mFirstYouthCamp'
        ).value;

      if (
        firstAttendedYouthCamp &&
        firstAttendedYouthCamp > todayISO()
      ) {
        toast(
          'First Attended Youth Camp cannot be in the future.',
          'error'
        );

        return;
      }

      if (
        !/^\d{11}$/.test(
          contact
        )
      ) {
        toast(
          'Contact number must be exactly 11 digits.',
          'error'
        );

        return;
      }

      if (
        !validEmail(email)
      ) {
        toast(
          'Enter a valid email address.',
          'error'
        );

        return;
      }

      if (
        data.members.some(
          item =>
            String(item.id) !== String(id || '') &&
            item.contact === contact
        )
      ) {
        toast(
          'That contact number is already assigned to another member.',
          'error'
        );

        return;
      }

      if (
        email &&
        data.members.some(
          item =>
            String(item.id) !== String(id || '') &&
            (
              item.email || ''
            ).toLowerCase() ===
            email
        )
      ) {
        toast(
          'That email address is already assigned to another member.',
          'error'
        );

        return;
      }

      const chapterId = document.getElementById('mChapter').value || null;

      const chapter = data.chapters.find(
        item => String(item.id) === String(chapterId || '')
      );

      if (
        !id &&
        isChapterServantSession() &&
        (!chapterServantChapter || String(chapterId || '') !== String(chapterServantChapter.id))
      ) {
        toast('You can only add members to your assigned chapter.', 'error');
        return;
      }

      const accessLevel =
        !id && isChapterServantSession()
          ? 'member'
          : normalizeAccessRole(
              document.getElementById(
                'mAccessLevel'
              ).value
            );

      if (
        accessLevel === 'chapter_servant' &&
        !chapter
      ) {
        toast(
          'A Chapter Servant must be assigned to a chapter.',
          'error'
        );

        return;
      }

      const record = {
        id:
          id ||
          uid(),

        firstName,

        middleName:
          document
            .getElementById(
              'mMiddle'
            )
            .value.trim(),

        lastName,

        birthDate,

        firstAttendedYouthCamp,

        contact,

        email,

        status:
          document.getElementById(
            'mStatus'
          ).value,

        accessLevel,

        chapterId,

        chapterName:
          chapter?.name || '',

        academicTrack: document.getElementById('mAcademicTrack').value,
        gradeLevel: document.getElementById('mGradeLevel').value,
        school: document.getElementById('mSchool').value.trim(),

        address:
          document
            .getElementById(
              'mAddress'
            )
            .value.trim(),

        services:
          member.services || []
      };

      let savedRecord = record;

      if (session?.backendAuth && !session?.demo) {
        const originalEmail = String(member?.email || '').trim().toLowerCase();
        const emailChanged = Boolean(id && email && email !== originalEmail);

        if (emailChanged && isOwnMemberRecord(member)) {
          toast('Use Account Security to change your own sign-in email so the secure confirmation flow is preserved.', 'error');
          return;
        }

        if (emailChanged && isAreaAdminSession()) {
          try {
            await backendApi('/api/admin/members/change-email', {
              method: 'POST',
              body: JSON.stringify({ id, newEmail: email })
            });
          } catch (error) {
            if (error?.body?.code !== 'ACCOUNT_NOT_PROVISIONED') {
              toast(error?.message || 'Unable to update the member account email.', 'error');
              return;
            }
            // The Member record has no Auth account yet. It is safe to update
            // only public.members; no portal account is created implicitly.
          }
        }

        try {
          const payload = await backendApi('/api/members', {
            method: id ? 'PATCH' : 'POST',
            body: JSON.stringify({
              ...(id ? { id } : {}),
              firstName: record.firstName,
              middleName: record.middleName,
              lastName: record.lastName,
              birthDate: record.birthDate || null,
              firstAttendedYouthCamp: record.firstAttendedYouthCamp || null,
              contactNumber: record.contact || null,
              email: record.email,
              status: record.status,
              accessLevel: record.accessLevel,
              chapterId: record.chapterId || null,
              academicTrack: record.academicTrack || null,
              gradeLevel: record.gradeLevel || null,
              school: record.school || null,
              address: record.address || null
            })
          });

          savedRecord = cloudMemberToLocal(payload.member, record);

          const existingIndex = data.members.findIndex(item =>
            String(item.id) === String(savedRecord.id) ||
            (savedRecord.email && String(item.email || '').trim().toLowerCase() === savedRecord.email)
          );
          if (existingIndex >= 0) data.members[existingIndex] = savedRecord;
          else data.members.push(savedRecord);

          if (id && String(savedRecord.id) === String(session?.memberId || '')) {
            Object.assign(session, {
              memberId: savedRecord.id,
              name: fullName(savedRecord),
              firstName: savedRecord.firstName || '',
              lastName: savedRecord.lastName || '',
              email: savedRecord.email || session.email,
              role: normalizeAccessRole(savedRecord.accessLevel || session.role),
              chapterId: savedRecord.chapterId ?? null
            });
            updateStoredSession(session);
          }
        } catch (error) {
          toast(error?.message || 'Unable to save this member to Supabase.', 'error');
          return;
        }
      } else if (id) {
        Object.assign(
          data.members.find(item => String(item.id) === String(id)),
          record
        );

      } else {
        data.members.push(record);
      }

      save(data);

      close();

      toast(
        id
          ? 'Member updated.'
          : 'Member added.'
      );

      renderMembers();
    }
  );
}

window.editMember = memberModal;
window.manageAccount = memberModal;
window.assignChapter = memberModal;

window.deleteMember = async id => {
  if (denyUnlessAreaAdmin()) return;

  const data = db();
  const member = data.members.find(item => String(item.id) === String(id));
  if (!member) return;

  if (isOwnMemberRecord(member)) {
    toast('You cannot delete your own member record from the Members tab. Use Delete Account only if you intend to permanently remove your account.', 'error');
    return;
  }

  if (!confirm('Delete this member and their GIG contribution records? This cannot be undone.')) return;

  if (member.cloudBacked && session?.backendAuth && !session?.demo) {
    try {
      await backendApi(`/api/members?id=${encodeURIComponent(member.id)}`, { method: 'DELETE' });
      await refreshAllCloudData({ render: false });
    } catch (error) {
      toast(error?.message || 'Unable to delete this member from Supabase.', 'error');
      return;
    }
  } else {
    data.members = data.members.filter(item => String(item.id) !== String(id));
    data.gig = data.gig.filter(item => String(item.id) !== String(id));
    data.participants = data.participants.filter(item => String(item.id) !== String(id));
    save(data);
  }

  if (String(session?.memberId || '') === String(id)) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    navigateWithLoader('/', true);
    return;
  }

  toast('Member deleted.');
  renderMembers();
};

window.serviceMember = id => {
  if (denyUnlessAreaAdmin()) return;

  const data = db();

  const member =
    data.members.find(
      item => String(item.id) === String(id)
    );

  if (!member) return;

  const currentService = Array.isArray(member.services) && member.services.length
    ? member.services[0]
    : '';

  let availableServices = data.services;
  if (session?.role === 'lit_servant') {
    availableServices = ['Music', 'Dance', 'Creative Writing', 'Graphics & Promo', 'Photography & Videography'];
  }

  const checks =
    availableServices
      .map(
        service => `
          <label
            class="check-row"
          >
            <input
              type="radio"
              name="serviceAssignment"
              value="${esc(service)}"
              ${currentService === service ? 'checked' : ''}
            >

            ${esc(service)}
          </label>
        `
      )
      .join('');

  openModal(
    `Assign Service - ${esc(
      fullName(member)
    )}`,

    `
      <div
        class="check-grid"
        id="serviceChecks"
      >
        ${checks}
      </div>
    `,

    async close => {
      const selectedService = document.querySelector(
        '#serviceChecks input[name="serviceAssignment"]:checked'
      )?.value || '';
      const selectedServices = selectedService ? [selectedService] : [];

      try {
        if (session?.backendAuth && !session?.demo) {
          await backendApi('/api/services', {
            method: 'PATCH',
            body: JSON.stringify({ memberId: member.id, serviceNames: selectedServices })
          });
          await refreshAllCloudData({ render: false });
        } else {
          member.services = selectedServices;
          save(data);
        }

        close();
        toast('Service updated.');
        renderMembers();
      } catch (error) {
        toast(error?.message || 'Unable to update services.', 'error');
      }
    }
  );
};

window.gigMember = id => {
  const data = db();

  const member =
    data.members.find(
      item => String(item.id) === String(id)
    );

  if (!member) return;

  if (!canManageOwnChapterMember(data, member)) {
    toast('You can only manage GIG records for members in your assigned chapter.', 'error');
    return;
  }

  const rows =
    data.gig
      .filter(
        item =>
          String(item.memberId) === String(id)
      )
      .sort(
        (a, b) =>
          parseEventTimestamp(b.date) -
          parseEventTimestamp(a.date)
      );

  const history =
    rows.length
      ? `
        <div
          class="mini-list gig-history"
        >
          ${rows
        .map(
          row => `
                <div
                  class="mini-row"
                >
                  <span>
                    ${fmtDate(
            row.date
          )}
                    —
                    ${esc(
            row.note ||
            'Contribution'
          )}
                  </span>

                  <span
                    class="inline-actions"
                  >
                    <strong>
                      ${money(
            row.amount
          )}
                    </strong>

                    <button
                      class="mini-delete"
                      type="button"
                      onclick='deleteGigContribution(${inlineJsArg(id)}, ${inlineJsArg(row.id)})'
                      aria-label="Delete contribution"
                    >
                      ×
                    </button>
                  </span>
                </div>
              `
        )
        .join('')}
        </div>
      `
      : `
        <p class="muted">
          No GIG contributions recorded yet.
        </p>
      `;

  openModal(
    `GIG Tracker - ${esc(
      fullName(member)
    )}`,

    `
      <div class="form-grid">

        ${field(
      'Contribution Date',
      'gDate',
      'date',
      todayISO(),
      `max="${todayISO()}"`
    )}

        ${field(
      'Amount',
      'gAmount',
      'number',
      '',
      'min="0.01" step="0.01" placeholder="0.00"'
    )}

        <div
          class="form-group full"
        >
          <label for="gNote">
            Note (optional)
          </label>

          <input
            class="text-input"
            id="gNote"
            maxlength="120"
          >
        </div>

      </div>

      <div class="modal-section">

        <strong>
          Total Contributions:
          ${money(
      rows.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      )
    )}
        </strong>

        ${history}

      </div>
    `,

    async close => {
      const amount = Number(document.getElementById('gAmount').value);
      const date = document.getElementById('gDate').value;
      const note = document.getElementById('gNote').value.trim();

      if (!date || amount <= 0) {
        toast('Enter a valid contribution date and amount.', 'error');
        return;
      }

      try {
        if (session?.backendAuth && !session?.demo) {
          await backendApi('/api/gig', {
            method: 'POST',
            body: JSON.stringify({ memberId: id, date, amount, note })
          });
          await refreshAllCloudData({ render: false });
        } else {
          data.gig.push({ id: uid(), memberId: id, date, amount, note });
          save(data);
        }

        close();
        toast('GIG contribution added.');
        renderMembers();
      } catch (error) {
        toast(error?.message || 'Unable to save the GIG contribution.', 'error');
      }
    },

    'Add Contribution'
  );
};

window.deleteGigContribution = async (memberId, contributionId) => {
  const accessData = db();
  const accessMember = accessData.members.find(member => String(member.id) === String(memberId));

  if (!canManageOwnChapterMember(accessData, accessMember)) {
    toast('You can only manage GIG records for members in your assigned chapter.', 'error');
    return;
  }
  if (!confirm('Delete this GIG contribution?')) return;

  try {
    if (session?.backendAuth && !session?.demo) {
      await backendApi(`/api/gig?id=${encodeURIComponent(contributionId)}`, { method: 'DELETE' });
      await refreshAllCloudData({ render: false });
    } else {
      const data = db();
      data.gig = data.gig.filter(item => String(item.id) !== String(contributionId));
      save(data);
    }

    toast('Contribution deleted.');
    activeModalCleanup?.();
    window.gigMember(memberId);
  } catch (error) {
    toast(error?.message || 'Unable to delete the contribution.', 'error');
  }
};
