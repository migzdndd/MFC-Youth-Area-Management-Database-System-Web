/**
 * MFC Youth Area Management System - First-Time Leader Area Connection Wizard
 *
 * What this file does:
 * When a newly registered coordinator or servant leader logs in for the first time,
 * this wizard guides them to choose which Area they serve (or create a new Area)
 * before taking them into their management dashboard.
 *
 * Backup plan if it breaks:
 * If area information fails to load from the server, the wizard displays a friendly message
 * and allows leaders to create their area directly. If connection fails, it unlocks the buttons
 * so they can try again without losing their place.
 */

/**
 * Check If User Is a Servant Leader
 *
 * What it does:
 * Verifies whether the logged-in person is an area leader (like an Area Servant, Coordinator,
 * or Chapter Servant) who needs to be linked to a specific Area.
 *
 * Backup plan if it breaks:
 * If the role is missing or unreadable, it safely returns false so regular members are never shown this setup prompt.
 */
function isLeadershipSession() {
  return ['couple_coordinator', 'area_servant', 'lit_servant', 'campus_servant', 'mfc_high_servant', 'area_kids_servant', 'chapter_servant'].includes(
    String(session?.role || '').trim().toLowerCase()
  );
}

/**
 * Open Area Setup Wizard
 *
 * What it does:
 * Pops up a setup window asking new leaders to choose their Area from a dropdown list,
 * or type in the name of a new Area if their area hasn't been set up yet.
 *
 * Backup plan if it breaks:
 * If the server cannot be reached, it updates the dropdown with "Unable to load Areas"
 * and displays an easy-to-read explanation. Submit buttons automatically re-enable on failure.
 */
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
    <div
      class="modal-backdrop area-onboarding-backdrop"
      id="areaOnboardingBackdrop"
      x-data="{
        open: true,
        showCreate: false,
        isConnecting: false,
        isCreating: false,
        message: '',
        messageType: 'error',
        selectedArea: '',
        newArea: '',
        close() { this.open = false; }
      }"
      x-show="open"
      x-transition.opacity
    >
      <section class="modal area-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="areaOnboardingTitle" x-show="open" x-transition>
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
          <div id="areaOnboardingMessage" class="message" role="status" x-show="message" :class="messageType" x-text="message"></div>

          <div class="area-setup-panel" id="existingAreaPanel" x-show="!showCreate" x-transition>
            <label class="form-group" for="onboardingAreaSelect">
              <span>Existing Area</span>
              <select class="text-input" id="onboardingAreaSelect" x-model="selectedArea" disabled>
                <option value="">Loading Areas…</option>
              </select>
            </label>
            <button class="btn blue" id="confirmAreaButton" type="button" x-bind:disabled="!selectedArea || isConnecting" disabled>
              <span x-show="!isConnecting">Continue with Selected Area</span>
              <span x-show="isConnecting" style="display: none;">Connecting…</span>
            </button>
          </div>

          <div class="area-onboarding-divider" x-show="!showCreate"><span>or</span></div>

          <button class="btn area-create-toggle" id="showCreateAreaButton" type="button" x-show="!showCreate" @click="showCreate = true">Create Area-Based Account</button>

          <div class="area-setup-panel" id="createAreaPanel" x-show="showCreate" x-transition style="display: none;">
            <label class="form-group" for="newAreaName">
              <span>Area Name</span>
              <input class="text-input" id="newAreaName" type="text" maxlength="120" placeholder="e.g. MFC Youth NCR East" x-model="newArea">
            </label>
            <p class="field-help">The backend will create the Area in Supabase and connect this account to it. Standard service records will also be prepared for the new Area.</p>
            <div class="area-create-actions">
              <button class="btn" id="cancelCreateAreaButton" type="button" @click="showCreate = false; newArea = '';">Cancel</button>
              <button class="btn blue" id="createAreaButton" type="button" x-bind:disabled="newArea.trim().length < 3 || isCreating">
                <span x-show="!isCreating">Create Area-Based Account</span>
                <span x-show="isCreating" style="display: none;">Creating Area…</span>
              </button>
            </div>
          </div>

          ${session?.role === 'chapter_servant' ? `
            <p class="area-chapter-note">Chapter Servant accounts will still need a Chapter assignment inside this Area before chapter-scoped tools become available.</p>
          ` : ''}
        </div>
      </section>
    </div>
  `;

  if (window.Alpine) {
    window.Alpine.initTree(root);
  }

  const backdrop = document.getElementById('areaOnboardingBackdrop');
  const select = document.getElementById('onboardingAreaSelect');
  const confirmButton = document.getElementById('confirmAreaButton');
  const createButton = document.getElementById('createAreaButton');
  const newAreaName = document.getElementById('newAreaName');

  const getAlpineState = () => backdrop?._x_dataStack?.[0] || null;

  /** Shows status messages inside the setup card */
  const showAreaMessage = (text, type = 'error') => {
    const state = getAlpineState();
    if (state) {
      state.message = text;
      state.messageType = type;
    } else {
      const msgEl = document.getElementById('areaOnboardingMessage');
      if (msgEl) {
        msgEl.textContent = text;
        msgEl.className = `message ${type}`;
        msgEl.style.display = 'block';
      }
    }
  };

  /** Saves chosen area to session memory and redirects into the dashboard */
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

  // Load existing Area choices from the server
  try {
    const payload = await backendApi('/api/areas');
    const areas = Array.isArray(payload?.areas) ? payload.areas : [];
    select.innerHTML = `
      <option value="">Select your Area</option>
      ${areas.map(area => `<option value="${esc(area.id)}">${esc(area.name)}</option>`).join('')}
    `;
    select.disabled = false;
    select.dispatchEvent(new Event('change'));
    confirmButton.disabled = false;

    if (!areas.length) {
      showAreaMessage('No Area records are available yet. Create the first Area-Based Account below.', 'success');
    }
  } catch (error) {
    select.innerHTML = '<option value="">Unable to load Areas</option>';
    showAreaMessage(error?.message || 'Unable to retrieve Areas from the backend.');
  }

  // Handle selecting an existing area
  confirmButton?.addEventListener('click', async () => {
    const areaId = select?.value || '';
    if (!areaId) {
      showAreaMessage('Select an Area before continuing.');
      return;
    }

    const state = getAlpineState();
    if (state) state.isConnecting = true;
    else { confirmButton.disabled = true; confirmButton.textContent = 'Connecting…'; }

    try {
      const payload = await backendApi('/api/areas/select', {
        method: 'POST',
        body: JSON.stringify({ areaId })
      });
      showAreaMessage(`Connected to ${payload.area.name}.`, 'success');
      setTimeout(() => finishAreaSetup(payload.area, payload.profile, payload.member), 350);
    } catch (error) {
      if (state) state.isConnecting = false;
      else { confirmButton.disabled = false; confirmButton.textContent = 'Continue with Selected Area'; }
      showAreaMessage(error?.message || 'Unable to connect this account to the selected Area.');
    }
  });

  // Handle creating a new area
  createButton?.addEventListener('click', async () => {
    const name = String(newAreaName?.value || '').trim();
    if (name.length < 3) {
      showAreaMessage('Enter a valid Area name.');
      return;
    }

    const state = getAlpineState();
    if (state) state.isCreating = true;
    else { createButton.disabled = true; createButton.textContent = 'Creating Area…'; }

    try {
      const payload = await backendApi('/api/areas', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      showAreaMessage(`${payload.area.name} was created and linked to your account.`, 'success');
      setTimeout(() => finishAreaSetup(payload.area, payload.profile, payload.member), 400);
    } catch (error) {
      if (state) state.isCreating = false;
      else { createButton.disabled = false; createButton.textContent = 'Create Area-Based Account'; }
      const existing = error?.body?.existingArea;
      if (existing?.id) {
        showAreaMessage('That Area already exists. Select it from the Existing Area list instead.');
      } else {
        showAreaMessage(error?.message || 'Unable to create the Area.');
      }
    }
  });
}
