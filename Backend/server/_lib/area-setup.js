import { STANDARD_SERVICES } from './service-catalog.js';

/**
 * Generate a clean, URL-safe and human-readable area code from a given name.
 */
export function areaCodeFromName(name) {
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
 * Resolve an existing Area Database by ID or name, or safely create a new one
 * initialized with default community ministry services.
 *
 * @param {object} params
 * @param {object} params.admin Supabase admin client
 * @param {string} [params.areaId] Existing area ID
 * @param {string} [params.newAreaName] New area name to create or match
 * @returns {Promise<{ area: object|null, createdAreaId: string|null }>}
 */
export async function resolveOrCreateArea({ admin, areaId, newAreaName }) {
  let targetArea = null;
  let createdAreaId = null;

  if (newAreaName && newAreaName.trim().length >= 3) {
    const cleanName = newAreaName.trim();
    const { data: existingByName, error: existingError } = await admin
      .from('areas')
      .select('id, name, code, is_active')
      .ilike('name', cleanName)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingByName) {
      targetArea = existingByName;
    } else {
      let code = areaCodeFromName(cleanName);
      const { data: codeConflict } = await admin
        .from('areas')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (codeConflict) {
        code = `${code.slice(0, 38)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      }

      const { data: newArea, error: createAreaError } = await admin
        .from('areas')
        .insert({ name: cleanName, code, is_active: true })
        .select('id, name, code, is_active')
        .single();

      if (createAreaError) throw createAreaError;
      targetArea = newArea;
      createdAreaId = newArea.id;

      // Seed standard youth ministry service catalog
      const { error: serviceError } = await admin
        .from('services')
        .insert(STANDARD_SERVICES.map((serviceName) => ({
          area_id: newArea.id,
          name: serviceName,
          is_active: true
        })));

      if (serviceError) throw serviceError;
    }
  } else if (areaId) {
    const { data: existingArea, error: areaFetchError } = await admin
      .from('areas')
      .select('id, name, code, is_active')
      .eq('id', areaId)
      .maybeSingle();

    if (areaFetchError) throw areaFetchError;
    if (existingArea && existingArea.is_active !== false) {
      targetArea = existingArea;
    }
  }

  return { targetArea, createdAreaId };
}
