/**
 * ============================================================================
 * MFC Youth Area Management System - Store, Permissions & Database Layer
 * ============================================================================
 */

// Section 4: Role Permissions & Chapter Scoping

function isAreaAdminSession() {
  return isAreaAdminRole(session?.role);
}

function isChapterServantSession() {
  return isChapterServantRole(session?.role);
}

function scopedChapter(data) {
  if (!isChapterServantSession()) return null;

  const directId = session?.chapterId;
  if (directId !== null && directId !== undefined && String(directId).trim() !== '') {
    const direct = data.chapters.find(
      chapter => String(chapter.id) === String(directId)
    );
    if (direct) return direct;
  }

  const linkedMember = data.members.find(
    member => String(member.id) === String(session?.memberId)
  );

  if (!linkedMember?.chapterId) return null;

  return data.chapters.find(
    chapter => String(chapter.id) === String(linkedMember.chapterId)
  ) || null;
}

function denyUnlessAreaAdmin(message = 'Only National Coordinators, Couple Coordinators, Area Servants, Area LIT Servants, Campus Servants, and Area Kids Servants can perform this action.') {
  if (isAreaAdminSession()) return false;
  toast(message, 'error');
  return true;
}

function canManageOwnChapterMember(data, member) {
  if (isAreaAdminSession()) return true;
  if (!isChapterServantSession() || !member) return false;

  const chapter = scopedChapter(data);
  return Boolean(
    chapter &&
    String(member.chapterId) === String(chapter.id)
  );
}

function authEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function isOwnMemberRecord(member) {
  if (!member) return false;

  const currentMemberId = String(session?.memberId || '').trim();
  const recordMemberId = String(member.id || '').trim();
  if (currentMemberId && recordMemberId && currentMemberId === recordMemberId) {
    return true;
  }

  // Email is a safe fallback for older/self-healed sessions where memberId
  // has not been hydrated yet. Member emails are unique in the cloud schema.
  const currentEmail = authEmail(session?.email || '');
  const recordEmail = authEmail(member.email || '');
  return Boolean(currentEmail && recordEmail && currentEmail === recordEmail);
}

// Section 5: Database Normalization & Persistence

function normalizeDatabase(input) {
  const data = input && typeof input === 'object' ? input : {};

  const chapters = Array.isArray(data.chapters)
    ? data.chapters
      .filter(chapter =>
        chapter &&
        typeof chapter === 'object' &&
        String(chapter.name || '').trim()
      )
      .map(chapter => ({
        ...chapter,
        name: String(chapter.name).trim()
      }))
    : [];

  const chapterById = new Map(
    chapters.map(chapter => [String(chapter.id), chapter])
  );

  const chapterByName = new Map(
    chapters.map(chapter => [chapter.name.toLowerCase(), chapter])
  );

  const members = Array.isArray(data.members)
    ? data.members
      .filter(member => member && typeof member === 'object')
      .map(member => {
        const normalized = {
          ...member,
          school: String(member.school || '').trim(),
          academicTrack: String(member.academicTrack || '').trim(),
          gradeLevel: String(member.gradeLevel || '').trim(),
          accessLevel: normalizeAccessRole(member.accessLevel || 'member'),
          services: Array.isArray(member.services)
            ? member.services.map(normalizeServiceName).filter(Boolean)
            : []
        };
        normalized.services = detectedMemberServices(normalized);

        const rawId = member.chapterId;
        const rawName = String(member.chapterName || '').trim();
        const chapterFromId =
          rawId !== null &&
          rawId !== undefined &&
          String(rawId).trim() !== ''
            ? chapterById.get(String(rawId))
            : null;
        const chapterFromName = rawName
          ? chapterByName.get(rawName.toLowerCase())
          : null;
        const chapter = chapterFromId || chapterFromName;

        if (chapter) {
          normalized.chapterId = chapter.id;
          normalized.chapterName = chapter.name;
        } else {
          normalized.chapterId = null;
          normalized.chapterName = '';
        }

        return normalized;
      })
    : [];

  const memberById = new Map(
    members.map(member => [String(member.id), member])
  );

  const participants = Array.isArray(data.participants)
    ? data.participants
      .filter(
        participant => participant && typeof participant === 'object'
      )
      .map(participant => {
        const directMember =
          participant.memberId !== null &&
          participant.memberId !== undefined &&
          String(participant.memberId).trim() !== ''
            ? memberById.get(String(participant.memberId))
            : null;

        let linkedMember = directMember || null;

        // Best-effort migration for participant records created before
        // event registration was linked to the Members database.
        if (!linkedMember && participant.contact) {
          const matches = members.filter(
            member => String(member.contact || '') === String(participant.contact || '')
          );

          if (matches.length === 1) {
            linkedMember = matches[0];
          }
        }

        if (!linkedMember) {
          const participantName = [
            participant.first,
            participant.mi,
            participant.last
          ]
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();

          if (participantName) {
            const matches = members.filter(member =>
              [
                member.firstName,
                member.middleName,
                member.lastName
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase() === participantName
            );

            if (matches.length === 1) {
              linkedMember = matches[0];
            }
          }
        }

        return {
          ...participant,
          memberId: linkedMember?.id ?? participant.memberId ?? null
        };
      })
    : [];

  const reports = Array.isArray(data.reports)
    ? data.reports
      .filter(report => report && typeof report === 'object')
      .map(report => {
        const eventId = report.eventId !== null && report.eventId !== undefined && String(report.eventId).trim()
          ? report.eventId
          : null;

        const linkedParticipants = eventId
          ? participants.filter(item => String(item.eventId) === String(eventId))
          : [];

        const attendedCount = linkedParticipants.filter(
          item => item.attended
        ).length;

        const sourceParticipants =
          report.participants ??
          report.attendance ??
          (eventId
            ? (linkedParticipants.length ? attendedCount : 0)
            : 0);

        return {
          ...report,
          participants: Number.isFinite(Number(sourceParticipants))
            ? Math.max(0, Math.trunc(Number(sourceParticipants)))
            : 0,
          location: String(report.location || report.venue || '').trim(),
          eventId: Number.isFinite(eventId) ? eventId : null
        };
      })
    : [];

  const services = Array.isArray(data.services)
    ? [...new Set(data.services.map(normalizeServiceName).filter(Boolean))]
    : [];

  return {
    version: DB_VERSION,
    members,
    chapters,
    services: [...new Set([...SERVICES, ...services])],
    reports,
    events: Array.isArray(data.events)
      ? data.events.filter(event => event && typeof event === 'object')
      : [],
    participants,
    gig: Array.isArray(data.gig)
      ? data.gig.filter(item => item && typeof item === 'object')
      : [],
    cloudDashboard: data.cloudDashboard && typeof data.cloudDashboard === 'object'
      ? data.cloudDashboard
      : null
  };
}

function seedDB() {
  const existing = safeParse(
    localStorage.getItem(DB_KEY),
    null
  );

  localStorage.setItem(
    DB_KEY,
    JSON.stringify(normalizeDatabase(existing))
  );
}

function db() {
  return normalizeDatabase(
    safeParse(localStorage.getItem(DB_KEY), null)
  );
}

function save(data) {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(normalizeDatabase(data))
  );
}
