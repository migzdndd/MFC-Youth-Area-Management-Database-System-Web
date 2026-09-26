/**
 * Applies strict HTTP security headers to server responses.
 *
 * @param {import('http').ServerResponse} res
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
 * Parses raw Cookie header string into a key-value dictionary.
 *
 * @param {string} [cookieHeader='']
 * @returns {Record<string, string>}
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
 * Serializes a cookie name and value with security flags.
 *
 * @param {string} name
 * @param {string} val
 * @param {Object} [options={}]
 * @returns {string}
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
 * Sets secure, HttpOnly authentication cookies for access and refresh tokens.
 *
 * @param {import('http').ServerResponse} res
 * @param {{ accessToken: string, refreshToken?: string }} tokens
 * @param {boolean} [remember=false]
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
 * Clears authentication cookies upon logout.
 *
 * @param {import('http').ServerResponse} res
 */
export function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    serializeCookie('sb_access_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 0, expires: new Date(0) }),
    serializeCookie('sb_refresh_token', '', { httpOnly: true, secure: true, sameSite: 'Lax', path: '/api/auth', maxAge: 0, expires: new Date(0) })
  ]);
}

/**
 * Sends a JSON response with security headers and no-cache controls.
 *
 * @param {import('http').ServerResponse} res - The response object.
 * @param {number} status - HTTP status code.
 * @param {Object} body - The JSON payload to send.
 * @returns {void}
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
 * Sends a 405 Method Not Allowed response.
 *
 * @param {import('http').ServerResponse} res - The response object.
 * @param {string[]} [allowed=[]] - List of allowed HTTP methods.
 * @returns {void}
 */
export function methodNotAllowed(res, allowed = []) {
  if (allowed.length) res.setHeader('Allow', allowed.join(', '));
  return sendJson(res, 405, {
    ok: false,
    error: 'Method not allowed.'
  });
}

/**
 * Extracts authentication token from Bearer header or fallback secure cookie.
 *
 * @param {import('http').IncomingMessage} req - The request object.
 * @returns {string} The extracted token or an empty string.
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
 * Normalizes an email address string.
 *
 * @param {string} [value=''] - The email address to normalize.
 * @returns {string} The normalized email address.
 */
export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

/**
 * Validates whether the given string is a basic valid email address.
 *
 * @param {string} [value=''] - The email address to check.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValidEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

/**
 * Converts a raw backend error into a safe message to return to the client.
 *
 * @param {Error|any} error - The caught error object.
 * @returns {string} Safe error message.
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
 * Sends a standardized API error response.
 *
 * @param {import('http').ServerResponse} res - The response object.
 * @param {Error|any} error - The caught error object.
 * @returns {void}
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
