/**
 * Daily Scripture Readings Module
 *
 * What it Does: Simple non IT Terms
 * Displays Catholic daily Mass Scripture readings (First Reading, Psalm, Gospel)
 * for personal reflection and community prayer, timed to Philippine date.
 */

/**
 * Formats Scripture Reading Body
 *
 * What it does:
 * Splits raw reading text into readable paragraph blocks and formats internal line breaks.
 *
 * Backup plan if it breaks:
 * Displays a notice pointing to the online source link if reading text content is empty.
 */
function formatReadingText(text) {
  if (!text || !String(text).trim()) {
    return '<p class="muted" style="font-style: italic;">Full text is available through the source link above.</p>';
  }
  const paragraphs = String(text).split(/\n\s*\n/);
  return paragraphs.map(p => {
    const safeText = esc(p.trim()).replace(/\n/g, '<br>');
    return `<p style="margin: 0 0 1rem 0; line-height: 1.7; font-size: 1rem;">${safeText}</p>`;
  }).join('');
}

/**
 * Displays Scripture Loading Error Screen
 *
 * What it does:
 * Shows a reassuring recovery card with a retry button when scripture readings cannot be retrieved.
 *
 * Backup plan if it breaks:
 * Attaches safe click handlers to re-invoke the failed date request without reloading the whole browser.
 */
function renderReadingsError(retryFn) {
  const container = document.getElementById('readingsBody');
  if (!container) return;

  container.innerHTML = `
    <section class="card readings-error-card" role="alert" style="text-align: center; padding: 3rem 1.5rem; max-width: 520px; margin: 2rem auto;">
      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem;">Daily readings are unavailable right now.</h3>
      <p class="muted" style="margin: 0 0 1.5rem 0;">Try again in a moment.</p>
      <button class="btn blue" id="readingsRetryBtn" type="button">Try Again</button>
    </section>
  `;

  document.getElementById('readingsRetryBtn')?.addEventListener('click', () => {
    if (typeof retryFn === 'function') retryFn();
  });
}

/**
 * Injects Scripture Reading Content
 *
 * What it does:
 * Renders the feast celebration header, translation badge, citation source, and reading cards onto the page.
 *
 * Backup plan if it breaks:
 * Safely displays empty reading indicators if certain passages are omitted or unavailable in the feed.
 */
function renderReadingsContent(data) {
  const container = document.getElementById('readingsBody');
  if (!container) return;

  const readingsList = Array.isArray(data?.readings) ? data.readings : [];
  const celebrationTitle = data?.celebration || 'Daily Readings';
  const translationBadge = data?.translation || 'RSV-CE';
  const sourceUrl = data?.source?.url || 'https://www.ewtn.com/catholicism/daily-readings';

  let dateSubheading = '';
  try {
    const dateObj = new Date(`${data.date}T00:00:00`);
    const dateFormatted = dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const dayName = data.day || dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    dateSubheading = `${dayName} · ${dateFormatted}`;
  } catch (err) {
    dateSubheading = `${data.day || ''} ${data.date || ''}`.trim();
  }

  container.innerHTML = `
    <section class="card readings-header-card" style="margin-bottom: 1.5rem; padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        <div>
          <h2 style="margin: 0 0 0.35rem 0; font-size: 1.4rem;">${esc(celebrationTitle)}</h2>
          <p class="muted" style="margin: 0; font-size: 0.95rem;">${esc(dateSubheading)}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <span class="badge active">${esc(translationBadge)}</span>
          <a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem;">
            EWTN Source &rarr;
          </a>
        </div>
      </div>
    </section>

    <div class="readings-list" style="display: flex; flex-direction: column; gap: 1.25rem;">
      ${readingsList.map(item => `
        <article class="card reading-card" style="padding: 1.5rem;">
          <header class="reading-card-header" style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--line, #e2e8f0);">
            <h3 style="margin: 0 0 0.25rem 0; font-size: 1.2rem; color: var(--primary, #002847);">${esc(item.type || 'Reading')}</h3>
            <p class="muted" style="margin: 0; font-size: 0.95rem; font-weight: 500;">${esc(item.reference || '')}</p>
          </header>
          <div class="reading-body">
            ${formatReadingText(item.text)}
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

/**
 * Fetches Scripture Readings for Date
 *
 * What it does:
 * Requests Catholic daily readings from the server endpoint for the chosen calendar day and displays a loading spinner.
 *
 * Backup plan if it breaks:
 * Catches connection drops or scraping errors and directs the user to the friendly recovery card.
 */
function fetchReadings(dateStr) {
  const container = document.getElementById('readingsBody');
  if (container) {
    container.innerHTML = `
      <div class="readings-loading" style="text-align: center; padding: 4rem 1rem;">
        <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid rgba(56, 189, 248, 0.25); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p class="muted" style="margin-top: 1rem;">Loading daily readings...</p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      </div>
    `;
  }

  callApi(`/api/daily-readings?date=${encodeURIComponent(dateStr)}`)
    .then(res => {
      if (res && res.ok) {
        renderReadingsContent(res);
      } else {
        renderReadingsError(() => fetchReadings(dateStr));
      }
    })
    .catch(() => {
      renderReadingsError(() => fetchReadings(dateStr));
    });
}

/**
 * Draws Daily Scripture Screen
 *
 * What it does:
 * Sets up the Scripture Readings page shell with a date picker defaulting to Philippine time and loads today's readings.
 *
 * Backup plan if it breaks:
 * Gracefully handles time zone initialization failures by falling back to local system date.
 */
function renderReadings() {
  const targetContent = content || document.getElementById('pageContent');
  if (!targetContent) return;

  let todayStr = '';
  try {
    todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  } catch (err) {
    todayStr = new Date().toISOString().slice(0, 10);
  }

  targetContent.innerHTML = `
    ${pageHeader(
      'Daily Scripture Readings',
      'Daily Catholic Mass readings and reflections.',
      `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="readingsDatePicker" style="font-weight: 600; font-size: 0.9rem;">Date:</label>
          <input type="date" id="readingsDatePicker" class="text-input" value="${todayStr}" style="width: auto; padding: 6px 10px;">
        </div>
      `
    )}

    <div id="readingsBody" class="readings-container" style="margin-top: 1.5rem;"></div>
  `;

  const datePicker = document.getElementById('readingsDatePicker');
  if (datePicker) {
    datePicker.addEventListener('change', e => {
      const selected = e.target.value;
      if (selected) {
        fetchReadings(selected);
      }
    });
  }

  fetchReadings(todayStr);
}

window.renderReadings = renderReadings;
window.fetchReadings = fetchReadings;
