import { normalizeEmail } from './http.js';

/**
 * Create Custom Member Account Link Error
 *
 * What it does:
 * Builds an error message with a specific status code when a youth member tries to link their account to a record.
 *
 * Backup plan if it breaks:
 * Defaults to status code 409 (Conflict) and code 'MEMBER_CLAIM_FAILED' if specific codes are not supplied.
 */
function claimError(message, statusCode = 409, code = 'MEMBER_CLAIM_FAILED') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

/**
 * Clean Search Text for Safe Database Matching
 *
 * What it does:
 * Neutralizes database wildcard characters (% and _) so searching for an email matches literal characters accurately.
 *
 * Backup plan if it breaks:
 * Safely converts input to a string before replacing characters.
 */
function escapeLikePattern(value) {
  return String(value).replace(/[\\%_]/g, character => `\\${character}`);
}

/**
 * Link Registered Login Account to Member Profile Record
 *
 * What it does:
 * Connects a newly registered youth member's login credentials to their pre-existing member record in the church database using their email address.
 *
 * Backup plan if it breaks:
 * If no matching member record exists, it raises a 404 error. If the member record is already claimed by another login account, it raises a 409 conflict error to prevent identity theft.
 */
export async function claimMemberRecord({ supabase, user }) {
  const email = normalizeEmail(user?.email);
  if (!email) throw claimError('A verified email address is required.', 400, 'MEMBER_EMAIL_REQUIRED');

  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  if (existingProfile?.member_id) {
    return { profile: existingProfile, memberId: existingProfile.member_id, alreadyLinked: true };
  }
  if (existingProfile && existingProfile.role !== 'member') {
    throw claimError('This account is reserved for Servant Leader access.', 403, 'LEADERSHIP_ACCOUNT');
  }

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, area_id, chapter_id, status')
    .ilike('email', escapeLikePattern(email))
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) {
    throw claimError('No Member record is associated with this email.', 404, 'MEMBER_NOT_FOUND');
  }

  const { data: linkedProfile, error: linkedProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('member_id', member.id)
    .neq('id', user.id)
    .maybeSingle();
  if (linkedProfileError) throw linkedProfileError;
  if (linkedProfile) {
    throw claimError('This Member is already linked to an account.', 409, 'MEMBER_ALREADY_LINKED');
  }

  const profileValues = {
    id: user.id,
    member_id: member.id,
    role: 'member',
    area_id: member.area_id,
    chapter_id: member.chapter_id,
    must_change_password: false,
    is_active: member.status !== 'Inactive'
  };

  const query = existingProfile
    ? supabase.from('profiles').update(profileValues).eq('id', user.id)
    : supabase.from('profiles').insert(profileValues);
  const { data: profile, error: saveError } = await query.select('*').single();
  if (saveError) throw saveError;

  return { profile, memberId: member.id, alreadyLinked: false };
}