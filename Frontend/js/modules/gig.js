/**
 * GIG Stewardship and Tithes Management Module
 *
 * What it Does: Simple non IT Terms
 * Tracks and displays voluntary youth community tithes and financial offerings.
 * Leaders can record new contributions, view monthly collection summaries, and review giving logs.
 */

let gigData = [];
let gigMonthFilter = 'All';
let isFetchingGig = false;
let gigHasFetched = false;

/**
 * Formats Contribution Date for Display
 *
 * What it does:
 * Converts a raw date string into a clean readable date format like Oct 4, 2026.
 *
 * Backup plan if it breaks:
 * Returns the raw date string unchanged if date parsing encounters invalid values.
 */
function formatGigDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Builds Month Filter Option List
 *
 * What it does:
 * Generates an array containing an All option and the last twelve calendar months.
 *
 * Backup plan if it breaks:
 * Falls back to returning just the default All option if calendar calculations encounter an error.
 */
function getGigMonthOptions() {
  const options = [{ value: 'All', label: 'All' }];
  try {
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
  } catch (err) {
    return [{ value: 'All', label: 'All' }];
  }
  return options;
}

/**
 * Retrieves GIG Contributions From Server
 *
 * What it does:
 * Requests the list of recorded youth contributions from the cloud database and refreshes the display.
 *
 * Backup plan if it breaks:
 * Catches communication failures and alerts the leader with an error notification.
 */
function fetchGig() {
  if (isFetchingGig) return;
  isFetchingGig = true;

  callApi('/api/gig')
    .then(res => {
      gigData = Array.isArray(res?.gig) ? res.gig : [];
      gigHasFetched = true;
      renderGig();
    })
    .catch(err => {
      showToast(err?.message || 'Failed to load GIG contributions.', 'error');
    })
    .finally(() => {
      isFetchingGig = false;
    });
}

/**
 * Removes a Single GIG Contribution
 *
 * What it does:
 * Prompts the leader for confirmation and deletes the selected contribution record from the database.
 *
 * Backup plan if it breaks:
 * Displays an error alert without modifying local records if the server deletion request fails.
 */
