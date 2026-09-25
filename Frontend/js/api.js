/**
 * ============================================================================
 * MFC Youth Area Management System - API Client & Cloud Synchronization
 * ============================================================================
 */

// Section 2: Authenticated Backend API Client

async function backendApi(path, options = {}) {
  const token = session?.accessToken || '';
  const timeoutMs = Number(options.timeoutMs || 8000);
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
      const error = new Error(body?.error || 'Request failed.');
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }

    if (error instanceof TypeError) {
      throw new Error('Unable to reach the server. Check your connection and try again.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

// Section 3: Cloud Synchronization & Entity Mappers

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

async function syncBackendMembersIntoLocalDb() {
  if (!session?.backendAuth || session?.demo || !session?.areaId) return false;

  const payload = await backendApi('/api/members');
  const cloudMembers = Array.isArray(payload?.members) ? payload.members : [];
  const data = db();
  const previousMembers = Array.isArray(data.members) ? data.members : [];

  // In authenticated cloud mode, Supabase is the source of truth. localStorage
  // only keeps a fast render cache so deleted/stale prototype records cannot
  // reappear after a refresh.
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

async function refreshAllCloudData({ render = true } = {}) {
  if (!session?.backendAuth || session?.demo || !session?.areaId) return false;
  await syncBackendMembersIntoLocalDb();
  await syncCloudModulesIntoLocalDb();
  if (render) renderPageSafely();
  return true;
}
