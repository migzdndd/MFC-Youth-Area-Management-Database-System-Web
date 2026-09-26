/**
 * Apply Web Security Shields to Browser Response
 *
 * What it does:
 * Adds strict security rules to web responses to prevent clickjacking, data snooping, cross-site leaks, and unauthorized browser feature access.
 *
 * Backup plan if it breaks:
 * If the response has already been sent to the browser or is invalid, it safely exits without throwing an error.
 */
export function applySecurityHeaders(res) {
  if (!res || res.headersSent) return;

  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
}

/**
 * Parse Browser Cookies into Read-Only Values
 *
 * What it does:
 * Takes the raw cookie header text sent by the browser and turns it into an easy-to-read dictionary of names and values.
 *
 * Backup plan if it breaks:
 * If a cookie value has strange character encoding, it catches the decode failure and keeps the raw text instead of crashing.
 */
export function parseCookies(cookieHeader = '') {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const pairs = String(cookieHeader).split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
}

/**
 * Build Secure Browser Cookie String
 *
 * What it does:
 * Formats a cookie with security protections including HttpOnly (hidden from malicious browser scripts), Secure (HTTPS only), and SameSite protections.
 *
 * Backup plan if it breaks:
 * Automatically defaults to the website root path '/' and 'SameSite=Lax' if custom settings are omitted.
 */
export function serializeCookie(name, val, options = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.path) cookie += `; Path=${options.path}`;
  else cookie += '; Path=/';
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure !== false) cookie += '; Secure';
  if (options.sameSite) {
    const sameSite = String(options.sameSite).toLowerCase();
    if (sameSite === 'lax') cookie += '; SameSite=Lax';
    else if (sameSite === 'strict') cookie += '; SameSite=Strict';
    else if (sameSite === 'none') cookie += '; SameSite=None';
  } else {
    cookie += '; SameSite=Lax';
  }
  return cookie;
}

/**
 * Store Protected Login Session Cookies
 *
 * What it does:
 * Gives the user's browser encrypted session cookies so they stay safely logged in between page visits without exposing tokens to web scripts.
 *
 * Backup plan if it breaks:
 * If the login access token is missing, it exits silently without issuing blank or broken cookies.
 */
export function setAuthCookies(res, tokens, remember = false) {
  if (!tokens?.accessToken) return;
  const maxAge = remember ? 30 * 24 * 60 * 60 : 3600;

  const cookies = [
    serializeCookie('sb_access_token', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge
    })
  ];

  if (tokens.refreshToken) {
    cookies.push(serializeCookie('sb_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60
    }));
  }

  res.setHeader('Set-Cookie', cookies);
}

/**
 * Erase Login Cookies on Logout
 *
 * What it does:
 * Immediately instructs the user's browser to delete all active session tokens when they click Log Out.
 *
 * Backup plan if it breaks:
 * Sets the expiration date to the year 1970 and max-age to 0, guaranteeing the browser purges them immediately.
 */
export function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    serializeCookie('sb_access_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 0, expires: new Date(0) }),
    serializeCookie('sb_refresh_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/api/auth', maxAge: 0, expires: new Date(0) })
  ]);
}

/**
 * Send Clean JSON Data Response to Client
 *
 * What it does:
 * Applies security headers, disables browser caching so data is always fresh, and sends structured data back to the user.
 *
 * Backup plan if it breaks:
 * Ensures responses are consistently encoded in standard UTF-8 format so special characters and accents never display as gibberish.
 */
export function sendJson(res, status, body) {
  applySecurityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!res.hasHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  return res.json(body);
}

/**
 * Reject Unsupported HTTP Request Method
 *
 * What it does:
 * Sends an error code 405 if a user tries an unsupported network action (such as trying to POST data to a read-only endpoint).
 *
 * Backup plan if it breaks:
 * Attaches an 'Allow' header informing the client which actions are actually permitted.
 */
export function methodNotAllowed(res, allowed = []) {
  if (allowed.length) res.setHeader('Allow', allowed.join(', '));
  return sendJson(res, 405, {
    ok: false,
    error: 'Method not allowed.'
  });
}

/**
 * Extract Digital Security Pass from Request
 *
 * What it does:
 * Searches for the user's login pass either inside the standard Authorization header or within secure browser cookies.
 *
 * Backup plan if it breaks:
 * If no valid security pass is present in either location, it returns an empty string so the authentication checker can reject the request cleanly.
 */
export function readBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(String(header));
  if (match) return match[1].trim();

  if (req.headers?.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.sb_access_token) return cookies.sb_access_token;
    if (cookies['sb-access-token']) return cookies['sb-access-token'];
  }
  return '';
}

/**
 * Clean and Standardize Email Address
 *
 * What it does:
 * Trims surrounding spaces and changes all letters to lowercase so login emails match reliably.
 *
 * Backup plan if it breaks:
 * Handles null or non-string inputs safely by turning them into clean strings first.
 */
export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

/**
 * Verify Basic Email Address Pattern
 *
 * What it does:
 * Checks whether an entered email contains an @ symbol and a domain name (like user@example.com).
 *
 * Backup plan if it breaks:
 * If the text is empty or lacks standard email components, it safely returns false.
 */
export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

/**
 * Translate Technical Server Errors into Friendly Messages
 *
 * What it does:
 * Replaces cryptic database error codes with plain-English explanations so users understand what went wrong without seeing sensitive internal server details.
 *
 * Backup plan if it breaks:
 * If an unfamiliar error occurs, it falls back to a safe generic "Backend request failed" message to prevent exposing internal secrets.
 */
function safeBackendMessage(error) {
  const message = String(error?.message || '').trim();
  const lower = message.toLowerCase();

  if (!message) return 'Backend request failed.';
  if (lower.includes('invalid api key') || lower.includes('api key')) {
    return 'Supabase API credentials are invalid. Check the Backend Vercel environment variables.';
  }
  if (lower.includes('failed to fetch') || lower.includes('fetch failed') || lower.includes('enotfound')) {
    return 'The backend could not reach Supabase. Check SUPABASE_URL.';
  }
  if (lower.includes('password')) {
    return message;
  }
  if (lower.includes('email') && (lower.includes('already') || lower.includes('registered'))) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'The Supabase database schema is incomplete. Run the backend SQL migrations.';
  }
  if (lower.includes('permission denied') || lower.includes('row-level security')) {
    return 'Supabase rejected a database operation. Check the backend secret key and database permissions.';
  }

  return 'Backend request failed.';
}

/**
 * Standardized API Error Dispatcher
 *
 * What it does:
 * Formats any server or validation error into a clean JSON reply with an appropriate status code and user-readable explanation.
 *
 * Backup plan if it breaks:
 * In development mode, includes detailed error diagnostic information to help developers troubleshoot quickly without exposing them in production.
 */
export function apiError(res, error) {
  const status = Number(error?.statusCode) || 500;
  const body = {
    ok: false,
    error: status >= 500 ? safeBackendMessage(error) : (error?.message || 'Request failed.')
  };

  if (error?.code) body.code = error.code;
  if (error?.stage) body.stage = error.stage;

  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    body.detail = error?.message || String(error);
  }

  return sendJson(res, status, body);
}
