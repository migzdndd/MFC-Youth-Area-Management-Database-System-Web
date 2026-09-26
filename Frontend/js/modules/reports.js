/**
 * ============================================================================
 * MFC Youth Area Management System - Activity Reports & PDF Exports
 * ============================================================================
 */

// Section 15: Activity Reports Module

const REPORT_TYPES = [
  'Core Household',
  'Household',
  'Assembly',
  'Fellowship'
];

let reportFilters = {
  search: '',
  chapter: 'All',
  type: 'All',
  from: '',
  to: ''
};

/**
 * List Available Report Activity Categories
 *
 * What it does:
 * Gathers all standard activity types (Core Household, Household, Assembly, Fellowship) plus any custom types used in older reports, presenting them in order.
 *
 * Backup plan if it breaks:
 * If no reports or custom types exist yet, it gracefully falls back to the default standard activity list.
 */
function reportTypes(data) {
  // Get all unique types from existing reports
  const allTypes = [
    ...new Set(
      data.reports
        .map(report => report.type)
        .filter(Boolean)
    )
  ];

  // Separate standard types from legacy types
  const standardTypes = REPORT_TYPES.filter(
    type => allTypes.includes(type)
  );

  const legacyTypes = allTypes.filter(
    type => !REPORT_TYPES.includes(type)
  ).sort();

  // Return standard types first, then legacy types
  return [...standardTypes, ...legacyTypes];
}

/**
 * Gather Active and Historical Chapters for Reports
 *
 * What it does:
 * Compiles a list of currently active chapters alongside older chapters found in past reports, ensuring past activity data remains searchable.
 *
 * Backup plan if it breaks:
 * If there are no past reports, it simply returns the current active chapters list without missing a beat.
 */
function reportChapters(data) {
  const current = data.chapters
    .map(chapter => chapter.name)
    .filter(Boolean);

  const historical = [
    ...new Set(
      data.reports
        .map(report => report.chapter)
        .filter(Boolean)
    )
  ]
    .filter(name => !current.includes(name))
    .sort();

  return { current, historical };
}

/**
 * Filter and Sort Activity Reports
 *
 * What it does:
 * Searches reports by keywords in title, activity, preparer, or location, and narrows them down by chapter, type, and date range, sorting newest first.
 *
 * Backup plan if it breaks:
 * If any report fields are blank or missing, it safely treats them as empty text so search never throws an error.
 */
