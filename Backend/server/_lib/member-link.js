import { normalizeEmail } from './http.js';
import { ensureRoleServiceAssignment } from './service-catalog.js';

const LEADERSHIP_ROLES = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'chapter_servant'
]);

// Couple Coordinators keep management access but are intentionally not
// represented in the Area Members roster. All other Servant Leader accounts
// are linked to public.members after Area onboarding.
const MEMBER_BACKED_ADMIN_ROLES = new Set([
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'chapter_servant'
]);

/**
 * Clean and Normalize Text Input
 *
 * What it does:
 * Trims extra spaces and collapses repeated whitespace into a single space, cutting off text if it exceeds the maximum allowed length.
 *
 * Backup plan if it breaks:
 * Handles null, undefined, or empty values safely and returns an empty string.
 */
function cleanText(value, max = 160) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

/**
 * Split Full Name into First, Middle, and Last
 *
 * What it does:
 * Parses a person's display name into separate first, middle, and last name fields for the membership registry.
 *
 * Backup plan if it breaks:
 * If no display name is provided, it extracts a name from the email address before the @ symbol. If only a single name exists, it uses it for both first and last name.
 */
function splitDisplayName(displayName, email) {
  const safeName = cleanText(displayName, 240) || cleanText(String(email || '').split('@')[0], 120) || 'Member';
  const parts = safeName.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      middleName: null,
      lastName: parts[0]
    };
  }

  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : null,
    lastName: parts[parts.length - 1]
  };
}

/**
 * Validate Leadership Role Title
 *
 * What it does:
 * Confirms whether a role title belongs to a recognized servant leadership position.
 *
 * Backup plan if it breaks:
 * Returns null if the title is invalid, preventing unverified roles from gaining leadership privileges.
 */
function leadershipRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return LEADERSHIP_ROLES.has(normalized) ? normalized : null;
}

/**
 * Check If Leader Should Have a Member Record
 *
 * What it does:
 * Determines if a leader should appear in the youth roster (Couple Coordinators do not, while youth leaders do).
 *
 * Backup plan if it breaks:
 * Trims and lowercases the role string before checking, safely defaulting to false if unrecognized.
 */
function shouldCreateMemberRecord(role) {
  return MEMBER_BACKED_ADMIN_ROLES.has(String(role || '').trim().toLowerCase());
}

/**
 * Create Custom Member Connection Error
 *
 * What it does:
 * Formats a clean error object when linking an account to a member profile encounters a problem.
 *
 * Backup plan if it breaks:
 * Defaults to HTTP 409 Conflict status if custom status codes are omitted.
 */
function memberLinkError(message, statusCode = 409, code = 'MEMBER_LINK_FAILED') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

/**
 * Link or Create Leader Record in Member Roster
 *
 * What it does:
 * Connects an authenticated servant leader account to their entry in the Area member roster, creating a new roster record if one did not previously exist.
 *
 * Backup plan if it breaks:
 * If an existing member row is found with the same email, it reuses and links to it instead of creating duplicates. If an error occurs halfway through creating a new member row, it rolls back and cleans up the newly inserted member to keep data consistent.
 */
