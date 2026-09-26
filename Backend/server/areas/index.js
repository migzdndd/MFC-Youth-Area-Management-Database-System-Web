import { requireAuthenticatedProfile } from '../_lib/access.js';
import { sendJson, methodNotAllowed, apiError } from '../_lib/http.js';
import { ensureLeadershipMemberRecord } from '../_lib/member-link.js';
import { STANDARD_SERVICES } from '../_lib/service-catalog.js';

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


/**
 * Clean and Format Area Name
 *
 * What it does:
 * Trims extra spacing and limits length to 120 characters to ensure clean display on maps and certificates.
 *
 * Backup plan if it breaks:
 * Handles null or undefined inputs safely and returns an empty string.
 */
function cleanAreaName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}

/**
 * Generate Readable Area Code from Name
 *
 * What it does:
 * Converts an Area name (like "Metro Manila South") into a URL-friendly uppercase code (like "METRO-MANILA-SOUTH").
 *
 * Backup plan if it breaks:
 * If the resulting text is empty or contains only symbols, it generates a fallback code with a timestamp so it remains unique.
 */
function areaCodeFromName(name) {
  const base = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 44);
  return base || `AREA-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * List All Active Areas for Selection
 *
 * What it does:
 * Fetches the list of all active MFC Youth areas so newly registered servant leaders can select and join their Area.
 *
 * Backup plan if it breaks:
 * Restricts access to servant leader accounts. If no areas exist yet, it returns an empty list without error.
 */
async function listAreas(req, res) {
  const { supabase, profile } = await requireAuthenticatedProfile(req);
  if (!LEADERSHIP_ROLES.has(String(profile.role || '').toLowerCase())) {
    return sendJson(res, 403, { ok: false, error: 'Area setup is available only to Servant Leader accounts.' });
  }

  const { data, error } = await supabase
    .from('areas')
    .select('id, name, code, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;

  return sendJson(res, 200, { ok: true, areas: data || [] });
}

/**
 * Create New Area Community and Catalog
 *
 * What it does:
 * Registers a brand-new Area, initializes all standard youth ministry services for it, and links the creating leader's account to it.
 *
 * Backup plan if it breaks:
 * Checks for duplicate names before saving. If an error happens while setting up services or linking the leader, it deletes the partially-created area to avoid orphaned data.
 */
async function createArea(req, res) {
  const { supabase, profile, user } = await requireAuthenticatedProfile(req);
  if (!LEADERSHIP_ROLES.has(String(profile.role || '').toLowerCase())) {
    return sendJson(res, 403, { ok: false, error: 'You do not have permission to create an Area.' });
  }
  if (profile.area_id) {
    return sendJson(res, 409, { ok: false, error: 'Your account is already assigned to an Area.' });
  }

  const name = cleanAreaName(req.body?.name);
  if (name.length < 3) {
    return sendJson(res, 400, { ok: false, error: 'Enter a valid Area name.' });
  }

  const { data: existingByName, error: nameError } = await supabase
    .from('areas')
    .select('id, name, code')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (nameError) throw nameError;
  if (existingByName) {
    return sendJson(res, 409, {
      ok: false,
      error: 'That Area already exists. Select it from the Area list instead.',
      existingArea: existingByName
    });
  }

  let code = areaCodeFromName(name);
  const { data: codeConflict, error: codeConflictError } = await supabase
    .from('areas')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (codeConflictError) throw codeConflictError;
  if (codeConflict) {
    code = `${code.slice(0, 38)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  let createdArea = null;
  try {
    const { data: area, error: areaError } = await supabase
      .from('areas')
      .insert({ name, code, is_active: true })
      .select('id, name, code, is_active')
      .single();
    if (areaError) throw areaError;
    createdArea = area;

    const { error: serviceError } = await supabase
      .from('services')
      .insert(STANDARD_SERVICES.map(serviceName => ({ area_id: area.id, name: serviceName, is_active: true })));
    if (serviceError) throw serviceError;

    const memberLink = await ensureLeadershipMemberRecord({
      supabase,
      user,
      profile,
      areaId: area.id
    });

    return sendJson(res, 201, {
      ok: true,
      area,
      profile: memberLink.profile,
      member: memberLink.member,
      memberCreated: memberLink.created,
      memberLinkedExisting: memberLink.linkedExisting,
      created: true
    });
  } catch (error) {
    if (createdArea?.id) {
      await supabase.from('areas').delete().eq('id', createdArea.id).catch(() => {});
    }
    throw error;
  }
}

/**
 * Area Management Endpoint Router
 *
 * What it does:
 * Routes incoming web requests to either list existing areas (GET) or establish a new area (POST).
 *
 * Backup plan if it breaks:
 * Rejects unsupported methods with 405 Method Not Allowed and captures errors in a standardized response.
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return await listAreas(req, res);
    if (req.method === 'POST') return await createArea(req, res);
    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return apiError(res, error);
  }
}