async function deleteGig(id) {
  if (!id) return;
  const confirmed = window.confirm('Are you sure you want to delete this contribution?');
  if (!confirmed) return;

  try {
    const res = await callApi(`/api/gig?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res && res.ok) {
      showToast('Contribution deleted successfully.', 'success');
      fetchGig();
    } else {
      showToast(res?.error || 'Failed to delete contribution.', 'error');
    }
  } catch (error) {
    showToast(error?.message || 'Error deleting contribution.', 'error');
  }
}

/**
 * Handles Contribution Form Submission
 *
 * What it does:
 * Reads member, amount, date, and notes from the modal form and submits them to the GIG recording API.
 *
 * Backup plan if it breaks:
 * Validates required inputs before sending and keeps the modal open if the submission encounters an error.
 */
async function submitGig(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }

  const memberId = document.getElementById('gigMember')?.value;
  const amountVal = document.getElementById('gigAmount')?.value;
  const date = document.getElementById('gigDate')?.value;
  const note = (document.getElementById('gigNote')?.value || '').trim();
  const amount = Number(amountVal);

  if (!memberId) {
    showToast('Please select a member.', 'error');
    return;
  }
  if (!amount || amount < 1) {
    showToast('Amount must be at least 1.', 'error');
    return;
  }
  if (!date) {
    showToast('Please select a valid date.', 'error');
    return;
  }

  const submitBtn = document.getElementById('gigSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    const res = await callApi('/api/gig', {
      method: 'POST',
      body: JSON.stringify({ memberId, amount, date, note })
    });

    if (res && res.ok) {
      closeModal();
      showToast('GIG contribution recorded successfully.', 'success');
      fetchGig();
    } else {
      showToast(res?.error || 'Failed to record contribution.', 'error');
    }
  } catch (error) {
    showToast(error?.message || 'Error saving contribution.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  }
}

/**
 * Opens Record GIG Contribution Modal
 *
 * What it does:
 * Displays a popup dialog containing inputs for selecting a member, entering amount and date, and writing notes.
 *
 * Backup plan if it breaks:
 * Scopes member choices based on the leader permissions and defaults the date safely to today.
 */
function openGigModal() {
  const data = db();
  let membersList = data.members || [];

  if (typeof isChapterServantSession === 'function' && isChapterServantSession()) {
    const chapter = scopedChapter(data);
    membersList = chapter
      ? membersList.filter(m => String(m.chapterId) === String(chapter.id))
      : [];
  }

  membersList.sort((a, b) => {
    const nameA = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase();
    const nameB = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());

  const modalHtml = `
    <form id="gigForm" onsubmit="submitGig(event)">
      <div class="form-grid">
        <div class="form-group full">
          <label for="gigMember">Member <span class="required">*</span></label>
          <select class="select-input" id="gigMember" name="memberId" required>
            <option value="" disabled selected>Select a member</option>
            ${membersList.map(m => `
              <option value="${esc(m.id)}">${esc(`${m.firstName} ${m.lastName}`.trim())}${m.chapterName ? ` (${esc(m.chapterName)})` : ''}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="gigAmount">Amount (₱) <span class="required">*</span></label>
          <input class="text-input" type="number" id="gigAmount" name="amount" min="1" step="1" required placeholder="0">
        </div>

        <div class="form-group">
          <label for="gigDate">Date <span class="required">*</span></label>
          <input class="text-input" type="date" id="gigDate" name="date" required value="${todayStr}">
        </div>

        <div class="form-group full">
          <label for="gigNote">Note (optional)</label>
          <textarea class="text-input" id="gigNote" name="note" maxlength="500" rows="3" placeholder="Optional notes..."></textarea>
        </div>
      </div>

      <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn blue" id="gigSubmitBtn">Submit</button>
      </div>
      <style>#modalBackdrop .modal-footer { display: none; }</style>
    </form>
  `;

  openModal('Record GIG', modalHtml);
}

/**
 * Draws GIG Stewardship Screen
 *
 * What it does:
 * Renders statistical summary cards, monthly filters, and contribution records for youth ministry tithes.
 *
 * Backup plan if it breaks:
 * Automatically triggers server retrieval if records are not yet cached and renders an empty state when logs are blank.
 */
function renderGig() {
  if (!gigHasFetched && !isFetchingGig) {
    fetchGig();
  }

  const targetContent = content || document.getElementById('pageContent');
  if (!targetContent) return;

  const currentRole = session?.role || '';
  const canManage = ['area_servant', 'couple_coordinator', 'lit_servant', 'chapter_servant'].includes(currentRole);

  const phDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  const currentYear = phDateStr.slice(0, 4);
  const currentMonth = phDateStr.slice(0, 7);

  let totalCollected = 0;
  let totalYtd = 0;
  let totalMtd = 0;
  const activeGiversSet = new Set();

  gigData.forEach(item => {
    const amt = Number(item.amount || 0);
    totalCollected += amt;
    const itemDate = String(item.contribution_date || '');
    if (itemDate.startsWith(currentYear)) {
      totalYtd += amt;
    }
    if (itemDate.startsWith(currentMonth)) {
      totalMtd += amt;
    }
    if (item.member_id) {
      activeGiversSet.add(String(item.member_id));
    }
  });

  const monthOptions = getGigMonthOptions();

  const filteredList = gigData.filter(item => {
    if (gigMonthFilter === 'All') return true;
    return String(item.contribution_date || '').startsWith(gigMonthFilter);
  });

  const data = db();
  const membersMap = new Map((data.members || []).map(m => [String(m.id), `${m.firstName} ${m.lastName}`.trim()]));

  targetContent.innerHTML = `
    ${pageHeader(
      'GIG Stewardship',
      'Give It Generously (GIG) voluntary contributions and tithes tracking.',
      canManage ? `
        <button class="btn blue" id="recordGigBtn" type="button">
          + Record GIG
        </button>
      ` : ''
    )}

    <div class="stat-grid">
      <section class="card stat-card">
        <span>Total Collected</span>
        <strong>₱${Math.round(totalCollected).toLocaleString('en-PH')}</strong>
      </section>

      <section class="card stat-card">
        <span>YTD</span>
        <strong>₱${Math.round(totalYtd).toLocaleString('en-PH')}</strong>
      </section>

      <section class="card stat-card">
        <span>MTD</span>
        <strong>₱${Math.round(totalMtd).toLocaleString('en-PH')}</strong>
      </section>

      <section class="card stat-card">
        <span>Active Givers</span>
        <strong>${activeGiversSet.size}</strong>
      </section>
    </div>

    <div class="toolbar">
      <div class="grow">
        <label for="gigMonthSelect" class="compact-filter" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600;">
          Month:
          <select class="select-input compact-filter" id="gigMonthSelect">
            ${monthOptions.map(opt => `
              <option value="${esc(opt.value)}" ${gigMonthFilter === opt.value ? 'selected' : ''}>${esc(opt.label)}</option>
            `).join('')}
          </select>
        </label>
      </div>
    </div>

    <div class="result-count">
      Showing ${filteredList.length} of ${gigData.length} contribution${gigData.length === 1 ? '' : 's'}
    </div>

    <section class="card table-wrap">
      ${filteredList.length ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Notes</th>
              ${canManage ? '<th>Action</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${filteredList.map(item => {
              const memberName = membersMap.get(String(item.member_id)) || 'Unknown Member';
              return `
                <tr>
                  <td><strong>${esc(memberName)}</strong></td>
                  <td>₱${Math.round(Number(item.amount || 0)).toLocaleString('en-PH')}</td>
                  <td>${esc(formatGigDate(item.contribution_date))}</td>
                  <td>${esc(item.notes || '')}</td>
                  ${canManage ? `
                    <td>
                      <button class="btn red" type="button" onclick="deleteGig('${esc(item.id)}')">
                        Delete
                      </button>
                    </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      ` : emptyState('No GIG contributions found', 'No contributions recorded for the selected period.')}
    </section>
  `;

  document.getElementById('recordGigBtn')?.addEventListener('click', openGigModal);

  document.getElementById('gigMonthSelect')?.addEventListener('change', e => {
    gigMonthFilter = e.target.value;
    renderGig();
  });
}

window.renderGig = renderGig;
window.fetchGig = fetchGig;
window.deleteGig = deleteGig;
window.openGigModal = openGigModal;
window.submitGig = submitGig;
