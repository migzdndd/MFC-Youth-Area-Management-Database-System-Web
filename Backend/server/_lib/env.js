/**
 * Clean Environment Secret Text
 *
 * What it does:
 * Trims accidental spaces from configuration keys and passwords loaded from system settings.
 *
 * Backup plan if it breaks:
 * If a setting is missing or null, it returns an empty string without crashing.
 */
function cleanEnv(value) {
  return String(value ?? '').trim();
}

/**
 * Clean Web Address Base URL
 *
 * What it does:
 * Cleans the website or database address and removes trailing slashes so routes combine cleanly.
 *
 * Backup plan if it breaks:
 * If empty, it safely returns an empty string.
 */
function cleanBaseUrl(value) {
  return cleanEnv(value).replace(/\/+$/, '');
}

/**
 * Load Server Configuration and Secret Keys
 *
 * What it does:
 * Gathers the cloud database URL, public key, secret master key, and administrator registration passcode from environment variables.
 *
 * Backup plan if it breaks:
 * Checks both modern and older alternative environment variable names so the system still connects even if settings use legacy naming.
 */
export function backendConfig() {
  const publishableKey = cleanEnv(
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  const secretKey = cleanEnv(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  return {
    supabaseUrl: cleanBaseUrl(process.env.SUPABASE_URL),
    supabaseAnonKey: publishableKey,
    supabaseServiceRoleKey: secretKey,
    supabasePublishableKey: publishableKey,
    supabaseSecretKey: secretKey,
    usingLegacyPublishableEnv: !cleanEnv(process.env.SUPABASE_PUBLISHABLE_KEY) && Boolean(cleanEnv(process.env.SUPABASE_ANON_KEY)),
    usingLegacySecretEnv: !cleanEnv(process.env.SUPABASE_SECRET_KEY) && Boolean(cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)),
    adminRegistrationCode: cleanEnv(process.env.ADMIN_REGISTRATION_CODE)
  };
}

/**
 * Verify Cloud Database Web Address Format
 *
 * What it does:
 * Ensures the configured database address is a valid, secure HTTPS link ending in '.supabase.co'.
 *
 * Backup plan if it breaks:
 * If the link is missing, unparseable, or not a secure HTTPS Supabase URL, it returns a diagnostic object explaining the exact reason.
 */
export function validateSupabaseUrl(value) {
  const raw = cleanBaseUrl(value);
  if (!raw) return { valid: false, url: '', host: '', reason: 'missing' };

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') {
      return { valid: false, url: raw, host: parsed.host || '', reason: 'invalid_protocol' };
    }
    if (!parsed.hostname || !parsed.hostname.endsWith('.supabase.co')) {
      return { valid: false, url: raw, host: parsed.host || '', reason: 'invalid_host' };
    }
    return { valid: true, url: raw, host: parsed.host, reason: '' };
  } catch {
    return { valid: false, url: raw, host: '', reason: 'invalid_url' };
  }
}

/**
 * Ensure Cloud Database Connection is Ready
 *
 * What it does:
 * Verifies that all required cloud database keys and addresses exist before allowing data operations to run.
 *
 * Backup plan if it breaks:
 * If any necessary key is missing or the database URL is incorrect, it stops with a clear 503 error listing exactly which settings need to be fixed in the server configuration.
 */
export function assertBackendConfigured() {
  const config = backendConfig();
  const missing = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabasePublishableKey) missing.push('SUPABASE_PUBLISHABLE_KEY');
  if (!config.supabaseSecretKey) missing.push('SUPABASE_SECRET_KEY');

  if (missing.length) {
    const error = new Error(`Backend is not configured. Missing: ${missing.join(', ')}`);
    error.statusCode = 503;
    error.code = 'BACKEND_NOT_CONFIGURED';
    throw error;
  }

  const urlCheck = validateSupabaseUrl(config.supabaseUrl);
  if (!urlCheck.valid) {
    const error = new Error('SUPABASE_URL must be the HTTPS Project URL from Supabase.');
    error.statusCode = 503;
    error.code = 'INVALID_SUPABASE_URL';
    throw error;
  }

  return config;
}

/**
 * Ensure Leader Registration Secret Code is Configured
 *
 * What it does:
 * Checks whether an administrator invitation passcode has been set in the server settings before allowing coordinator account creation.
 *
 * Backup plan if it breaks:
 * If the registration code is missing from server settings, it halts with a 503 error preventing unauthorized public sign-ups.
 */
export function assertAdminRegistrationConfigured() {
  const { adminRegistrationCode } = backendConfig();
  if (!adminRegistrationCode) {
    const error = new Error('Administrator registration is not configured. Missing: ADMIN_REGISTRATION_CODE');
    error.statusCode = 503;
    error.code = 'ADMIN_REGISTRATION_NOT_CONFIGURED';
    throw error;
  }
  return { adminRegistrationCode };
}
