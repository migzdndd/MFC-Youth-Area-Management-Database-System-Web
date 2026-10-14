/**
 * Community Events and Gatherings Resource Endpoint
 *
 * What it Does: Simple non IT Terms
 * Allows youth leaders to create, view, update, and manage youth events, youth camps,
 * conferences, assemblies, and prayer meetings across their community Area.
 */

import { requireAuthenticatedProfile, isLeaderRole, FULL_AREA_ADMIN_ROLES } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';
import { cleanText, nullableText, requireArea, asNonNegativeNumber, asNonNegativeInteger, loadAreaRow } from '../_lib/cloud-data.js';

function eventPayload(input, areaId, userId) {
  const rawDate = String(input.date || input.starts_at || input.startsAt || '').trim();
  const name = cleanText(input.name, 160);
  const localDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  const date = localDatePattern.test(rawDate)
    ? new Date(`${rawDate}:00+08:00`)
    : new Date(rawDate);
  if (!rawDate || Number.isNaN(date.getTime())) {
    const error = new Error('A valid event date and time is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!name) {
    const error = new Error('Event name is required.');
    error.statusCode = 400;
    throw error;
  }
  const rawEndDate = input.ends_at ?? input.endsAt ?? null;
  let endsAt = null;
  if (rawEndDate) {
    const d = localDatePattern.test(String(rawEndDate).trim())
      ? new Date(`${rawEndDate}:00+08:00`)
      : new Date(rawEndDate);
    if (!Number.isNaN(d.getTime())) endsAt = d.toISOString();
  }
  return {
    area_id: areaId,
    name,
    description: nullableText(input.description, 3000),
    venue: nullableText(input.venue, 255),
    starts_at: date.toISOString(),
    ends_at: endsAt,
    fee: asNonNegativeNumber(input.fee, 0),
    manual_attendance: asNonNegativeInteger(input.peopleAttended ?? input.manual_attendance ?? input.manualAttendance, 0),
    ...(userId ? { created_by: userId } : {})
  };
}

async function listEvents(req, res) {
  const { admin, profile } = await requireAuthenticatedProfile(req);
  const areaId = requireArea(req, profile);
  const { data, error } = await admin
    .from('events')
    .select('id, area_id, name, description, venue, starts_at, ends_at, fee, manual_attendance, created_by, created_at, updated_at')
    .eq('area_id', areaId)
    .order('starts_at', { ascending: false });
  if (error) throw error;

  const events = data || [];
  const creatorIds = Array.from(new Set(events.map((e) => e.created_by).filter(Boolean)));
  const creatorsMap = {};
  if (creatorIds.length > 0) {
    try {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, role, member_id, members(first_name, middle_name, last_name, email)')
        .in('id', creatorIds);
      if (profiles) {
        for (const p of profiles) {
          const mem = p.members;
          const fullName = mem ? [mem.first_name, mem.middle_name, mem.last_name].filter(Boolean).join(' ') : '';
          creatorsMap[p.id] = {
            role: p.role,
            name: fullName || 'Area Servant',
            email: mem?.email || null,
          };
        }
      }
    } catch {
      // Silently fall back if profile enrichment query fails
    }
  }

  const enriched = events.map((event) => ({
    ...event,
    creator_name: event.created_by && creatorsMap[event.created_by]?.name ? creatorsMap[event.created_by].name : null,
    creator_role: event.created_by && creatorsMap[event.created_by]?.role ? creatorsMap[event.created_by].role : null,
  }));

  return sendJson(res, 200, { ok: true, events: enriched, data: enriched });
}

async function createEvent(req, res) {
  const { admin, profile, user } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile?.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only core leadership servants can add community events.' });
  }
  const areaId = requireArea(req, profile);
  if (profile?.role !== 'national_coordinator' && String(profile?.area_id) !== String(areaId)) {
    return sendJson(res, 403, { ok: false, error: 'You can only create events for your own assigned Area Database.' });
  }
  const payload = eventPayload(req.body || {}, areaId, user.id);
  const { data, error } = await admin.from('events').insert(payload).select('*').single();
  if (error) throw error;
  return sendJson(res, 201, { ok: true, event: data, data });
}

async function updateEvent(req, res) {
  const { admin, profile, user } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile?.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only core leadership servants can edit community events.' });
  }
  const areaId = requireArea(req, profile);
  if (profile?.role !== 'national_coordinator' && String(profile?.area_id) !== String(areaId)) {
    return sendJson(res, 403, { ok: false, error: 'You can only edit events for your own assigned Area Database.' });
  }
  const id = req.body?.id || req.query?.id;
  if (!id) return sendJson(res, 400, { ok: false, error: 'Event ID is required.' });
  const existing = await loadAreaRow(admin, 'events', id, areaId, 'id, created_by');
  if (!existing) return sendJson(res, 404, { ok: false, error: 'Event not found in your Area.' });

  // Event creator or Area Leadership (Area Servants & Coordinators) can edit this event
  const isAreaAdmin = FULL_AREA_ADMIN_ROLES.has(String(profile?.role || '').toLowerCase());
  if (!isAreaAdmin && existing.created_by && existing.created_by !== user.id) {
    return sendJson(res, 403, { ok: false, error: 'Only the event creator or Area Leadership can edit this event.' });
  }

  const payload = eventPayload(req.body || {}, areaId, null);
  delete payload.created_by;
  const { data, error } = await admin.from('events').update(payload).eq('id', id).eq('area_id', areaId).select('*').single();
  if (error) throw error;
  return sendJson(res, 200, { ok: true, event: data, data });
}

async function deleteEvent(req, res) {
  const { admin, profile, user } = await requireAuthenticatedProfile(req);
  if (!isLeaderRole(profile?.role)) {
    return sendJson(res, 403, { ok: false, error: 'Only core leadership servants can delete community events.' });
  }
  const areaId = requireArea(req, profile);
  if (profile?.role !== 'national_coordinator' && String(profile?.area_id) !== String(areaId)) {
    return sendJson(res, 403, { ok: false, error: 'You can only delete events for your own assigned Area Database.' });
  }
  const id = req.query?.id || req.body?.id;
  if (!id) return sendJson(res, 400, { ok: false, error: 'Event ID is required.' });
  const existing = await loadAreaRow(admin, 'events', id, areaId, 'id, created_by');
  if (!existing) return sendJson(res, 404, { ok: false, error: 'Event not found in your Area.' });

  // Event creator or Area Leadership (Area Servants & Coordinators) can delete this event
  const isAreaAdmin = FULL_AREA_ADMIN_ROLES.has(String(profile?.role || '').toLowerCase());
  if (!isAreaAdmin && existing.created_by && existing.created_by !== user.id) {
    return sendJson(res, 403, { ok: false, error: 'Only the event creator or Area Leadership can delete this event.' });
  }

  const { error } = await admin.from('events').delete().eq('id', id).eq('area_id', areaId);
  if (error) throw error;
  return sendJson(res, 200, { ok: true, deleted: true, id });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await listEvents(req, res);
    if (req.method === 'POST') return await createEvent(req, res);
    if (req.method === 'PATCH' || req.method === 'PUT') return await updateEvent(req, res);
    if (req.method === 'DELETE') return await deleteEvent(req, res);
    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (error) {
    return apiError(res, error);
  }
}
