/**
 * ============================================================================
 * MFC Youth Area Management System - Server Communicator & Data Sync
 * ============================================================================
 * What this file is:
 * This script is the bridge between this web page and the online cloud server.
 * It downloads the newest records (members, chapters, events, reports) and saves
 * an offline copy on your device so everything loads fast.
 *
 * Backup plan if something breaks:
 * If your internet drops or the server is slow, the script stops waiting,
 * keeps your screen running smoothly, and uses the saved records on your device.
 * ============================================================================
 */

// Section 1: Active Requests Tracker

// Keeps track of active questions asked to the server so we don't ask twice at once
const activeApiRequests = new Map();

/**
 * Asks the Online Server for Information or Updates
 *
 * What it does:
 * Sends a secure request to the cloud server to fetch or save area records.
 *
 * Backup plan if it breaks:
 * - If the connection drops or the server is busy, it automatically waits and retries up to 2 times.
 * - If the server takes longer than 8 seconds to answer, it cancels the wait so your page doesn't freeze.
 * - If your login expired, it automatically signs you out so you can sign in again.
 * - If two-factor security is needed, it forwards you to the verification page.
 * - If the internet is completely unavailable, it reports a clean error so the app can fall back to offline data.
 */
async function backendApi(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const maxRetries = method === 'GET' ? Math.min(Math.max(Number(options.maxRetries ?? 2), 0), 2) : 0;
  const timeoutMs = Number(options.timeoutMs || 8000);

  // Avoid asking for the exact same data twice simultaneously
  const dedupeKey = method === 'GET' ? `${path}:${session?.accessToken || ''}:${session?.areaId || ''}` : null;
  if (dedupeKey && activeApiRequests.has(dedupeKey)) {
    return activeApiRequests.get(dedupeKey);
  }

  const executeRequest = async (attempt = 0) => {
    const token = session?.accessToken || '';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };

      if (session?.role === 'national_coordinator' && session?.areaId) {
        headers['X-MFC-Area-ID'] = session.areaId;
      }

      const response = await fetch(path, {
        ...options,
        signal: controller.signal,
        cache: 'no-store',
        headers
      });

      let body = null;
      try {
        body = await response.json();
      } catch {
        body = { ok: false, error: 'The server returned an invalid response.' };
      }

      if (!response.ok) {
        if (response.status === 403 && body?.code === 'MFA_REQUIRED') {
          if (typeof navigateWithLoader === 'function') {
            navigateWithLoader('/mfa-verify.html');
          } else {
            window.location.href = '/mfa-verify.html';
          }
        }
        if (response.status === 401 && (body?.code === 'INVALID_SESSION' || body?.code === 'AUTH_REQUIRED')) {
          if (typeof clearSession === 'function') clearSession();
        }

        // Retry temporary server glitches up to 2 times on viewing requests
        if (attempt < maxRetries && (response.status === 502 || response.status === 503 || response.status === 504)) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 3000);
          await new Promise(r => setTimeout(r, delay));
          return executeRequest(attempt + 1);
        }

        const error = new Error(body?.error || 'Request failed.');
        error.status = response.status;
        error.code = body?.code;
        error.body = body;
        throw error;
      }

      return body;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('The server took too long to respond. Please try again.');
      }

      // Retry temporary connection drops on viewing requests
      if (error instanceof TypeError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 3000);
        await new Promise(r => setTimeout(r, delay));
        return executeRequest(attempt + 1);
      }

      if (error instanceof TypeError) {
        throw new Error('Unable to reach the server. Check your connection and try again.');
      }

      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  if (!dedupeKey) return executeRequest();

  const promise = executeRequest().finally(() => {
    activeApiRequests.delete(dedupeKey);
  });
  activeApiRequests.set(dedupeKey, promise);
  return promise;
}

// Section 2: Online Record Converters (Server to Device)

/**
 * Formats Server Member into Standard Member Profile
 *
 * What it does:
 * Takes member details from the online database and arranges them into standard
 * member profiles that this app understands.
 *
 * Backup plan if it breaks:
 * If any detail (like phone number, youth camp date, or middle name) is missing
 * from the server, it preserves previous saved values or sets safe blank text.
 */
