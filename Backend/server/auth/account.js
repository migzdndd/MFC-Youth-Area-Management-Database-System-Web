import { requireAuthenticatedProfile, isAreaAdminRole, isChapterServantRole } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';

/**
 * Authenticated Servant Leader Account Deletion Endpoint
 *
 * What it Does: Simple non IT Terms
 * Completely removes a logged-in servant leader's login account, user profile, and linked
 * roster record from the database when they choose to delete their account.
 */
export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE']);

  try {
    const { supabase, admin, user, profile } = await requireAuthenticatedProfile(req);
    if (!isAreaAdminRole(profile?.role) && !isChapterServantRole(profile?.role)) {
      return sendJson(res, 403, { ok: false, error: 'Account deletion from the management portal is available only to Servant Leader accounts.' });
    }

    const memberId = profile?.member_id || null;

    // Delete linked member record first using admin client so that user session context
    // and database integrity remain intact throughout the cleanup.
    if (memberId) {
      const { error: memberDeleteError } = await admin
        .from('members')
        .delete()
        .eq('id', memberId);
      if (memberDeleteError) throw memberDeleteError;
    }

    // profiles.id references auth.users ON DELETE CASCADE, so deleting the auth user
    // cascades and cleans up public.profiles cleanly.
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
    if (authDeleteError) throw authDeleteError;

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
