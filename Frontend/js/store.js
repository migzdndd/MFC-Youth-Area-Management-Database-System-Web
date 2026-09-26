/**
 * ============================================================================
 * MFC Youth Area Management System - Data Storage & Leader Permissions
 * ============================================================================
 * What this file is:
 * This script manages the saved records on your device (members, chapters, events,
 * and reports) and controls who has permission to view or edit them.
 *
 * Backup plan if something breaks:
 * If stored data is ever damaged, incomplete, or missing, this script cleans and
 * repairs the structure on the spot so the app keeps running safely.
 * ============================================================================
 */

// Section 1: Leader Permissions & Chapter Boundaries

/**
 * Checks Area Admin Status
 *
 * What it does:
 * Checks if the currently signed-in user is an Area-level leader (like an Area Servant
 * or Couple Coordinator) who has full access across all chapters.
 *
 * Backup plan if it breaks:
 * If there is no active login session, it safely returns false so unauthorized users
 * cannot access area settings.
 */
function isAreaAdminSession() {
  return isAreaAdminRole(session?.role);
}

/**
 * Checks Chapter Servant Status
 *
 * What it does:
 * Checks if the currently signed-in user is a Chapter Servant.
 *
 * Backup plan if it breaks:
 * If the login session is missing or unverified, it safely returns false.
 */
function isChapterServantSession() {
  return isChapterServantRole(session?.role);
}

/**
 * Finds the Leader's Assigned Chapter
 *
 * What it does:
 * Looks up which specific chapter a Chapter Servant is assigned to, ensuring they
 * only manage members and activities within their own community.
 *
 * Backup plan if it breaks:
 * If no matching chapter can be found in the database, it returns null, which safely
 * restricts access until the leader is assigned to a chapter.
 */
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

/**
 * Security Guard for Area Admin Actions
 *
 * What it does:
 * Blocks users who are not Area Admins from performing restricted tasks (like adding
 * new chapters or deleting records) and shows an alert.
 *
 * Backup plan if it breaks:
 * If permission is denied, it shows an alert message on the screen and prevents the
 * action from going through.
 */
function denyUnlessAreaAdmin(message = 'Only National Coordinators, Couple Coordinators, Area Servants, Area LIT Servants, Campus Servants, and Area Kids Servants can perform this action.') {
  if (isAreaAdminSession()) return false;
  toast(message, 'error');
  return true;
}

/**
 * Checks Permission to Edit a Member
 *
 * What it does:
 * Decides if a leader can edit a youth member's details.
 * - Area leaders can edit anyone in the area.
 * - Chapter Servants can only edit youth in their own chapter.
 *
 * Backup plan if it breaks:
 * If the member record is missing or the leader's chapter does not match, it returns false.
 */
function canManageOwnChapterMember(data, member) {
  if (isAreaAdminSession()) return true;
  if (!isChapterServantSession() || !member) return false;

  const chapter = scopedChapter(data);
  return Boolean(
    chapter &&
    String(member.chapterId) === String(chapter.id)
  );
}

/**
 * Cleans Email for Comparison
 *
 * What it does:
 * Trims extra spaces and turns emails to lowercase so accounts match reliably.
 *
 * Backup plan if it breaks:
 * If no email is given, it safely returns blank text.
 */
function authEmail(value = '') {
  return String(value).trim().toLowerCase();
}

/**
 * Checks if Record Belongs to Current User
 *
 * What it does:
 * Determines if a member record belongs to the person who is currently logged in.
 *
 * Backup plan if it breaks:
 * Checks member ID first; if the ID is not linked yet, it falls back to matching
 * by verified email address. If neither matches, it returns false.
 */
function isOwnMemberRecord(member) {
  if (!member) return false;

  const currentMemberId = String(session?.memberId || '').trim();
  const recordMemberId = String(member.id || '').trim();
  if (currentMemberId && recordMemberId && currentMemberId === recordMemberId) {
    return true;
  }

  // Backup check: Match by email if ID is temporarily unlinked
  const currentEmail = authEmail(session?.email || '');
  const recordEmail = authEmail(member.email || '');
  return Boolean(currentEmail && recordEmail && currentEmail === recordEmail);
}

// Section 2: Database Cleaning, Structure Verification, and Saving

/**
 * Repairs and Verifies Entire Database Structure
 *
 * What it does:
 * Inspects all saved data (members, chapters, events, attendance, and reports),
 * fills in any missing blanks, connects records, and ensures everything is in
 * the expected format before the app uses it.
 *
 * Backup plan if it breaks:
 * If any table is corrupted, missing, or scrambled, it provides safe empty lists
 * and default values so the dashboard and tables never crash.
 */
function normalizeDatabase(input) {
  const data = input && typeof input === 'object' ? input : {};

  // Verify chapters list
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

  // Verify members list and link to chapters
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

  // Verify event participants and link them to members
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

        // Backup match by contact number if memberId was not set
        if (!linkedMember && participant.contact) {
          const matches = members.filter(
            member => String(member.contact || '') === String(participant.contact || '')
          );

          if (matches.length === 1) {
            linkedMember = matches[0];
          }
        }

        // Backup match by full name if ID and phone were missing
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

  // Verify activity reports
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

/**
 * Sets Up Initial Database
 *
 * What it does:
 * Makes sure a clean database exists in device storage when you open the app.
 *
 * Backup plan if it breaks:
 * If storage was empty or reset, it creates a fresh verified template.
 */
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

/**
 * Loads the Current Database
 *
 * What it does:
 * Reads and returns the complete set of saved records from device storage.
 *
 * Backup plan if it breaks:
 * If the saved data was corrupt, it repairs and returns a clean, safe template.
 */
function db() {
  return normalizeDatabase(
    safeParse(localStorage.getItem(DB_KEY), null)
  );
}

/**
 * Saves Database Changes
 *
 * What it does:
 * Cleans, checks, and writes updated records to the device storage.
 *
 * Backup plan if it breaks:
 * Always runs data through normalizeDatabase before saving, so damaged
 * or broken rows can never corrupt storage.
 */
function save(data) {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(normalizeDatabase(data))
  );
}