function cloudMemberToLocal(member, previous = {}) {
  const local = {
    ...previous,
    id: member.id,
    areaId: member.area_id ?? previous.areaId ?? null,
    chapterId: member.chapter_id ?? previous.chapterId ?? null,
    firstName: member.first_name || previous.firstName || '',
    middleName: member.middle_name || '',
    lastName: member.last_name || previous.lastName || '',
    birthDate: member.birth_date || '',
    contact: member.contact_number || '',
    email: String(member.email || previous.email || '').trim().toLowerCase(),
    school: member.school || previous.school || '',
    academicTrack: member.academic_track || previous.academicTrack || '',
    gradeLevel: member.grade_level || previous.gradeLevel || '',
    address: member.address || '',
    status: member.status || 'Active',
    firstAttendedYouthCamp: member.first_attended_youth_camp || '',
    accessLevel: normalizeAccessRole(member.access_level || 'member'),
    createdAt: member.created_at || previous.createdAt || null,
    updatedAt: member.updated_at || previous.updatedAt || null,
    services: Array.isArray(previous.services) ? previous.services.map(normalizeServiceName).filter(Boolean) : [],
    chapterName: previous.chapterName || '',
    cloudBacked: true
  };
  local.services = detectedMemberServices(local);
  return local;
}

/**
 * Syncs Member Roster from Server to Device Storage
 *
 * What it does:
 * Downloads the newest list of youth members for your Area and saves a local copy
 * in browser storage so the Members page loads instantly.
 *
 * Backup plan if it breaks:
 * - If you have no internet or are testing in demo mode, it exits safely.
 * - The Members page continues to run smoothly using your saved offline records.
 */
async function syncBackendMembersIntoLocalDb() {
  if (!session?.backendAuth || session?.demo || !session?.areaId) return false;

  const payload = await backendApi('/api/members');
  const cloudMembers = Array.isArray(payload?.members) ? payload.members : [];
  const data = db();
  const previousMembers = Array.isArray(data.members) ? data.members : [];

  data.members = cloudMembers.map(cloudMember => {
    const email = String(cloudMember.email || '').trim().toLowerCase();
    const previous = previousMembers.find(localMember =>
      String(localMember.id) === String(cloudMember.id) ||
      (email && String(localMember.email || '').trim().toLowerCase() === email)
    ) || {};
    return cloudMemberToLocal(cloudMember, previous);
  });

  save(data);
  return true;
}

/**
 * Formats Server Event into Standard Gathering
 *
 * What it does:
 * Converts raw event data from the server into a standard gathering object
 * with Philippine local date, time, venue, and fee.
 *
 * Backup plan if it breaks:
 * If the start date is invalid or missing, it sets an empty date string.
 * If the fee is missing, it sets 0 (Free) so the gathering card displays cleanly.
 */
function cloudEventToLocal(row) {
  let localDateTime = '';
  if (row.starts_at) {
    const date = new Date(row.starts_at);
    if (!Number.isNaN(date.getTime())) {
      const phTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
      localDateTime = phTime.toISOString().slice(0, 16);
    }
  }

  return {
    id: row.id,
    areaId: row.area_id,
    name: row.name || '',
    date: localDateTime,
    fee: Number(row.fee || 0),
    venue: row.venue || '',
    peopleAttended: Number(row.manual_attendance || 0),
    description: row.description || '',
    cloudBacked: true
  };
}

/**
 * Formats Server Participant into Standard Registration
 *
 * What it does:
 * Converts raw attendance and sign-up records from the cloud into standard
 * event registration records.
 *
 * Backup plan if it breaks:
 * If payment or attendance info is missing, it defaults safely to "Cash",
 * "Unpaid", and attended to false.
 */
function cloudParticipantToLocal(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    memberId: row.member_id,
    paymentMode: row.mode_of_payment || 'Cash',
    paymentStatus: row.payment_status || 'Unpaid',
    attended: Boolean(row.attended),
    cloudBacked: true
  };
}

/**
 * Formats Server Contribution into Standard Record
 *
 * What it does:
 * Converts GIG (God Is Good) youth community contributions from the cloud
 * into standard contribution records.
 *
 * Backup plan if it breaks:
 * If the amount or note is blank, it safely sets 0 and a blank note.
 */
