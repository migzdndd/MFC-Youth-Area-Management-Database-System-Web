import { createSupabaseAuthClient, createSupabaseAdmin } from '../_lib/supabase.js';
import { sendJson, methodNotAllowed, normalizeEmail, isValidEmail, apiError, setAuthCookies } from '../_lib/http.js';
import { ensureLeadershipMemberRecord } from '../_lib/member-link.js';
import { checkRateLimit } from '../_lib/rate-limit.js';

/**
 * Registration Email OTP and Token Verifier
 *
 * What it Does: Simple non IT Terms
 * Takes the 6-digit verification code or token sent to the user's real email address,
 * verifies it with Supabase Auth, marks their account as officially confirmed, links their
 * leadership member profile, and logs them in with an active session.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const email = normalizeEmail(req.body?.email);
    const token = String(req.body?.token || req.body?.code || req.body?.otp || '').trim();

    if (!isValidEmail(email)) {
      return sendJson(res, 400, { ok: false, error: 'A valid email address is required.' });
    }

    if (!token || token.length < 4) {
      return sendJson(res, 400, { ok: false, error: 'Please enter the verification code sent to your email.' });
    }

    if (!await checkRateLimit(req, res, 'verify-email')) return;

    const authClient = createSupabaseAuthClient();

    // Verify OTP with type 'signup' (or fallback to 'email')
    let verifyRes = await authClient.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (verifyRes.error) {
      const fallback = await authClient.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (!fallback.error && fallback.data?.user) {
        verifyRes = fallback;
      } else {
        return sendJson(res, 400, {
          ok: false,
          error: 'Invalid or expired verification code. Please check your email or request a new code.'
        });
      }
    }

    const { user, session } = verifyRes.data;
    if (!user || !session) {
      return sendJson(res, 400, {
        ok: false,
        error: 'Verification succeeded but session could not be established. Please sign in.'
      });
    }

    const admin = createSupabaseAdmin();

    // Retrieve or initialize leader profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, member_id, role, area_id, chapter_id, must_change_password, is_active, is_developer')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    let memberLink = { profile, member: null };
    if (profile?.area_id) {
      try {
        memberLink = await ensureLeadershipMemberRecord({
          supabase: admin,
          user,
          profile,
          areaId: profile.area_id
        });
      } catch (linkError) {
        console.warn('Leadership member linking warning during email verification:', linkError?.message || linkError);
      }
    }

    let area = null;
    if (profile?.area_id) {
      const { data: areaData } = await admin
        .from('areas')
        .select('id, name, code, is_active')
        .eq('id', profile.area_id)
        .maybeSingle();
      area = areaData || null;
    }

    setAuthCookies(res, {
      accessToken: session.access_token,
      refreshToken: session.refresh_token
    });

    const finalMemberId = memberLink.member?.id || memberLink.profile?.member_id || profile?.member_id || null;
    const requiresAreaSelection = !profile?.area_id && profile?.role !== 'member';

    return sendJson(res, 200, {
      ok: true,
      message: area
        ? `Email verified and validated for ${area.name} Area Database.`
        : 'Email verified successfully. Welcome to MFC Youth!',
      requiresAreaSelection,
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expiresAt: session.expires_at
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.display_name || user.email,
        memberId: finalMemberId,
        member_id: finalMemberId,
        role: profile?.role || 'chapter_servant',
        areaId: profile?.area_id || null,
        area_id: profile?.area_id || null,
        areaName: area?.name || null,
        area_name: area?.name || null,
        chapterId: profile?.chapter_id || null,
        chapter_id: profile?.chapter_id || null,
        mustChangePassword: profile?.must_change_password || false,
        is_developer: Boolean(profile?.is_developer),
        requiresAreaSelection
      },
      area
    });
  } catch (error) {
    return apiError(res, error);
  }
}
