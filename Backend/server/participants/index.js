/**
 * Event Participants and Attendance Check-In Endpoint
 *
 * What it Does: Simple non-IT Terms
 * Tracks who has registered for an event, records whether they have paid their registration fee,
 * and marks their attendance when they arrive at the venue.
 * Supports both community members and non-community guests/walk-ins.
 */

import { requireAuthenticatedProfile, isChapterServantRole, isLeaderRole } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';
import { cleanText, requireArea, loadAreaRow } from '../_lib/cloud-data.js';

async function eventInArea(supabase, eventId, areaId) {
  return loadAreaRow(supabase, 'events', eventId, areaId, 'id');
}

async function memberInArea(supabase, memberId, areaId) {
  return loadAreaRow(supabase, 'members', memberId, areaId, 'id');
}

function normalizePaymentStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'paid') return 'Paid';
  return 'Not Paid';
}

async function listParticipants(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);
  const areaId = requireArea(req, profile);
  const { data: events, error: eventError } = await admin.from('events').select('id').eq('area_id', areaId);
  if (eventError) throw eventError;
  const eventIds = (events || []).map(item => item.id);
  if (!eventIds.length) return sendJson(res, 200, { ok: true, participants: [] });

  let query = admin
    .from('event_participants')
    .select('id, event_id, member_id, non_member_name, mode_of_payment, payment_status, attended, registered_at, updated_at')
    .in('event_id', eventIds)
    .order('registered_at', { ascending: false });

  const eventFilter = req.query?.eventId ?? req.query?.event_id;
  if (eventFilter) query = query.eq('event_id', eventFilter);

  if (isChapterServantRole(profile.role)) {
    const { data: chapterMembers, error: memberError } = await admin
      .from('members').select('id').eq('area_id', areaId).eq('chapter_id', profile.chapter_id || '00000000-0000-0000-0000-000000000000');
    if (memberError) throw memberError;
    const ids = (chapterMembers || []).map(item => item.id);
    if (ids.length) {
      query = query.or(`member_id.in.(${ids.join(',')}),member_id.is.null`);
    } else {
      query = query.is('member_id', null);
    }
  } else if (!isLeaderRole(profile.role)) {
    query = query.eq('member_id', profile.member_id || '00000000-0000-0000-0000-000000000000');
  }

  const { data, error } = await query;
  if (error) throw error;
  return sendJson(res, 200, { ok: true, participants: data || [], data: data || [] });
}