function cloudGigToLocal(row) {
  return {
    id: row.id,
    memberId: row.member_id,
    chapterId: row.chapter_id || null,
    date: row.contribution_date,
    amount: Number(row.amount || 0),
    note: row.notes || '',
    cloudBacked: true
  };
}

/**
 * Syncs All Activity Modules from Server to Device Storage
 *
 * What it does:
 * Downloads chapters, ministries, gatherings, attendance, reports, and financial
 * contributions from the server in one batch, then saves an offline copy.
 *
 * Backup plan if it breaks:
 * If you are offline, demo-mode, or the server takes more than 10 seconds, it cancels
 * gracefully and allows the dashboard to keep displaying your saved offline records.
 */
async function syncCloudModulesIntoLocalDb() {
  if (!session?.backendAuth || session?.demo || !session?.areaId) return false;

  const payload = await backendApi('/api/sync', { timeoutMs: 10000 });
  const data = db();

  const chapters = Array.isArray(payload?.chapters) ? payload.chapters : [];
  const services = Array.isArray(payload?.services) ? payload.services : [];
  const memberServices = Array.isArray(payload?.memberServices) ? payload.memberServices : [];
  const events = Array.isArray(payload?.events) ? payload.events : [];
  const participants = Array.isArray(payload?.participants) ? payload.participants : [];
  const reports = Array.isArray(payload?.reports) ? payload.reports : [];
  const gig = Array.isArray(payload?.gig) ? payload.gig : [];

  data.chapters = chapters.map(row => ({
    id: row.id,
    areaId: row.area_id,
    name: row.name || '',
    cloudBacked: true
  }));

  data.services = services.map(row => normalizeServiceName(row.name)).filter(Boolean);
  const serviceNameById = new Map(services.map(row => [String(row.id), normalizeServiceName(row.name)]));
  const serviceNamesByMember = new Map();
  memberServices.forEach(link => {
    const memberId = String(link.member_id || '');
    const serviceName = serviceNameById.get(String(link.service_id || ''));
    if (!memberId || !serviceName) return;
    if (!serviceNamesByMember.has(memberId)) serviceNamesByMember.set(memberId, []);
    serviceNamesByMember.get(memberId).push(serviceName);
  });

  const chapterNameById = new Map(data.chapters.map(chapter => [String(chapter.id), chapter.name]));
  data.members = data.members.map(member => {
    const explicitServices = serviceNamesByMember.get(String(member.id)) || [];
    const nextMember = {
      ...member,
      chapterName: member.chapterId ? (chapterNameById.get(String(member.chapterId)) || '') : '',
      services: explicitServices
    };
    nextMember.services = detectedMemberServices(nextMember);
    return nextMember;
  });

  data.events = events.map(cloudEventToLocal);
  data.participants = participants.map(cloudParticipantToLocal);
  data.reports = reports.map(row => ({
    id: row.id,
    areaId: row.area_id,
    chapterId: row.chapter_id || null,
    chapter: row.chapter_id ? (chapterNameById.get(String(row.chapter_id)) || row.chapter_name_snapshot || '') : (row.chapter_name_snapshot || ''),
    type: row.report_type || '',
    date: row.activity_date || '',
    title: row.title || '',
    activity: row.activity || '',
    preparedBy: row.prepared_by_name || '',
    participants: Number(row.participant_count || 0),
    location: row.location || '',
    eventId: row.event_id || null,
    description: row.notes || '',
    cloudBacked: true
  }));
  data.gig = gig.map(cloudGigToLocal);
  data.cloudDashboard = payload?.dashboard || null;

  save(data);
  return true;
}

/**
 * Refreshes All Online Records and Updates the Screen
 *
 * What it does:
 * Downloads the newest member rosters and activity modules together, then
 * updates the visible page so leaders see the latest changes immediately.
 *
 * Backup plan if it breaks:
 * If offline or in demo mode, it exits safely. If downloading encounters an error,
 * the existing page stays visible with its current records without flashing or breaking.
 */
async function refreshAllCloudData({ render = true } = {}) {
  if (!session?.backendAuth || session?.demo || !session?.areaId) return false;
  await Promise.all([
    syncBackendMembersIntoLocalDb(),
    syncCloudModulesIntoLocalDb()
  ]);
  if (render) renderPageSafely();
  return true;
}
