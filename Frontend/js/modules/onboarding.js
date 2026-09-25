/**
 * ============================================================================
 * MFC Youth Area Management System - Area Onboarding Wizard
 * ============================================================================
 */

// Section 18: Area Onboarding Wizard

function isLeadershipSession() {
  return ['couple_coordinator', 'area_servant', 'lit_servant', 'campus_servant', 'mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(
    String(session?.role || '').trim().toLowerCase()
  );
}

async function showAreaOnboarding() {
  if (
    page !== 'dashboard' ||
    session?.demo ||
    !session?.backendAuth ||
    !isLeadershipSession() ||
    (session?.areaId && !session?.needsAreaSetup)
  ) {
    return;
  }

  const root = document.getElementById('modalRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="modal-backdrop area-onboarding-backdrop" id="areaOnboardingBackdrop">
      <section class="modal area-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="areaOnboardingTitle">
        <header class="modal-header area-onboarding-header">
          <div>
            <span class="area-onboarding-kicker">Account Setup</span>
            <h2 id="areaOnboardingTitle">Select Your MFC Youth Area</h2>
          </div>
        </header>
        <div class="modal-body">
          <p class="area-onboarding-intro">
            Your Servant Leader account was created successfully. Before entering the management system, connect it to the Area you serve.
          </p>
          <div id="areaOnboardingMessage"></div>

          <div class="area-setup-panel" id="existingAreaPanel">
            <label class="form-group" for="onboardingAreaSelect">
              <span>Existing Area</span>
              <select class="text-input" id="onboardingAreaSelect" disabled>
                <option value="">Loading Areas…</option>
              </select>
            </label>
            <button class="btn blue" id="confirmAreaButton" type="button" disabled>Continue with Selected Area</button>
          </div>

          <div class="area-onboarding-divider"><span>or</span></div>

          <button class="btn area-create-toggle" id="showCreateAreaButton" type="button">Create Area-Based Account</button>

          <div class="area-setup-panel hidden" id="createAreaPanel">
            <label class="form-group" for="newAreaName">
              <span>Area Name</span>
              <input class="text-input" id="newAreaName" type="text" maxlength="120" placeholder="e.g. MFC Youth NCR East">
            </label>
            <p class="field-help">The backend will create the Area in Supabase and connect this account to it. Standard service records will also be prepared for the new Area.</p>
            <div class="area-create-actions">
              <button class="btn" id="cancelCreateAreaButton" type="button">Cancel</button>
              <button class="btn blue" id="createAreaButton" type="button">Create Area-Based Account</button>
            </div>
          </div>

          ${session?.role === 'chapter_servant' ? `
            <p class="area-chapter-note">Chapter Servant accounts will still need a Chapter assignment inside this Area before chapter-scoped tools become available.</p>
          ` : ''}
        </div>
      </section>
    </div>
  `;

  const message = document.getElementById('areaOnboardingMessage');
  const select = document.getElementById('onboardingAreaSelect');
  const confirmButton = document.getElementById('confirmAreaButton');
  const showCreateButton = document.getElementById('showCreateAreaButton');
  const createPanel = document.getElementById('createAreaPanel');
  const existingPanel = document.getElementById('existingAreaPanel');
  const createButton = document.getElementById('createAreaButton');
  const cancelCreateButton = document.getElementById('cancelCreateAreaButton');
  const newAreaName = document.getElementById('newAreaName');

  const showAreaMessage = (text, type = 'error') => {
    if (!message) return;
    message.innerHTML = `<div class="message ${type}" role="status">${esc(text)}</div>`;
  };

  const finishAreaSetup = (area, profile = null, member = null) => {
    const updated = {
      ...session,
      areaId: area.id,
      areaName: area.name,
      memberId: profile?.member_id ?? member?.id ?? session?.memberId ?? null,
      chapterId: profile?.chapter_id ?? session?.chapterId ?? null,
      needsAreaSetup: false
    };
    updateStoredSession(updated);

    navigateWithLoader('/dashboard', true);
  };

  try {
    const payload = await backendApi('/api/areas');
    const areas = Array.isArray(payload?.areas) ? payload.areas : [];
    select.innerHTML = `
      <option value="">Select your Area</option>
      ${areas.map(area => `<option value="${esc(area.id)}">${esc(area.name)}</option>`).join('')}
    `;
    select.disabled = false;
    confirmButton.disabled = false;

    if (!areas.length) {
      showAreaMessage('No Area records are available yet. Create the first Area-Based Account below.', 'success');
    }
  } catch (error) {
    select.innerHTML = '<option value="">Unable to load Areas</option>';
    showAreaMessage(error?.message || 'Unable to retrieve Areas from the backend.');
  }

  confirmButton?.addEventListener('click', async () => {
    const areaId = select?.value || '';
    if (!areaId) {
      showAreaMessage('Select an Area before continuing.');
      return;
    }

    const original = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.textContent = 'Connecting…';
    try {
      const payload = await backendApi('/api/areas/select', {
        method: 'POST',
        body: JSON.stringify({ areaId })
      });
      showAreaMessage(`Connected to ${payload.area.name}.`, 'success');
      setTimeout(() => finishAreaSetup(payload.area, payload.profile, payload.member), 350);
    } catch (error) {
      confirmButton.disabled = false;
      confirmButton.textContent = original;
      showAreaMessage(error?.message || 'Unable to connect this account to the selected Area.');
    }
  });

  showCreateButton?.addEventListener('click', () => {
    createPanel?.classList.remove('hidden');
    existingPanel?.classList.add('area-setup-muted');
    showCreateButton.classList.add('hidden');
    newAreaName?.focus();
  });

  cancelCreateButton?.addEventListener('click', () => {
    createPanel?.classList.add('hidden');
    existingPanel?.classList.remove('area-setup-muted');
    showCreateButton?.classList.remove('hidden');
    if (newAreaName) newAreaName.value = '';
  });

  createButton?.addEventListener('click', async () => {
    const name = String(newAreaName?.value || '').trim();
    if (name.length < 3) {
      showAreaMessage('Enter a valid Area name.');
      return;
    }

    const original = createButton.textContent;
    createButton.disabled = true;
    createButton.textContent = 'Creating Area…';
    try {
      const payload = await backendApi('/api/areas', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      showAreaMessage(`${payload.area.name} was created and linked to your account.`, 'success');
      setTimeout(() => finishAreaSetup(payload.area, payload.profile, payload.member), 400);
    } catch (error) {
      createButton.disabled = false;
      createButton.textContent = original;
      const existing = error?.body?.existingArea;
      if (existing?.id) {
        showAreaMessage('That Area already exists. Select it from the Existing Area list instead.');
      } else {
        showAreaMessage(error?.message || 'Unable to create the Area.');
      }
    }
  });
}
