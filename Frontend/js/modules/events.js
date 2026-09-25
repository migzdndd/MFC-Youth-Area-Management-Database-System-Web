/**
 * ============================================================================
 * MFC Youth Area Management System - Events Module & Participant Attendance
 * ============================================================================
 */

// Section 17: Events & Attendance Tracking Module

let eventFilters = {
  search: '',
  timing: 'All'
};

function filteredEvents(data) {
  const now =
    Date.now();

  const filtered = data.events
    .filter(event => {
      const match = `
        ${event.name || ''}
        ${event.venue || ''}
        ${event.description || ''}
      `
        .toLowerCase()
        .includes(
          eventFilters.search.toLowerCase()
        );

      if (!match) {
        return false;
      }

      const time =
        new Date(
          event.date
        ).getTime();

      if (
        eventFilters.timing ===
        'Upcoming' &&
        time < now
      ) {
        return false;
      }

      if (
        eventFilters.timing ===
        'Past' &&
        time >= now
      ) {
        return false;
      }

      return true;
    });

  return filtered.sort((a, b) => {
    const aTime = parseEventTimestamp(a.date);
    const bTime = parseEventTimestamp(b.date);

    return eventFilters.timing === 'Upcoming'
      ? aTime - bTime
      : bTime - aTime;
  });
}

function eventAttendance(
  data,
  event
) {
  const participants =
    data.participants.filter(
      participant =>
        String(participant.eventId) ===
        String(event.id)
    );

  const attended =
    participants.filter(
      participant =>
        participant.attended
    ).length;

  return participants.length
    ? attended
    : Number(
      event.peopleAttended ||
      0
    );
}