export async function ensureLeadershipMemberRecord({
  supabase,
  user,
  profile,
  areaId,
  chapterId
}) {
  const role = leadershipRole(profile?.role);
  if (!role) {
    return { profile, member: null, created: false, linkedExisting: false };
  }

  const targetAreaId = String(areaId || profile?.area_id || '').trim();
  const targetChapterId = chapterId !== undefined
    ? (chapterId || null)
    : (profile?.chapter_id || null);

  if (!targetAreaId) {
    return { profile, member: null, created: false, linkedExisting: false };
  }

  // Couple Coordinators are management-only accounts. Persist their Area
  // selection in profiles, but do not create a Members-roster entry for them.
  if (!shouldCreateMemberRecord(role)) {
    const profileUpdates = { area_id: targetAreaId };
    if (targetChapterId) profileUpdates.chapter_id = targetChapterId;

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', profile.id)
      .select('*')
      .single();
    if (profileUpdateError) throw profileUpdateError;

    return {
      profile: updatedProfile,
      member: null,
      created: false,
      linkedExisting: false
    };
  }

  // If the profile is already linked, keep the member row synchronized.
  if (profile?.member_id) {
    const { data: existingLinkedMember, error: linkedError } = await supabase
      .from('members')
      .select('*')
      .eq('id', profile.member_id)
      .maybeSingle();
    if (linkedError) throw linkedError;

    if (existingLinkedMember) {
      const updates = {
        area_id: targetAreaId,
        access_level: role,
        status: profile.is_active === false ? 'Inactive' : 'Active'
      };
      if (targetChapterId) updates.chapter_id = targetChapterId;

      const { data: updatedMember, error: memberUpdateError } = await supabase
        .from('members')
        .update(updates)
        .eq('id', existingLinkedMember.id)
        .select('*')
        .single();
      if (memberUpdateError) throw memberUpdateError;

      await ensureRoleServiceAssignment(supabase, {
        memberId: updatedMember.id,
        areaId: targetAreaId,
        role
      });

      return {
        profile: { ...profile, area_id: targetAreaId, member_id: updatedMember.id },
        member: updatedMember,
        created: false,
        linkedExisting: false
      };
    }
  }

  const email = normalizeEmail(user?.email);
  if (!email) {
    throw memberLinkError('This account does not have a valid email address.', 400, 'MEMBER_EMAIL_REQUIRED');
  }

  // Reuse an existing member row when the same person was already encoded
  // manually by leadership before their account was created.
  const { data: existingMember, error: existingMemberError } = await supabase
    .from('members')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (existingMemberError) throw existingMemberError;

  if (existingMember) {
    if (String(existingMember.area_id) !== targetAreaId) {
      throw memberLinkError(
        'A member with this email already belongs to another Area. Ask a system administrator to review the account.',
        409,
        'MEMBER_AREA_CONFLICT'
      );
    }

    const { data: otherProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('member_id', existingMember.id)
      .neq('id', profile.id)
      .maybeSingle();
    if (profileLookupError) throw profileLookupError;
    if (otherProfile) {
      throw memberLinkError(
        'This member record is already linked to another account.',
        409,
        'MEMBER_ALREADY_LINKED'
      );
    }

    const memberUpdates = {
      access_level: role,
      status: profile.is_active === false ? 'Inactive' : 'Active'
    };
    if (targetChapterId) memberUpdates.chapter_id = targetChapterId;

    const { data: updatedMember, error: memberUpdateError } = await supabase
      .from('members')
      .update(memberUpdates)
      .eq('id', existingMember.id)
      .select('*')
      .single();
    if (memberUpdateError) throw memberUpdateError;

    const profileUpdates = {
      member_id: updatedMember.id,
      area_id: targetAreaId
    };
    if (targetChapterId) profileUpdates.chapter_id = targetChapterId;

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', profile.id)
      .select('*')
      .single();
    if (profileUpdateError) throw profileUpdateError;

    await ensureRoleServiceAssignment(supabase, {
      memberId: updatedMember.id,
      areaId: targetAreaId,
      role
    });

    return {
      profile: updatedProfile,
      member: updatedMember,
      created: false,
      linkedExisting: true
    };
  }

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || '';
  const { firstName, middleName, lastName } = splitDisplayName(displayName, email);

  let createdMember = null;
  try {
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        area_id: targetAreaId,
        chapter_id: targetChapterId,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        email,
        status: profile.is_active === false ? 'Inactive' : 'Active',
        access_level: role,
        created_by: user.id
      })
      .select('*')
      .single();

    if (memberError) throw memberError;
    createdMember = member;

    await ensureRoleServiceAssignment(supabase, {
      memberId: member.id,
      areaId: targetAreaId,
      role
    });

    const profileUpdates = {
      member_id: member.id,
      area_id: targetAreaId
    };
    if (targetChapterId) profileUpdates.chapter_id = targetChapterId;

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', profile.id)
      .select('*')
      .single();

    if (profileUpdateError) throw profileUpdateError;

    return {
      profile: updatedProfile,
      member,
      created: true,
      linkedExisting: false
    };
  } catch (error) {
    if (createdMember?.id) {
      try {
        await supabase.from('members').delete().eq('id', createdMember.id);
      } catch {
        // Preserve the original error.
      }
    }
    throw error;
  }
}
