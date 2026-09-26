import { requireAuthenticatedProfile, isAreaAdminRole, isChapterServantRole } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';

/**
 * Permanently Delete Authenticated Servant Account
 *
 * What it does:
 * Completely removes the logged-in servant leader's login account, profile, and linked membership record from the database upon user request.
 *
 * Backup plan if it breaks:
 * Restricts self-deletion to servant leaders. Deletes authentication credentials first so access is revoked immediately even if cleaning up member records runs into an issue.
 */
export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE']);

  try {
    const { supabase, user, profile } = await requireAuthenticatedProfile(req);
    if (!isAreaAdminRole(profile?.role) && !isChapterServantRole(profile?.role)) {
      return sendJson(res, 403, { ok: false, error: 'Account deletion from the management portal is available only to Servant Leader accounts.' });
    }

    const memberId = profile?.member_id || null;

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (authDeleteError) throw authDeleteError;

    // profiles.id references auth.users ON DELETE CASCADE, so the profile is
    // removed by the Auth deletion. The linked member is intentionally cleaned
    // up afterward because auth.users does not own public.members directly.
    if (memberId) {
      const { error: memberDeleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);
      if (memberDeleteError) throw memberDeleteError;
    }

    return sendJson(res, 200, {
      ok: true,
      deleted: true,
      deletedAuthUser: true,
      deletedMember: Boolean(memberId)
    });
  } catch (error) {
    return apiError(res, error);
  }
}