function renderEvents() {
  const data = db();

  const canManage = isAreaAdminSession();

  const list =
    filteredEvents(data);

  const now =
    Date.now();

  content.innerHTML =
    pageHeader(
      'Events',
      canManage
        ? 'Manage Area events, participant registration, payment status, and attendance.'
        : 'View Area events. Chapter Servants have read-only event access.',
      canManage
        ? `
          <button
            class="btn blue"
            id="addEvent"
          >
            + Add Event
          </button>
        `
        : `<span class="scope-chip">View Only</span>`
    ) +
    `
    <div class="toolbar">

      <div class="grow">
        <input
          class="search-input"
          id="eventSearch"
          placeholder="Search events or venues..."
          value="${esc(
      eventFilters.search
    )}"
        >
      </div>

      <select
        class="select-input compact-filter"
        id="eventTiming"
      >
        <option>
          All
        </option>

        <option
          ${eventFilters.timing ===
      'Upcoming'
      ? 'selected'
      : ''
    }
        >
          Upcoming
        </option>

        <option
          ${eventFilters.timing ===
      'Past'
      ? 'selected'
      : ''
    }
        >
          Past
        </option>
      </select>

      <button
        class="btn"
        id="clearEventFilters"
      >
        Clear
      </button>

    </div>

    <div class="result-count">
      Showing
      ${list.length}
      of
      ${data.events.length}
      event${data.events.length === 1
      ? ''
      : 's'
    }
    </div>

    <section
      class="card table-wrap"
    >

      ${list.length
      ? `
            <table class="data-table">

              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Registered</th>
                  <th>Attended</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${list
        .map(
          event => {
            const participants =
              data.participants.filter(
                participant =>
                  String(participant.eventId) ===
                  String(event.id)
              );

            const upcoming =
              new Date(
                event.date
              ).getTime() >=
              now;

            return `
                        <tr>

                          <td>
                            ${fmtDateTime(
              event.date
            )}
                          </td>

                          <td>
                            <strong>
                              ${esc(
              event.name
            )}
                            </strong>
                          </td>

                          <td>
                            ${esc(
              event.venue ||
              '—'
            )}
                          </td>

                          <td>
                            <span
                              class="badge ${upcoming
                ? 'pending'
                : 'active'
              }"
                            >
                              ${upcoming
                ? 'Upcoming'
                : 'Completed'
              }
                            </span>
                          </td>

                          <td>
                            ${Number(
                event.fee
              ) > 0
                ? money(
                  event.fee
                )
                : 'Free'
              }
                          </td>

                          <td>
                            ${participants.length}
                          </td>

                          <td>
                            ${eventAttendance(
                data,
                event
              )}
                          </td>

                          <td
                            class="actions-cell"
                          >
                            <button
                              class="btn"
                              onclick='viewEvent(${inlineJsArg(event.id)})'
                            >
                              View
                            </button>

                            ${canManage
                              ? `
                                <button
                                  class="btn"
                                  onclick='eventModal(${inlineJsArg(event.id)})'
                                >
                                  Edit
                                </button>

                                <button
                                  class="btn red"
                                  onclick='deleteEvent(${inlineJsArg(event.id)})'
                                >
                                  Delete
                                </button>
                              `
                              : ''
                            }
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
        'No matching events',
        data.events.length
          ? 'Change or clear the event filters.'
          : 'Add your first Area event.'
      )
    }

    </section>
  `;

  const addEventButton =
    document.getElementById(
      'addEvent'
    );

  if (addEventButton) {
    addEventButton.onclick = () =>
      eventModal();
  }

  document.getElementById(
    'eventSearch'
  ).oninput = event => {
    eventFilters.search =
      event.target.value;

    renderEvents();
  };

  document.getElementById(
    'eventTiming'
  ).onchange = event => {
    eventFilters.timing =
      event.target.value;

    renderEvents();
  };

  document.getElementById(
    'clearEventFilters'
  ).onclick = () => {
    eventFilters = {
      search: '',
      timing: 'All'
    };

    renderEvents();
  };
}

window.eventModal = function (
  id = null
) {
  if (denyUnlessAreaAdmin('Only Area-level servant accounts can create or edit Area events.')) return;

  const data = db();

  const event = id
    ? data.events.find(
      item => String(item.id) === String(id)
    )
    : {};

  const body = `
    <div class="form-grid">

      ${field(
    'Event Name',
    'eName',
    'text',
    event?.name || '',
    'required maxlength="120"'
  )}

      ${field(
    'Date & Time',
    'eDate',
    'datetime-local',
    event?.date || '',
    'required'
  )}

      ${field(
    'Registration Fee',
    'eFee',
    'number',
    event?.fee || 0,
    'min="0" step="0.01"'
  )}

      ${field(
    'Venue',
    'eVenue',
    'text',
    event?.venue || '',
    'maxlength="150"'
  )}

      ${field(
    'Manual Attendance (fallback)',
    'eAttended',
    'number',
    event?.peopleAttended ||
    0,
    'min="0" step="1"'
  )}

      <div class="form-group">

        <label for="eDescription">
          Event Description
        </label>

        <textarea
          class="textarea-input"
          id="eDescription"
          maxlength="1000"
        >${esc(
    event?.description ||
    ''
  )}</textarea>

        <small
          class="field-help"
        >
          Manual attendance is used only when the event has no registered participant records.
        </small>

      </div>

    </div>
  `;

  openModal(
    id
      ? 'Edit Event'
      : 'Add Event',

    body,

    async close => {
      const name = document.getElementById('eName').value.trim();
      const date = document.getElementById('eDate').value;
      const attendance = Number(document.getElementById('eAttended').value || 0);

      if (!name || !date) {
        toast('Event name and date are required.', 'error');
        return;
      }
      if (!Number.isInteger(attendance) || attendance < 0) {
        toast('Manual attendance must be a whole number of zero or more.', 'error');
        return;
      }

      const record = {
        id: id || uid(),
        name,
        date,
        fee: Number(document.getElementById('eFee').value || 0),
        venue: document.getElementById('eVenue').value.trim(),
        peopleAttended: attendance,
        description: document.getElementById('eDescription').value.trim()
      };

      try {
        if (session?.backendAuth && !session?.demo) {
          await backendApi('/api/events', {
            method: id ? 'PATCH' : 'POST',
            body: JSON.stringify({ ...record, id: id || undefined })
          });
          await refreshAllCloudData({ render: false });
        } else if (id) {
          const target = data.events.find(item => String(item.id) === String(id));
          if (target) Object.assign(target, record);
          save(data);
        } else {
          data.events.push(record);
          save(data);
        }

        close();
        toast(id ? 'Event updated.' : 'Event added.');
        renderEvents();
      } catch (error) {
        toast(error?.message || 'Unable to save the event.', 'error');
      }
    }
  );
};

window.deleteEvent = async id => {
  if (denyUnlessAreaAdmin('Only Area-level servant accounts can delete Area events.')) return;
  if (!confirm('Delete this event and all of its participant records?')) return;

  try {
    if (session?.backendAuth && !session?.demo) {
      await backendApi(`/api/events?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshAllCloudData({ render: false });
    } else {
      const data = db();
      data.events = data.events.filter(event => String(event.id) !== String(id));
      data.participants = data.participants.filter(participant => String(participant.id) !== String(id));
      data.reports.forEach(report => {
        if (String(report.eventId || '') === String(id)) report.eventId = null;
      });
      save(data);
    }
    toast('Event deleted.');
    renderEvents();
  } catch (error) {
    toast(error?.message || 'Unable to delete the event.', 'error');
  }
};

window.viewEvent = id => {
  const data = db();
  const canManage = isAreaAdminSession();

  const event =
    data.events.find(
      item => String(item.id) === String(id)
    );

  if (!event) return;

  const participants =
    data.participants.filter(
      participant =>
        String(participant.eventId) === String(id)
    );

  const paid =
    participants.filter(
      participant =>
        participant.paymentStatus ===
        'Paid'
    ).length;

  const attended =
    participants.filter(
      participant =>
        participant.attended
    ).length;

  const participantTable =
    participants.length
      ? `
        <div class="table-wrap">

          <table
            class="data-table compact-table"
          >

            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Chapter</th>
                <th>Service</th>
                <th>Payment</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              ${participants
        .map(
          participant => {
            const member = participantMember(data, participant);
            const age = member
              ? calculateAge(member.birthDate)
              : participant.age || null;
            const chapter = member
              ? member.chapterName
              : participant.chapter;
            const services = member
              ? (member.services || []).join(', ')
              : participant.service;

            return `
                    <tr>

                      <td>
                        ${esc(participantName(data, participant) || '—')}
                      </td>

                      <td>
                        ${age === null || age === undefined || age === ''
              ? '—'
              : esc(String(age))}
                      </td>

                      <td>
                        ${esc(chapter || '—')}
                      </td>

                      <td>
                        ${esc(services || '—')}
                      </td>

                      <td>
                        <span class="badge ${participant.paymentStatus ===
              'Paid'
              ? 'paid'
              : 'unpaid'
            }">
                          ${esc(
              participant.paymentStatus || 'Unpaid'
            )}
                        </span>
                      </td>

                      <td>
                        <span class="badge ${participant.attended
              ? 'attended'
              : 'pending'
            }">
                          ${participant.attended
              ? 'Attended'
              : 'Not Yet'
            }
                        </span>
                      </td>

                      <td
                        class="actions-cell"
                      >
                        ${canManage
                          ? `
                            <button
                              class="btn"
                              onclick='participantModal(${inlineJsArg(id)}, ${inlineJsArg(participant.id)})'
                            >
                              Edit
                            </button>

                            <button
                              class="btn red"
                              onclick='deleteParticipant(${inlineJsArg(id)}, ${inlineJsArg(participant.id)})'
                            >
                              Delete
                            </button>
                          `
                          : '<span class="muted">View only</span>'
                        }
                      </td>

                    </tr>
                  `;
          }
        )
        .join('')}

            </tbody>

          </table>

        </div>
      `
      : emptyState(
        'No participants yet',
        'Register the first participant for this event.'
      );

  const body = `
    <div class="event-summary">

      <div>
        <span>
          Date & Time
        </span>

        <strong>
          ${fmtDateTime(
    event.date
  )}
        </strong>
      </div>

      <div>
        <span>
          Venue
        </span>

        <strong>
          ${esc(
    event.venue ||
    '—'
  )}
        </strong>
      </div>

      <div>
        <span>
          Registration Fee
        </span>

        <strong>
          ${Number(
    event.fee
  ) > 0
      ? money(
        event.fee
      )
      : 'Free'
    }
        </strong>
      </div>

      <div>
        <span>
          Registered
        </span>

        <strong>
          ${participants.length}
        </strong>
      </div>

      <div>
        <span>
          Paid
        </span>

        <strong>
          ${paid}
        </strong>
      </div>

      <div>
        <span>
          Attended
        </span>

        <strong>
          ${participants.length
      ? attended
      : Number(
        event.peopleAttended ||
        0
      )
    }
        </strong>
      </div>

    </div>

    ${event.description
      ? `
          <p class="event-description">
            ${esc(
        event.description
      )}
          </p>
        `
      : ''
    }

    <div class="modal-section-heading">

      <h3>
        Participants
        (${participants.length})
      </h3>

      ${canManage
        ? `
          <button
            class="btn blue"
            type="button"
            onclick='participantModal(${inlineJsArg(id)})'
          >
            + Register Participant
          </button>
        `
        : '<span class="scope-chip">View Only</span>'
      }

    </div>

    ${participantTable}
  `;

  openModal(
    esc(event.name),
    body
  );
};

window.participantModal = (
  eventId,
  id = null
) => {
  if (denyUnlessAreaAdmin('Only Area-level servant accounts can manage event participants.')) return;

  const data = db();

  const participant = id
    ? data.participants.find(
      item => String(item.id) === String(id)
    )
    : null;

  const linkedMember = participant
    ? participantMember(data, participant)
    : null;

  const registeredMemberIds = new Set(
    data.participants
      .filter(item =>
        String(item.eventId) === String(eventId) &&
        String(item.id) !== String(id || '') &&
        item.memberId !== null &&
        item.memberId !== undefined
      )
      .map(item => String(item.memberId))
  );

  const availableMembers = data.members
    .filter(member => !registeredMemberIds.has(String(member.id)))
    .sort((a, b) =>
      fullName(a).localeCompare(fullName(b), undefined, { sensitivity: 'base' })
    );

  const memberSummary = member => `
    <div class="participant-member-summary">
      <strong>${esc(fullName(member) || 'Unnamed Member')}</strong>
      <span>${esc(member.chapterName || 'No Chapter')} · ${esc(member.contact || 'No Contact')}</span>
      <small>${esc(member.status || 'Active')}${(member.services || []).length
        ? ` · ${esc((member.services || []).join(', '))}`
        : ''}</small>
    </div>
  `;

  let memberSection = '';

  if (id) {
    if (linkedMember) {
      memberSection = `
        <div class="form-group full">
          <label>Registered Member</label>
          <div class="participant-selected-member">
            ${memberSummary(linkedMember)}
          </div>
        </div>
      `;
    } else {
      memberSection = `
        <div class="form-group full">
          <label>Registered Member</label>
          <div class="participant-selected-member legacy">
            <div class="participant-member-summary">
              <strong>${esc(participantName(data, participant) || 'Legacy Participant')}</strong>
              <span>Historical participant record</span>
              <small>The original member record is no longer available. Payment and attendance can still be updated.</small>
            </div>
          </div>
        </div>
      `;
    }
  } else if (availableMembers.length) {
    memberSection = `
      <div class="form-group full">
        <label for="participantMemberSearch">Registered Member</label>
        <input
          class="search-input participant-member-search"
          id="participantMemberSearch"
          type="search"
          placeholder="Search registered members..."
          autocomplete="off"
        >

        <div class="participant-member-list" id="participantMemberList">
          ${availableMembers
            .map(
              member => `
                <label
                  class="participant-member-option"
                  data-participant-member-search="${esc(`
                    ${fullName(member)}
                    ${member.chapterName || ''}
                    ${member.contact || ''}
                    ${(member.services || []).join(' ')}
                    ${member.status || ''}
                  `.toLowerCase().replace(/\s+/g, ' ').trim())}"
                >
                  <input
                    type="radio"
                    name="pMember"
                    value="${member.id}"
                  >
                  ${memberSummary(member)}
                </label>
              `
            )
            .join('')}
        </div>

        <p class="muted participant-member-empty hidden" id="participantMemberEmpty">
          No registered members match your search.
        </p>
      </div>
    `;
  } else {
    memberSection = `
      <div class="form-group full">
        <label>Registered Member</label>
        <div class="participant-member-notice">
          ${data.members.length
            ? 'All registered members are already participants in this event.'
            : 'There are no registered members yet. Add a member in the Members tab first.'}
        </div>
      </div>
    `;
  }

  const body = `
    <div class="form-grid">

      ${memberSection}

      ${selectField(
        'Mode of Payment',
        'pMode',
        [
          'Cash',
          'GCash',
          'Bank Transfer',
          'Other'
        ],
        participant?.paymentMode ||
        'Cash'
      )}

      ${selectField(
        'Payment Status',
        'pPay',
        [
          'Unpaid',
          'Paid'
        ],
        participant?.paymentStatus ||
        'Unpaid'
      )}

      <div
        class="form-group full"
      >

        <label
          class="check-row"
        >
          <input
            type="checkbox"
            id="pAttended"
            ${participant?.attended
      ? 'checked'
      : ''
    }
          >

          Mark as attended
        </label>

      </div>

    </div>
  `;

  openModal(
    id
      ? 'Edit Participant'
      : 'Register Participant',

    body,

    async close => {
      let member = linkedMember;

      if (!id) {
        const selectedMember = document.querySelector('input[name="pMember"]:checked');
        if (!selectedMember) {
          toast(data.members.length ? 'Select a registered member.' : 'Add a member in the Members tab before registering a participant.', 'error');
          return;
        }
        member = data.members.find(item => String(item.id) === String(selectedMember.value));
        if (!member) {
          toast('The selected member could not be found. Refresh and try again.', 'error');
          return;
        }
        if (data.participants.some(item =>
          String(item.eventId) === String(eventId) &&
          String(item.id) !== String(id || '') &&
          String(item.memberId) === String(member.id)
        )) {
          toast('That member is already registered for this event.', 'error');
          return;
        }
      }

      const record = {
        id: id || uid(),
        eventId,
        memberId: member?.id ?? participant?.memberId ?? null,
        first: member?.firstName ?? participant?.first ?? '',
        last: member?.lastName ?? participant?.last ?? '',
        mi: member?.middleName ? String(member.middleName).trim().charAt(0).toUpperCase() : participant?.mi ?? '',
        age: member ? calculateAge(member.birthDate) || 0 : participant?.age || 0,
        contact: member?.contact ?? participant?.contact ?? '',
        address: member?.address ?? participant?.address ?? '',
        chapter: member?.chapterName ?? participant?.chapter ?? '',
        service: member ? (member.services || []).join(', ') : participant?.service ?? '',
        paymentMode: document.getElementById('pMode').value,
        paymentStatus: document.getElementById('pPay').value,
        attended: document.getElementById('pAttended').checked
      };

      try {
        if (session?.backendAuth && !session?.demo) {
          await backendApi('/api/participants', {
            method: id ? 'PATCH' : 'POST',
            body: JSON.stringify({ ...record, id: id || undefined })
          });
          await refreshAllCloudData({ render: false });
        } else if (id) {
          const target = data.participants.find(item => String(item.id) === String(id));
          if (!target) {
            toast('Participant record could not be found.', 'error');
            return;
          }
          Object.assign(target, record);
          save(data);
        } else {
          data.participants.push(record);
          save(data);
        }

        close();
        toast(id ? 'Participant updated.' : 'Participant registered.');
        window.viewEvent(eventId);
      } catch (error) {
        toast(error?.message || 'Unable to save the participant.', 'error');
      }
    }
  );

  if (!id) {
    const searchInput = document.getElementById('participantMemberSearch');
    const emptyMessage = document.getElementById('participantMemberEmpty');
    const rows = [
      ...document.querySelectorAll('[data-participant-member-search]')
    ];

    searchInput?.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      let visible = 0;

      rows.forEach(row => {
        const matches = !query ||
          (row.dataset.participantMemberSearch || '').includes(query);

        row.classList.toggle('hidden', !matches);
        if (matches) visible += 1;
      });

      emptyMessage?.classList.toggle('hidden', visible !== 0);
    });
  }
};

window.deleteParticipant = async (eventId, id) => {
  if (denyUnlessAreaAdmin('Only Area-level servant accounts can manage event participants.')) return;
  if (!confirm('Delete this participant?')) return;

  try {
    if (session?.backendAuth && !session?.demo) {
      await backendApi(`/api/participants?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshAllCloudData({ render: false });
    } else {
      const data = db();
      data.participants = data.participants.filter(participant => String(participant.id) !== String(id));
      save(data);
    }
    toast('Participant deleted.');
    activeModalCleanup?.();
    window.viewEvent(eventId);
  } catch (error) {
    toast(error?.message || 'Unable to delete the participant.', 'error');
  }
};