function filteredReports(data) {
  return data.reports
    .filter(report => {

      const text = `
        ${report.title || ''}
        ${report.activity || ''}
        ${report.preparedBy || ''}
        ${report.description || ''}
        ${report.location || ''}
      `.toLowerCase();

      if (
        !text.includes(
          reportFilters.search.toLowerCase()
        )
      ) {
        return false;
      }

      if (
        reportFilters.chapter !==
        'All' &&
        report.chapter !==
        reportFilters.chapter
      ) {
        return false;
      }

      if (
        reportFilters.type !==
        'All' &&
        report.type !==
        reportFilters.type
      ) {
        return false;
      }

      if (
        reportFilters.from &&
        report.date <
        reportFilters.from
      ) {
        return false;
      }

      if (
        reportFilters.to &&
        report.date >
        reportFilters.to
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (a, b) =>
        parseEventTimestamp(b.date) -
        parseEventTimestamp(a.date)
    );
}

/**
 * Total Up Attendees Across Reports
 *
 * What it does:
 * Adds together the participant counts of all selected activity reports to find total youth turnout.
 *
 * Backup plan if it breaks:
 * If a report is missing an attendee number or has non-numeric text, it treats that report's count as 0 rather than breaking the sum.
 */
function calculateTotalParticipants(
  reports
) {
  return reports.reduce(
    (sum, report) =>
      sum +
      Number(
        report.participants || 0
      ),
    0
  );
}

/**
 * Group Activities by Activity Type
 *
 * What it does:
 * Groups the filtered reports by their category (such as Assembly or Household) to calculate total count and attendance for each type.
 *
 * Backup plan if it breaks:
 * If a report has no assigned type, it groups it into an 'Unspecified' bucket so it is still accounted for.
 */
function groupActivitiesByType(
  reports
) {
  const map = {};

  reports.forEach(report => {
    const key =
      report.type ||
      'Unspecified';

    if (!map[key]) {
      map[key] = {
        type: key,
        count: 0,
        participants: 0
      };
    }

    map[key].count++;

    map[key].participants +=
      Number(
        report.participants || 0
      );
  });

  return Object.values(map).sort(
    (a, b) =>
      b.count - a.count ||
      b.participants -
      a.participants
  );
}

/**
 * Group Activities by Chapter
 *
 * What it does:
 * Groups the filtered reports by chapter name to show which chapters hosted activities and how many youth attended in each.
 *
 * Backup plan if it breaks:
 * If a report does not list a chapter, it falls back to a 'No Chapter' label.
 */
function groupActivitiesByChapter(
  reports
) {
  const map = {};

  reports.forEach(report => {
    const key =
      report.chapter ||
      'No Chapter';

    if (!map[key]) {
      map[key] = {
        chapter: key,
        count: 0,
        participants: 0
      };
    }

    map[key].count++;

    map[key].participants +=
      Number(
        report.participants || 0
      );
  });

  return Object.values(map).sort(
    (a, b) =>
      b.count - a.count ||
      b.participants -
      a.participants
  );
}

/**
 * Calculate Overall Report Statistics
 *
 * What it does:
 * Calculates total activities, total attendees, average turnout per activity, and counts of unique participating chapters and activity types.
 *
 * Backup plan if it breaks:
 * If there are zero activities recorded, it sets average attendance safely to 0 to prevent division errors.
 */
function calculateReportSummary(
  reports
) {
  const totalActivities =
    reports.length;

  const totalParticipants =
    calculateTotalParticipants(
      reports
    );

  return {
    totalActivities,

    totalParticipants,

    averageAttendance:
      totalActivities
        ? Math.round(
          totalParticipants /
          totalActivities
        )
        : 0,

    chaptersInvolved:
      new Set(
        reports
          .map(
            report =>
              report.chapter
          )
          .filter(Boolean)
      ).size,

    activityTypes:
      new Set(
        reports
          .map(
            report =>
              report.type
          )
          .filter(Boolean)
      ).size
  };
}

/**
 * Generate Written Highlights and Findings
 *
 * What it does:
 * Analyzes the reports and writes natural summary sentences highlighting the most active chapter, the most common type of event, total youth attendance, and average turnout.
 *
 * Backup plan if it breaks:
 * If no reports match the current filters, it returns an empty list so the report view shows an empty state rather than confusing text.
 */
function generateReportInsights(
  reports
) {
  if (!reports.length) {
    return [];
  }

  const byChapter =
    groupActivitiesByChapter(
      reports
    );

  const byType =
    groupActivitiesByType(
      reports
    );

  const summary =
    calculateReportSummary(
      reports
    );

  const insights = [];

  if (byChapter.length) {
    insights.push(
      `${byChapter[0].chapter} recorded the highest number of activities (${byChapter[0].count}).`
    );
  }

  if (byType.length) {
    insights.push(
      `${byType[0].type} was the most frequently recorded activity type (${byType[0].count}).`
    );
  }

  insights.push(
    `Total recorded participation was ${summary.totalParticipants} across ${summary.totalActivities} activit${summary.totalActivities === 1
      ? 'y'
      : 'ies'
    }.`
  );

  insights.push(
    `Average attendance per recorded activity was approximately ${summary.averageAttendance} participant${summary.averageAttendance === 1
      ? ''
      : 's'
    }.`
  );

  return insights;
}

/**
 * Format Active Filter Description for Exports
 *
 * What it does:
 * Creates a clear text line explaining what filters were applied (such as "Chapter: Alpha | Date: Jan 1 to Mar 1") for printed headers and PDF exports.
 *
 * Backup plan if it breaks:
 * If no filters are active, it simply returns "All Recorded Activities".
 */
function reportScopeText() {
  const parts = [];

  if (
    reportFilters.chapter !==
    'All'
  ) {
    parts.push(
      `Chapter: ${reportFilters.chapter}`
    );
  }

  if (
    reportFilters.type !==
    'All'
  ) {
    parts.push(
      `Type: ${reportFilters.type}`
    );
  }

  if (
    reportFilters.from ||
    reportFilters.to
  ) {
    parts.push(
      `Date: ${reportFilters.from
        ? fmtDate(
          reportFilters.from
        )
        : 'Beginning'
      } to ${reportFilters.to
        ? fmtDate(
          reportFilters.to
        )
        : 'Present'
      }`
    );
  }

  if (
    reportFilters.search
  ) {
    parts.push(
      `Search: ${reportFilters.search}`
    );
  }

  return parts.length
    ? parts.join(' | ')
    : 'All Recorded Activities';
}

/**
 * Render Reports Management Page
 *
 * What it does:
 * Builds the activity reports dashboard, filter toolbar, primary reports data table with record management actions, and secondary monthly activity analytics chart.
 *
 * Backup plan if it breaks:
 * If the current leader is a Chapter Servant, it automatically locks the chapter filter and preparer information to their chapter scope.
 */
function renderReports() {
  const data = db();

  const chapterScope = isChapterServantSession()
    ? scopedChapter(data)
    : null;

  const list =
    filteredReports(data);

  const types =
    reportTypes(data);

  const chapters =
    reportChapters(data);

  const summary =
    calculateReportSummary(
      list
    );

  const months = [
    ...Array(6)
  ].map((_, index) => {
    const date =
      new Date();

    date.setDate(1);

    date.setMonth(
      date.getMonth() -
      (5 - index)
    );

    const count =
      list.filter(report => {
        const rd =
          new Date(
            `${report.date}T00:00:00`
          );

        return (
          rd.getMonth() ===
          date.getMonth() &&
          rd.getFullYear() ===
          date.getFullYear()
        );
      }).length;

    return {
      label:
        date.toLocaleDateString(
          'en',
          {
            month: 'short'
          }
        ),

      count
    };
  });

  const max =
    Math.max(
      ...months.map(
        item => item.count
      ),
      1
    );


  content.innerHTML =
    pageHeader(
      'Activity Reports',
      isChapterServantSession()
        ? `Manage activity reports for ${esc(chapterScope.name)} Chapter. Your name and chapter are locked to your account scope.`
        : 'Manage activity reports, filter records, review analytics, and export summarized documents.',
      `
        <button
          class="btn blue"
          id="addReport"
        >
          + Add Report
        </button>

        <button
          class="btn"
          id="printReports"
        >
          Print Summary
        </button>

        <button
          class="btn"
          id="exportPdfBtn"
        >
          Export PDF
        </button>
      `
    ) +
    `
    <div class="stat-grid">

      <section
        class="card stat-card"
      >
        <span>
          Matching Reports
        </span>

        <strong>
          ${summary.totalActivities}
        </strong>
      </section>

      <section
        class="card stat-card"
      >
        <span>
          Total Participants
        </span>

        <strong>
          ${summary.totalParticipants}
        </strong>
      </section>

      <section
        class="card stat-card"
      >
        <span>
          Chapters Involved
        </span>

        <strong>
          ${summary.chaptersInvolved}
        </strong>
      </section>

      <section
        class="card stat-card"
      >
        <span>
          Average Attendance
        </span>

        <strong>
          ${summary.averageAttendance}
        </strong>
      </section>

    </div>

    <div
      class="toolbar report-toolbar"
    >

      <div class="grow">
        <input
          class="search-input"
          id="reportSearch"
          placeholder="Search title, activity, preparer, location..."
          value="${esc(
      reportFilters.search
    )}"
        >
      </div>

      <select
        class="select-input compact-filter"
        id="reportChapter"
        ${isChapterServantSession() ? 'disabled' : ''}
      >
        <option>
          All
        </option>

        ${chapters.current
      .map(
        chapterName => `
              <option
                value="${esc(chapterName)}"
                ${reportFilters.chapter ===
            chapterName
            ? 'selected'
            : ''
          }
              >
                ${esc(chapterName)}
              </option>
            `
      )
      .join('')}

        ${chapters.historical
      .map(
        chapterName => `
              <option
                value="${esc(chapterName)}"
                ${reportFilters.chapter ===
            chapterName
            ? 'selected'
            : ''
          }
              >
                ${esc(chapterName)} (Historical)
              </option>
            `
      )
      .join('')}
      </select>

      <select
        class="select-input compact-filter"
        id="reportType"
      >
        <option>
          All
        </option>

        ${REPORT_TYPES
      .map(
        type => `
              <option
                ${reportFilters.type ===
            type
            ? 'selected'
            : ''
          }
              >
                ${esc(type)}
              </option>
            `
      )
      .join('')}

        ${(() => {
        // Add any legacy types that don't match standard types
        const legacyTypes = types.filter(
          type => !REPORT_TYPES.includes(type)
        );

        if (legacyTypes.length === 0) {
          return '';
        }

        return legacyTypes
          .map(
            type => `
              <option
                value="${esc(type)}"
                ${reportFilters.type ===
            type
            ? 'selected'
            : ''
          }
              >
                ${esc(type)} (Legacy)
              </option>
            `
          )
          .join('');
      })()}
      </select>

      <label class="date-filter">
        From

        <input
          class="date-input"
          id="reportFrom"
          type="date"
          value="${esc(
        reportFilters.from
      )}"
        >
      </label>

      <label class="date-filter">
        To

        <input
          class="date-input"
          id="reportTo"
          type="date"
          value="${esc(
        reportFilters.to
      )}"
        >
      </label>

      <button
        class="btn"
        id="clearReportFilters"
      >
        Clear
      </button>

    </div>

    <div class="result-count">
      Report scope:
      ${esc(
        reportScopeText()
      )}
    </div>

    <!-- Primary Card: Activity Records Table -->
    <section class="card panel report-primary-card" aria-label="Activity Records">
      <div class="report-primary-header">
        <div class="report-primary-title-group">
          <div class="report-primary-badge-row">
            <span class="metric-badge-primary">Primary</span>
            <span class="scope-chip">${list.length} ${list.length === 1 ? 'Report' : 'Reports'} Found</span>
          </div>
          <h3>Activity Records</h3>
          <p class="muted">Detailed log of activities, attendance turnout, and filed submissions</p>
        </div>
      </div>

      <div class="table-wrap report-table-wrap">
        ${list.length
      ? `
            <table class="data-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Report Title</th>
                  <th>Chapter</th>
                  <th>Type</th>
                  <th>Participants</th>
                  <th>Location</th>
                  <th>Prepared By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                ${list
        .map(
          report => `
                      <tr>

                        <td>
                          ${fmtDate(
            report.date
          )}
                        </td>

                        <td>
                          <strong>
                            ${esc(
            report.title
          )}
                          </strong>

                          <div
                            class="muted"
                          >
                            ${esc(
            report.activity ||
            '—'
          )}
                          </div>
                        </td>

                        <td>
                          ${esc(
            report.chapter ||
            '—'
          )}
                        </td>

                        <td>
                          ${esc(
            report.type ||
            '—'
          )}
                        </td>

                        <td>
                          ${Number(
            report.participants ||
            0
          )}
                        </td>

                        <td>
                          ${esc(
            report.location ||
            '—'
          )}
                        </td>

                        <td>
                          ${esc(
            report.preparedBy ||
            '—'
          )}
                        </td>

                        <td
                          class="actions-cell"
                        >
                          <button
                            class="btn"
                            onclick='viewReport(${inlineJsArg(report.id)})'
                          >
                            View
                          </button>

                          <button
                            class="btn"
                            onclick='reportModal(${inlineJsArg(report.id)})'
                          >
                            Edit
                          </button>

                          <button
                            class="btn red"
                            onclick='deleteReport(${inlineJsArg(report.id)})'
                          >
                            Delete
                          </button>
                        </td>

                      </tr>
                    `
        )
        .join('')}

              </tbody>

            </table>
          `
      : emptyState(
        'No activity reports',
        data.reports.length
          ? 'No records match the selected filters.'
          : 'Add a report to start your analytics.'
      )
    }
      </div>
    </section>

    <!-- Secondary Card: Monthly Activity Trend -->
    <section class="card panel report-secondary-card" aria-label="Monthly Activity Trend">
      <div class="report-secondary-header">
        <div class="report-secondary-title-group">
          <div class="report-secondary-badge-row">
            <span class="metric-badge-secondary">Secondary</span>
            <span class="scope-chip">Past 6 Months</span>
          </div>
          <h3>Monthly Activity</h3>
          <p class="muted">Activity count distribution and monthly turnout trends</p>
        </div>
      </div>

      <div class="chart-bars report-chart-bars">

        ${months
      .map(
        month => `
              <div
                class="chart-bar-wrap"
              >

                <div
                  class="chart-value"
                >
                  ${month.count}
                </div>

                <div
                  class="chart-bar"
                  style="
                    height:
                    ${month.count === 0
          ? 0
          : Math.max(
            8,
            (month.count /
              max) *
            125
          )}px
                  "
                ></div>

                <span>
                  ${month.label}
                </span>

              </div>
            `
      )
      .join('')}

      </div>
    </section>
  `;

  document.getElementById(
    'addReport'
  ).onclick = () =>
      reportModal();

  document.getElementById(
    'printReports'
  ).onclick = () =>
      printReportSummary(data);

  document.getElementById(
    'exportPdfBtn'
  ).onclick = () =>
      exportReportsPdf(data);

  document.getElementById(
    'reportSearch'
  ).oninput = event => {
    reportFilters.search =
      event.target.value;

    renderReports();
  };

  document.getElementById(
    'reportChapter'
  ).onchange = event => {
    reportFilters.chapter =
      event.target.value;

    renderReports();
  };

  document.getElementById(
    'reportType'
  ).onchange = event => {
    reportFilters.type =
      event.target.value;

    renderReports();
  };

  document.getElementById(
    'reportFrom'
  ).onchange = event => {
    reportFilters.from =
      event.target.value;

    if (
      reportFilters.to &&
      reportFilters.from >
      reportFilters.to
    ) {
      reportFilters.to =
        reportFilters.from;
    }

    renderReports();
  };

  document.getElementById(
    'reportTo'
  ).onchange = event => {
    reportFilters.to =
      event.target.value;

    if (
      reportFilters.from &&
      reportFilters.to <
      reportFilters.from
    ) {
      reportFilters.from =
        reportFilters.to;
    }

    renderReports();
  };

  document.getElementById(
    'clearReportFilters'
  ).onclick = () => {
    reportFilters = {
      search: '',
      chapter: isChapterServantSession() && chapterScope
        ? chapterScope.name
        : 'All',
      type: 'All',
      from: '',
      to: ''
    };

    renderReports();
  };
}

/**
 * View Activity Report Details Modal
 *
 * What it does:
 * Opens a modal showing full details of a specific activity report, including event name, chapter, date, venue, attendance, and descriptive narrative highlights.
 *
 * Backup plan if it breaks:
 * If the report does not exist in the database, it exits immediately. Only authorized leaders of that chapter or area coordinators are allowed to see the "Edit Report" button.
 */
window.viewReport = function (id) {
  const data = db();
  const report = data.reports.find(item => String(item.id) === String(id));
  if (!report) return;

  const linkedEvent = report.eventId
    ? data.events.find(e => String(e.id) === String(report.eventId))
    : null;

  const canEdit = !isChapterServantSession() || report.chapter === scopedChapter(data)?.name;

  const body = `
    <div class="detail-grid">
      <div class="detail-item full">
        <span class="detail-label">Report Title</span>
        <div class="detail-value"><strong>${esc(report.title || 'Untitled Report')}</strong></div>
      </div>

      <div class="detail-item">
        <span class="detail-label">Activity Type</span>
        <div class="detail-value"><span class="badge active">${esc(report.type || 'Activity')}</span></div>
      </div>

      <div class="detail-item">
        <span class="detail-label">Chapter</span>
        <div class="detail-value">${esc(report.chapter || '—')}</div>
      </div>

      <div class="detail-item">
        <span class="detail-label">Activity Date</span>
        <div class="detail-value">${esc(fmtDate(report.date))}</div>
      </div>

      <div class="detail-item">
        <span class="detail-label">Location / Venue</span>
        <div class="detail-value">${esc(report.location || '—')}</div>
      </div>

      <div class="detail-item">
        <span class="detail-label">Prepared By</span>
        <div class="detail-value">${esc(report.preparedBy || '—')}</div>
      </div>

      <div class="detail-item">
        <span class="detail-label">Participants</span>
        <div class="detail-value"><strong>${Number(report.participants || 0)}</strong> attendees</div>
      </div>

      <div class="detail-item full">
        <span class="detail-label">Linked Event</span>
        <div class="detail-value">${linkedEvent ? esc(linkedEvent.name) : '<span class="muted">No Linked Event</span>'}</div>
      </div>

      ${report.activity ? `
        <div class="detail-item full">
          <span class="detail-label">Activity Summary</span>
          <div class="detail-value">${esc(report.activity)}</div>
        </div>
      ` : ''}

      <div class="detail-item full">
        <span class="detail-label">Highlights & Narrative</span>
        <div class="detail-value" style="white-space: pre-wrap; line-height: 1.6;">${esc(report.highlights || 'No additional highlights or narrative recorded for this report.')}</div>
      </div>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--line);">
      ${canEdit ? `
        <button class="btn blue" type="button" onclick='activeModalCleanup?.(); reportModal(${inlineJsArg(report.id)})'>
          Edit Report
        </button>
      ` : ''}
    </div>
  `;

  openModal(
    `Activity Report - ${esc(report.title || 'Details')}`,
    body
  );
};

/**
 * Add or Edit Activity Report Form Modal
 *
 * What it does:
 * Opens a modal dialog with form fields to create a new activity report or edit an existing one, auto-populating chapter, date, attendees, and linked event details.
 *
 * Backup plan if it breaks:
 * If required inputs (such as title, chapter, or date) are empty, a warning notification alerts the leader and keeps the modal open so entered text is preserved.
 */
window.reportModal = function (
  id = null
) {
  const data = db();

  const chapterScope = isChapterServantSession()
    ? scopedChapter(data)
    : null;

  if (isChapterServantSession() && !chapterScope) {
    toast('Your account is not assigned to a chapter.', 'error');
    return;
  }

  const report = id
    ? data.reports.find(
      item => String(item.id) === String(id)
    )
    : {};

  if (
    isChapterServantSession() &&
    id &&
    report?.chapter !== chapterScope?.name
  ) {
    toast('You can only edit activity reports for your assigned chapter.', 'error');
    return;
  }

  const linkedEvent =
    report?.eventId
      ? data.events.find(
        event =>
          String(event.id) ===
          String(report.eventId)
      )
      : null;

  const eventOptions = `
    <option value="">
      No Linked Event
    </option>

    ${data.events
      .map(
        event => `
          <option
            value="${event.id}"
            ${String(report?.eventId || '') ===
            String(event.id)
            ? 'selected'
            : ''
          }
          >
            ${esc(
            event.name
          )}
            —
            ${fmtDate(
            event.date
          )}
          </option>
        `
      )
      .join('')}
  `;

  const body = `
    <div class="form-grid">

      ${field(
    'Report Title',
    'rTitle',
    'text',
    report?.title || '',
    'required maxlength="120"'
  )}

      <div class="form-group">

        <label for="rChapter">
          Chapter
        </label>

        <select
          class="select-input"
          id="rChapter"
          ${isChapterServantSession() ? 'disabled' : ''}
        >

          <option value="">
            No Chapter
          </option>

          ${data.chapters
      .map(
        chapter => `
                <option
                  value="${esc(chapter.name)}"
                  ${reportFilters.chapter ===
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

          ${(() => {
        const existingChapter = report?.chapter;
        const isHistorical = existingChapter &&
          !data.chapters.some(chapter => chapter.name === existingChapter);

        return isHistorical
          ? `
              <option value="${esc(existingChapter)}" selected>
                ${esc(existingChapter)} (Historical)
              </option>
            `
          : '';
      })()}

        </select>
      </div>

      <div class="form-group">
        <label for="rType">
          Report Type
        </label>

        <select
          class="select-input"
          id="rType"
        >
          <option value="">
            Select Report Type
          </option>

          ${REPORT_TYPES
      .map(
        type => `
              <option
                ${report?.type === type
            ? 'selected'
            : ''
          }
              >
                ${esc(type)}
              </option>
            `
      )
      .join('')}

          ${(() => {
        // Add legacy types if editing an old report with non-standard type
        const existingType = report?.type;

        if (
          existingType &&
          !REPORT_TYPES.includes(
            existingType
          )
        ) {
          return `
                  <option
                    value="${esc(
            existingType
          )}"
                    selected
                  >
                    ${esc(
            existingType
          )} (Legacy)
                  </option>
                `;
        }

        return '';
      })()}

        </select>
      </div>

      ${field(
        'Activity',
        'rActivity',
        'text',
        report?.activity || '',
        'maxlength="120"'
      )}

      ${field(
        'Report Date',
        'rDate',
        'date',
        report?.date ||
        todayISO(),
        `required max="${todayISO()}"`
      )}

      ${field(
        'Prepared By',
        'rPrepared',
        'text',
        isChapterServantSession()
          ? (session?.name || '')
          : (
              report?.preparedBy ||
              session?.name ||
              ''
            ),
        isChapterServantSession()
          ? 'maxlength="100" readonly'
          : 'maxlength="100"'
      )}

      ${field(
        'Participants / Attendance',
        'rParticipants',
        'number',
        report?.participants ?? '',
        'min="0" step="1"'
      )}

      ${field(
        'Location',
        'rLocation',
        'text',
        report?.location ||
        linkedEvent?.venue ||
        '',
        'maxlength="150"'
      )}

      <div class="form-group full">

        <label for="rEvent">
          Linked Event (optional)
        </label>

        <select
          class="select-input"
          id="rEvent"
        >
          ${eventOptions}
        </select>

        <small
          class="field-help"
        >
          Selecting an event can automatically use its venue and current attendance count.
        </small>

      </div>

      <div
        class="form-group full"
      >

        <label for="rDescription">
          Description / Remarks
        </label>

        <textarea
          class="textarea-input"
          id="rDescription"
          maxlength="1000"
        >${esc(
        report?.description ||
        ''
      )}</textarea>

      </div>

    </div>
  `;

  openModal(
    id
      ? 'Edit Activity Report'
      : 'Add Activity Report',

    body,

    async close => {
      const title = document.getElementById('rTitle').value.trim();
      const date = document.getElementById('rDate').value;
      const reportType = document.getElementById('rType').value.trim();
      const participants = Number(document.getElementById('rParticipants').value || 0);

      if (!title || !date) {
        toast('Report title and date are required.', 'error');
        return;
      }
      if (!reportType) {
        toast('Please select a report type.', 'error');
        return;
      }
      const isLegacyTypeBeingPreserved = Boolean(
        id && report?.type && !REPORT_TYPES.includes(report.type) && reportType === report.type
      );
      if (!REPORT_TYPES.includes(reportType) && !isLegacyTypeBeingPreserved) {
        toast('Please select one of the available report types.', 'error');
        return;
      }
      if (date > todayISO()) {
        toast('Report date cannot be in the future.', 'error');
        return;
      }
      if (!Number.isInteger(participants) || participants < 0) {
        toast('Participants must be a whole number of zero or more.', 'error');
        return;
      }

      const chapterName = isChapterServantSession() && chapterScope
        ? chapterScope.name
        : document.getElementById('rChapter').value;
      const chapterId = chapterName
        ? (data.chapters.find(chapter => chapter.name === chapterName)?.id || null)
        : null;
      const eventId = document.getElementById('rEvent').value || null;
      const record = {
        id: id || uid(),
        title,
        chapter: chapterName,
        chapterId,
        type: reportType,
        activity: document.getElementById('rActivity').value.trim(),
        date,
        preparedBy: isChapterServantSession() ? (session?.name || '') : document.getElementById('rPrepared').value.trim(),
        participants,
        location: document.getElementById('rLocation').value.trim(),
        eventId,
        description: document.getElementById('rDescription').value.trim()
      };

      try {
        if (session?.backendAuth && !session?.demo) {
          await backendApi('/api/reports', {
            method: id ? 'PATCH' : 'POST',
            body: JSON.stringify({ ...record, chapterName, id: id || undefined })
          });
          await refreshAllCloudData({ render: false });
        } else if (id) {
          const target = data.reports.find(item => String(item.id) === String(id));
          if (target) Object.assign(target, record);
          save(data);
        } else {
          data.reports.push(record);
          save(data);
        }

        close();
        toast(id ? 'Report updated.' : 'Report added.');
        renderReports();
      } catch (error) {
        toast(error?.message || 'Unable to save the activity report.', 'error');
      }
    }
  );

  const eventSelect =
    document.getElementById(
      'rEvent'
    );

  eventSelect?.addEventListener(
    'change',
    () => {
      const event = data.events.find(
        item => String(item.id) === String(eventSelect.value)
      );

      if (!event) return;

      const eventParticipants =
        data.participants.filter(
          item =>
            String(item.eventId) ===
            String(event.id)
        );

      const attended =
        eventParticipants.filter(
          item =>
            item.attended
        ).length;

      document.getElementById(
        'rLocation'
      ).value =
        event.venue || '';

      document.getElementById(
        'rParticipants'
      ).value =
        eventParticipants.length
          ? attended
          : Number(
            event.peopleAttended ||
            0
          );

      if (
        !document
          .getElementById(
            'rActivity'
          )
          .value.trim()
      ) {
        document.getElementById(
          'rActivity'
        ).value =
          event.name;
      }
    }
  );
};

/**
 * Delete Activity Report
 *
 * What it does:
 * Permanently removes an activity report record from the database after asking the user for confirmation.
 *
 * Backup plan if it breaks:
 * Restricts chapter servants so they can only delete reports belonging to their own chapter. If the server fails to delete the record, an error toast displays and the report remains in the list.
 */
window.deleteReport = async id => {
  const data = db();

  if (isChapterServantSession()) {
    const chapter = scopedChapter(data);
    const report = data.reports.find(item => String(item.id) === String(id));
    if (!chapter || !report || report.chapter !== chapter.name) {
      toast('You can only delete activity reports for your assigned chapter.', 'error');
      return;
    }
  } else if (!isAreaAdminSession()) {
    toast('You do not have permission to delete activity reports.', 'error');
    return;
  }
  if (!confirm('Delete this activity report?')) return;

  try {
    if (session?.backendAuth && !session?.demo) {
      await backendApi(`/api/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refreshAllCloudData({ render: false });
    } else {
      data.reports = data.reports.filter(report => String(report.id) !== String(id));
      save(data);
    }
    toast('Report deleted.');
    renderReports();
  } catch (error) {
    toast(error?.message || 'Unable to delete the activity report.', 'error');
  }
};

// Section 16: Report Summary, Printing & PDF Export

/**
 * Open Printable Report Summary Window
 *
 * What it does:
 * Formats all filtered reports into a clean, printer-friendly summary document with statistics, tables, and narrative insights, then opens the browser's print dialog.
 *
 * Backup plan if it breaks:
 * If no reports match the current filters, or if the browser blocks pop-ups, it displays a helpful notification rather than failing silently.
 */
function printReportSummary(
  data
) {
  const reports =
    filteredReports(data);

  if (!reports.length) {
    toast(
      'No report data is available for the selected filters.',
      'error'
    );

    return;
  }

  const summary =
    calculateReportSummary(
      reports
    );

  const byType =
    groupActivitiesByType(
      reports
    );

  const byChapter =
    groupActivitiesByChapter(
      reports
    );

  const insights =
    generateReportInsights(
      reports
    );

  const win =
    window.open(
      '',
      '_blank',
      'width=1000,height=800'
    );

  if (!win) {
    toast(
      'Allow pop-ups to open the printable report.',
      'error'
    );

    return;
  }

  try {
    win.opener = null;
  } catch {
    // Some browsers do not allow changing opener; printing can still continue.
  }

  const rows =
    reports
      .map(
        report => `
          <tr>
            <td>
              ${fmtDate(
          report.date
        )}
            </td>

            <td>
              ${esc(
          report.title
        )}
            </td>

            <td>
              ${esc(
          report.chapter ||
          '—'
        )}
            </td>

            <td>
              ${esc(
          report.type ||
          '—'
        )}
            </td>

            <td>
              ${Number(
          report.participants ||
          0
        )}
            </td>

            <td>
              ${esc(
          report.location ||
          '—'
        )}
            </td>
          </tr>
        `
      )
      .join('');

  win.document.write(`
    <!doctype html>

    <html>
      <head>

        <title>
          MFC Youth Activity Summary Report
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            color: #17263a;
            margin:  36px;
          }

          h1,
          h2 {
            color: #002847;
          }

          h1 {
            font-size: 20px;
            margin-bottom: 2px;
          }

          .sub {
            color: #687386;
          }

          .meta {
            margin: 18px 0;
            padding: 12px;
            background: #f4f7fb;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin: 18px 0;
          }

          .stat {
            border: 1px solid #dce3eb;
            padding: 10px;
          }

          .stat strong {
            display: block;
            font-size: 20px;
            color: #002847;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 22px;
            font-size: 12px;
          }

          th,
          td {
            border: 1px solid #dce3eb;
            padding: 7px;
            text-align: left;
          }

          th {
            background: #eef4f8;
          }

          li {
            margin-bottom: 6px;
          }

          @media print {
            body {
              margin: 18mm;
            }

            .no-print {
              display: none;
            }
          }

        </style>

      </head>

      <body>

        <h1>
          MFC YOUTH
        </h1>

        <div class="sub">
          Area Management System
        </div>

        <h2>
          Activity Summary Report
        </h2>

        <div class="meta">

          <strong>
            Scope:
          </strong>

          ${esc(
    reportScopeText()
  )}

          <br>

          <strong>
            Generated:
          </strong>

          ${esc(
    new Date().toLocaleString(
      'en-PH'
    )
  )}

        </div>

        <div class="stats">

          <div class="stat">
            Activities
            <strong>
              ${summary.totalActivities}
            </strong>
          </div>

          <div class="stat">
            Participants
            <strong>
              ${summary.totalParticipants}
            </strong>
          </div>

          <div class="stat">
            Average
            <strong>
              ${summary.averageAttendance}
            </strong>
          </div>

          <div class="stat">
            Chapters
            <strong>
              ${summary.chaptersInvolved}
            </strong>
          </div>

          <div class="stat">
            Types
            <strong>
              ${summary.activityTypes}
            </strong>
          </div>

        </div>

        <h2>
          Activity Breakdown
        </h2>

        <table>

          <thead>
            <tr>
              <th>
                Type
              </th>

              <th>
                Activities
              </th>

              <th>
                Participants
              </th>
            </tr>
          </thead>

          <tbody>

            ${byType
      .map(
        item => `
                  <tr>

                    <td>
                      ${esc(
          item.type
        )}
                    </td>

                    <td>
                      ${item.count}
                    </td>

                    <td>
                      ${item.participants}
                    </td>

                  </tr>
                `
      )
      .join('')}

          </tbody>

        </table>

        <h2>
          Chapter Summary
        </h2>

        <table>

          <thead>
            <tr>
              <th>
                Chapter
              </th>

              <th>
                Activities
              </th>

              <th>
                Participants
              </th>
            </tr>
          </thead>

          <tbody>

            ${byChapter
      .map(
        item => `
                  <tr>

                    <td>
                      ${esc(
          item.chapter
        )}
                    </td>

                    <td>
                      ${item.count}
                    </td>

                    <td>
                      ${item.participants}
                    </td>

                  </tr>
                `
      )
      .join('')}

          </tbody>

        </table>

        <h2>
          Activity Details
        </h2>

        <table>

          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th>Chapter</th>
              <th>Type</th>
              <th>Participants</th>
              <th>Location</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

        <h2>
          Report Insights
        </h2>

        <ul>
          ${insights
      .map(
        insight => `
                <li>
                  ${esc(
          insight
        )}
                </li>
              `
      )
      .join('')}
        </ul>

        <p class="sub">
          Generated by MFC Youth Area Management System
        </p>

        <script>
          window.onload = () => window.print();
        <\/script>

      </body>

    </html>
  `);

  win.document.close();
}

// =========================================================
// EXPORT PDF
// =========================================================

/**
 * Generate and Download Activity Reports PDF File
 *
 * What it does:
 * Generates an official, publication-ready PDF document containing header information, executive statistics, type and chapter breakdowns, an itemized table, and insights.
 *
 * Backup plan if it breaks:
 * Checks if the PDF generating library is available in the browser. If it failed to load due to connection problems, it alerts the user to check their internet connection instead of crashing.
 */
function exportReportsPdf(
  data
) {
  const reports =
    filteredReports(data);

  if (!reports.length) {
    toast(
      'No report data is available for the selected filters.',
      'error'
    );

    return;
  }

  if (
    !window.jspdf?.jsPDF
  ) {
    toast(
      'PDF library failed to load. Check your internet connection and try again.',
      'error'
    );

    return;
  }

  const { jsPDF } =
    window.jspdf;

  const doc =
    new jsPDF({
      unit: 'pt',
      format: 'letter'
    });

  if (
    typeof doc.autoTable !==
    'function'
  ) {
    toast(
      'PDF table library failed to load. Please try again.',
      'error'
    );

    return;
  }

  const summary =
    calculateReportSummary(
      reports
    );

  const byType =
    groupActivitiesByType(
      reports
    );

  const byChapter =
    groupActivitiesByChapter(
      reports
    );

  const insights =
    generateReportInsights(
      reports
    );

  const now =
    new Date();

  let y = 44;

  const left = 42;

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(15);

  doc.text(
    'MFC YOUTH',
    left,
    y
  );

  y += 18;

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(10);

  doc.text(
    'Area Management System',
    left,
    y
  );

  y += 24;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(13);

  doc.text(
    'ACTIVITY SUMMARY REPORT',
    left,
    y
  );

  y += 18;

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(9);

  doc.text(
    `Generated: ${now.toLocaleString(
      'en-PH'
    )}`,
    left,
    y
  );

  y += 13;

  const scopeLines =
    doc.splitTextToSize(
      `Report Scope: ${reportScopeText()}`,
      pageWidth - 84
    );

  doc.text(
    scopeLines,
    left,
    y
  );

  y +=
    scopeLines.length *
    11 +
    10;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'EXECUTIVE SUMMARY',
    left,
    y
  );

  y += 13;

  doc.setFont(
    'helvetica',
    'normal'
  );

  const summaryLines = [
    `Total Activities: ${summary.totalActivities}`,
    `Total Participants: ${summary.totalParticipants}`,
    `Average Attendance: ${summary.averageAttendance}`,
    `Chapters Involved: ${summary.chaptersInvolved}`,
    `Activity Types: ${summary.activityTypes}`
  ];

  summaryLines.forEach(
    line => {
      doc.text(
        line,
        left + 18,
        y
      );

      y += 12;
    }
  );

  y += 8;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'ACTIVITY BREAKDOWN',
    left,
    y
  );

  doc.autoTable({
    startY: y + 8,

    margin: {
      left,
      right: left
    },

    head: [
      [
        'Activity Type',
        'Activities',
        'Participants'
      ]
    ],

    body: byType.map(
      item => [
        item.type,
        String(item.count),
        String(
          item.participants
        )
      ]
    ),

    theme: 'grid',

    styles: {
      fontSize: 8.5
    },

    headStyles: {
      fillColor: [
        0,
        40,
        71
      ]
    }
  });

  y =
    doc.lastAutoTable.finalY +
    16;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'CHAPTER SUMMARY',
    left,
    y
  );

  doc.autoTable({
    startY: y + 8,

    margin: {
      left,
      right: left
    },

    head: [
      [
        'Chapter',
        'Activities',
        'Participants'
      ]
    ],

    body: byChapter.map(
      item => [
        item.chapter,
        String(item.count),
        String(
          item.participants
        )
      ]
    ),

    theme: 'grid',

    styles: {
      fontSize: 8.5
    },

    headStyles: {
      fillColor: [
        8,
        120,
        189
      ]
    }
  });

  y =
    doc.lastAutoTable.finalY +
    16;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'ACTIVITY DETAILS',
    left,
    y
  );

  doc.autoTable({
    startY: y + 8,

    margin: {
      left,
      right: left,
      bottom: 50
    },

    head: [
      [
        'Date',
        'Activity',
        'Chapter',
        'Type',
        'Participants',
        'Location'
      ]
    ],

    body: reports.map(
      report => [
        fmtDate(
          report.date
        ),

        report.title ||
        report.activity ||
        '—',

        report.chapter ||
        '—',

        report.type ||
        '—',

        String(
          Number(
            report.participants ||
            0
          )
        ),

        report.location ||
        '—'
      ]
    ),

    theme: 'striped',

    styles: {
      fontSize: 7.5,
      cellPadding: 4
    },

    headStyles: {
      fillColor: [
        47,
        140,
        90
      ]
    },

    columnStyles: {
      0: {
        cellWidth: 62
      },

      4: {
        cellWidth: 52
      }
    }
  });

  y =
    doc.lastAutoTable.finalY +
    18;

  if (
    y >
    pageHeight - 120
  ) {
    doc.addPage();

    y = 48;
  }

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(9);

  doc.text(
    'REPORT INSIGHTS',
    left,
    y
  );

  y += 13;

  doc.setFont(
    'helvetica',
    'normal'
  );

  insights.forEach(
    insight => {
      const lines =
        doc.splitTextToSize(
          `• ${insight}`,
          pageWidth - 100
        );

      if (
        y +
        lines.length * 11 >
        pageHeight - 55
      ) {
        doc.addPage();

        y = 48;
      }

      doc.text(
        lines,
        left + 12,
        y
      );

      y +=
        lines.length *
        11 +
        3;
    }
  );

  const totalPages =
    doc.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber++
  ) {
    doc.setPage(
      pageNumber
    );

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(8);

    doc.setTextColor(90);

    doc.text(
      'MFC Youth Area Management System',
      left,
      pageHeight - 24
    );

    doc.text(
      `Generated ${now.toLocaleDateString(
        'en-PH'
      )}`,
      pageWidth - 170,
      pageHeight - 24
    );

    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth / 2 - 22,
      pageHeight - 24
    );

    doc.setTextColor(0);
  }

  const suffix =
    reportFilters.from ||
      reportFilters.to
      ? `${reportFilters.from ||
      'start'
      }_to_${reportFilters.to ||
      todayISO()
      }`
      : now
        .toISOString()
        .slice(0, 10);

  doc.save(
    `MFCYouth_Activity_Report_${suffix}.pdf`
  );

  toast(
    'PDF report generated.'
  );
}