async function createParticipant(req, res) {
  const { supabase, admin, profile, user } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only leadership accounts can register event participants.' });
  }
  const areaId = requireArea(req, profile);
  const eventId = req.body?.eventId ?? req.body?.event_id;
  const memberId = req.body?.memberId ?? req.body?.member_id ?? null;
  const nonMemberName = cleanText(req.body?.nonMemberName ?? req.body?.non_member_name ?? req.body?.guestName ?? req.body?.guest_name, 160) || null;

  if (!eventId) {
    return sendJson(res, 400, { ok: false, error: 'Event ID is required.' });
  }
  if (!memberId && !nonMemberName) {
    return sendJson(res, 400, { ok: false, error: 'Either a community member or a non-member name is required.' });
  }

  if (!(await eventInArea(admin, eventId, areaId))) {
    return sendJson(res, 400, { ok: false, error: 'Event does not belong to your Area.' });
  }

  const paymentStatus = normalizePaymentStatus(req.body?.paymentStatus ?? req.body?.payment_status);
  const attended = req.body?.attended !== undefined ? Boolean(req.body?.attended) : true;
  const modeOfPayment = cleanText(req.body?.paymentMode ?? req.body?.mode_of_payment, 80) || null;

  if (memberId) {
    if (!(await memberInArea(supabase, memberId, areaId))) {
      return sendJson(res, 400, { ok: false, error: 'Member does not belong to your Area.' });
    }
    const { data: duplicate, error: duplicateError } = await admin
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('member_id', memberId)
      .maybeSingle();
    if (duplicateError) throw duplicateError;

    if (duplicate) {
      // Update existing record
      const { data: updated, error: updateError } = await admin
        .from('event_participants')
        .update({
          payment_status: paymentStatus,
          attended,
          mode_of_payment: modeOfPayment,
          updated_at: new Date().toISOString()
        })
        .eq('id', duplicate.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      return sendJson(res, 200, { ok: true, participant: updated });
    }
  } else if (nonMemberName) {
    // Check if duplicate guest name for this event
    const { data: duplicateGuest, error: guestDupError } = await admin
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .is('member_id', null)
      .ilike('non_member_name', nonMemberName)
      .maybeSingle();
    if (guestDupError) throw guestDupError;

    if (duplicateGuest) {
      const { data: updated, error: updateError } = await admin
        .from('event_participants')
        .update({
          payment_status: paymentStatus,
          attended,
          mode_of_payment: modeOfPayment,
          updated_at: new Date().toISOString()
        })
        .eq('id', duplicateGuest.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      return sendJson(res, 200, { ok: true, participant: updated });
    }
  }

  const { data, error } = await admin
    .from('event_participants')
    .insert({
      event_id: eventId,
      member_id: memberId,
      non_member_name: nonMemberName,
      mode_of_payment: modeOfPayment,
      payment_status: paymentStatus,
      attended,
      registered_by: user.id
    })
    .select('*')
    .single();

  if (error) throw error;
  return sendJson(res, 201, { ok: true, participant: data });
}

async function updateParticipant(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only leadership accounts can edit event participants.' });
  }
  const areaId = requireArea(req, profile);
  const id = req.body?.id;
  if (!id) return sendJson(res, 400, { ok: false, error: 'Participant ID is required.' });

  const { data: existing, error: existingError } = await admin
    .from('event_participants')
    .select('id, event_id')
    .eq('id', id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing || !(await eventInArea(admin, existing.event_id, areaId))) {
    return sendJson(res, 404, { ok: false, error: 'Participant record not found in your Area.' });
  }

  const updates = {
    updated_at: new Date().toISOString()
  };

  if (req.body?.paymentStatus !== undefined || req.body?.payment_status !== undefined) {
    updates.payment_status = normalizePaymentStatus(req.body?.paymentStatus ?? req.body?.payment_status);
  }
  if (req.body?.paymentMode !== undefined || req.body?.mode_of_payment !== undefined) {
    updates.mode_of_payment = cleanText(req.body?.paymentMode ?? req.body?.mode_of_payment, 80) || null;
  }
  if (req.body?.attended !== undefined) {
    updates.attended = Boolean(req.body?.attended);
  }
  if (req.body?.nonMemberName !== undefined || req.body?.non_member_name !== undefined) {
    updates.non_member_name = cleanText(req.body?.nonMemberName ?? req.body?.non_member_name, 160) || null;
  }

  const { data, error } = await admin
    .from('event_participants')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return sendJson(res, 200, { ok: true, participant: data });
}

async function deleteParticipant(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only leadership accounts can delete event participants.' });
  }
  const areaId = requireArea(req, profile);
  const id = req.query?.id || req.body?.id;
  if (!id) return sendJson(res, 400, { ok: false, error: 'Participant ID is required.' });

  const { data: existing, error: existingError } = await admin
    .from('event_participants')
    .select('id, event_id')
    .eq('id', id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing || !(await eventInArea(admin, existing.event_id, areaId))) {
    return sendJson(res, 404, { ok: false, error: 'Participant record not found in your Area.' });
  }

  const { error } = await admin.from('event_participants').delete().eq('id', id);
  if (error) throw error;
  return sendJson(res, 200, { ok: true, deleted: true, id });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await listParticipants(req, res);
    if (req.method === 'POST') return await createParticipant(req, res);
    if (req.method === 'PATCH' || req.method === 'PUT') return await updateParticipant(req, res);
    if (req.method === 'DELETE') return await deleteParticipant(req, res);
    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (error) {
    return apiError(res, error);
  }
}
