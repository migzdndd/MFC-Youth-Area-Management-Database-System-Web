import {
  isAreaAdminRole,
  isChapterServantRole
} from './access.js';

/**
 * Sanitize and Trim Plain Text
 *
 * What it does:
 * Strips accidental whitespace from text inputs and caps length to prevent accidental database overflow.
 *
 * Backup plan if it breaks:
 * If a null or undefined value is passed, it returns an empty string without crashing.
 */
export function cleanText(value, max = 255) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : '';
}

/**
 * Clean Text or Convert Empty to Null
 *
 * What it does:
 * Cleans user text, converting completely blank inputs into database null values.
 *
 * Backup plan if it breaks:
 * If the input text is blank or missing, it safely returns null.
 */
export function nullableText(value, max = 255) {
  return cleanText(value, max) || null;
}

/**
 * Validate Unique System ID Format
 *
 * What it does:
 * Verifies that a record's unique ID matches the official 36-character format used by the database.
 *
 * Backup plan if it breaks:
 * If the ID contains invalid symbols, letters, or wrong lengths, it safely returns false.
 */
export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

/**
 * Determine Area Scope for Current Action
 *
 * What it does:
 * Finds which Area community the user belongs to, allowing National Coordinators to switch between areas via special headers.
 *
 * Backup plan if it breaks:
 * If the user's account has no Area assigned, it stops immediately with a 409 error asking them to assign an area first.
 */
export function requireArea(req, profile) {
  if (profile?.role === 'national_coordinator') {
    const override = req.headers['x-mfc-area-id'] || req.headers['X-MFC-Area-ID'];
    if (override) return override;
  }
  if (!profile?.area_id) {
    const error = new Error('Your account is not assigned to an Area.');
    error.statusCode = 409;
    error.code = 'AREA_REQUIRED';
    throw error;
  }
  return profile.area_id;
}

/**
 * Restrict Operation to Area Leadership
 *
 * What it does:
 * Ensures only Area-level leaders (like Area Servants or Coordinators) can perform high-privilege management actions.
 *
 * Backup plan if it breaks:
 * If an unauthorized user or chapter servant attempts an area-admin-only action, it throws a 403 Forbidden error.
 */
export function requireAreaAdmin(profile, message = 'Only Area-level servant accounts can perform this action.') {
  if (!isAreaAdminRole(profile?.role)) {
    const error = new Error(message);
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }
}

/**
 * Ensure User Has General Leadership Privileges
 *
 * What it does:
 * Verifies that the user is either an Area servant or a Chapter servant before letting them manage chapter and activity records.
 *
 * Backup plan if it breaks:
 * If the user does not hold a recognized leadership role, it halts execution and issues a 403 Forbidden error.
 */
export function requireLeadership(profile) {
  if (!isAreaAdminRole(profile?.role) && !isChapterServantRole(profile?.role)) {
    const error = new Error('You do not have permission to manage this data.');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }
}

/**
 * Validate Standard Date Format (YYYY-MM-DD)
 *
 * What it does:
 * Checks that an input date is written correctly as Year-Month-Day and corresponds to a real calendar day.
 *
 * Backup plan if it breaks:
 * If the date is missing when required, or is an impossible date like Feb 31, it raises a 400 Bad Request error.
 */
export function validateIsoDate(value, { required = false } = {}) {
  const text = String(value || '').trim();
  if (!text) {
    if (required) {
      const error = new Error('A valid date is required.');
      error.statusCode = 400;
      throw error;
    }
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    const error = new Error('A valid date is required.');
    error.statusCode = 400;
    throw error;
  }
  return text;
}

/**
 * Convert Value to Non-Negative Decimal Number
 *
 * What it does:
 * Translates input text into a valid positive number or zero, suitable for fee or money amounts.
 *
 * Backup plan if it breaks:
 * If the input is negative, text, or not a number, it safely returns the fallback number (default 0).
 */
export function asNonNegativeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

/**
 * Convert Value to Non-Negative Whole Number
 *
 * What it does:
 * Translates input text into a clean whole integer count, suitable for attendee headcounts.
 *
 * Backup plan if it breaks:
 * If the value has fractions or is invalid, it safely falls back to the default whole number (default 0).
 */
export function asNonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

/**
 * Retrieve Single Record Belonging to Area
 *
 * What it does:
 * Queries the database for a specific record by ID, ensuring it belongs exclusively to the user's assigned Area.
 *
 * Backup plan if it breaks:
 * If the ID or Area is missing, it returns null without issuing a database query. If a database error occurs, it throws the error so the caller can catch it.
 */
export async function loadAreaRow(supabase, table, id, areaId, columns = '*') {
  if (!id || !areaId) return null;
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq('id', id)
    .eq('area_id', areaId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Verify Chapter Belongs to Current Area
 *
 * What it does:
 * Checks that the chosen chapter is officially part of the leader's assigned Area before linking any members or reports to it.
 *
 * Backup plan if it breaks:
 * If the chapter belongs to a different Area or cannot be found, it raises a 400 error preventing accidental cross-area data contamination.
 */
export async function ensureChapterInArea(supabase, chapterId, areaId) {
  if (!chapterId) return null;
  const chapter = await loadAreaRow(supabase, 'chapters', chapterId, areaId, 'id, area_id, name');
  if (!chapter) {
    const error = new Error('The selected chapter does not belong to your Area.');
    error.statusCode = 400;
    throw error;
  }
  return chapter;
}

/**
 * Retrieve Chapter Servant's Assigned Chapter ID
 *
 * What it does:
 * Inspects a leader's profile and returns their assigned chapter ID if they are a Chapter Servant, or null if they are an Area-wide leader.
 *
 * Backup plan if it breaks:
 * If the user's role is not a chapter servant or their profile has no chapter ID, it safely returns null.
 */
export function scopedChapterId(profile) {
  return isChapterServantRole(profile?.role) ? profile?.chapter_id || null : null;
}
