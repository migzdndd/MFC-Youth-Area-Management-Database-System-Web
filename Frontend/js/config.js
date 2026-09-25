/**
 * ============================================================================
 * MFC Youth Area Management System - Config & Constants
 * ============================================================================
 */

const DB_KEY = 'mfc_web_database_v1';
const SESSION_KEY = 'mfc_demo_session';
const USER_KEY = 'mfc_demo_users';
const DB_VERSION = 8;
let activeModalCleanup = null;

function initializeMotionEffects() {
  const revealTargets = document.querySelectorAll('.animate-in');
  if (!revealTargets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  revealTargets.forEach((element, index) => {
    element.style.animationDelay = `${index * 80}ms`;
    requestAnimationFrame(() => element.classList.add('is-visible'));
  });
}

window.addEventListener('DOMContentLoaded', initializeMotionEffects);

const SERVICES = [
  'Unit Servant',
  'Household Servant',
  'Chapter Servant',
  'Area Servant',
  'Area LIT Servant',
  'Campus Servant',
  'Area Kids Servant',
  'MFC High Servant'
];

const ACCESS_LEVELS = [
  { value: 'national_coordinator', label: 'National Coordinator' },
  { value: 'couple_coordinator', label: 'Couple Coordinator/s' },
  { value: 'area_servant', label: 'Area Servant' },
  { value: 'lit_servant', label: 'Area LIT Servant' },
  { value: 'campus_servant', label: 'Campus Servant' },
  { value: 'area_kids_servant', label: 'Area Kids Servant' },
  { value: 'mfc_high_servant', label: 'MFC High Servant' },
  { value: 'chapter_servant', label: 'Chapter Servant' },
  { value: 'member', label: 'Member' }
];

const ACCESS_ROLE_VALUES = new Set(
  ACCESS_LEVELS.map(item => item.value)
);

const SERVICE_ALIASES = new Map([
  ['unit servant', 'Unit Servant'],
  ['household servant', 'Household Servant'],
  ['chapter servant', 'Chapter Servant'],
  ['area servant', 'Area Servant'],
  ['lit servant', 'Area LIT Servant'],
  ['area lit servant', 'Area LIT Servant'],
  ['lit_servant', 'Area LIT Servant'],
  ['campus servant', 'Campus Servant'],
  ['campus_servant', 'Campus Servant'],
  ['kids servant', 'Area Kids Servant'],
  ['area kids servant', 'Area Kids Servant'],
  ['area_kids_servant', 'Area Kids Servant'],
  ['mfc high servant', 'MFC High Servant']
]);

const ACCESS_ROLE_SERVICE_MAP = Object.freeze({
  area_servant: 'Area Servant',
  lit_servant: 'Area LIT Servant',
  campus_servant: 'Campus Servant',
  area_kids_servant: 'Area Kids Servant',
  mfc_high_servant: 'MFC High Servant',
  chapter_servant: 'Chapter Servant'
});

function normalizeServiceName(value) {
  const service = String(value || '').trim().replace(/\s+/g, ' ');
  if (!service) return '';
  return SERVICE_ALIASES.get(service.toLowerCase()) || service;
}

function detectedMemberServices(member) {
  const explicit = Array.isArray(member?.services)
    ? [...new Set(member.services.map(normalizeServiceName).filter(Boolean))]
    : [];
  if (explicit.length) return [explicit[0]];

  const inferred = ACCESS_ROLE_SERVICE_MAP[normalizeAccessRole(member?.accessLevel || 'member')];
  return inferred ? [inferred] : [];
}

const AREA_ADMIN_ROLES = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  // Kept only for compatibility with the older prototype session.
  'area_admin'
]);

function normalizeAccessRole(value) {
  const role = String(value || 'member').trim().toLowerCase();
  if (role === 'area_admin') return 'area_servant';
  return ACCESS_ROLE_VALUES.has(role) ? role : 'member';
}

function accessRoleLabel(value) {
  const normalized = normalizeAccessRole(value);
  return ACCESS_LEVELS.find(item => item.value === normalized)?.label || 'Member';
}

function inlineJsArg(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

function isAreaAdminRole(value) {
  return AREA_ADMIN_ROLES.has(String(value || '').trim().toLowerCase());
}

function isChapterServantRole(value) {
  return String(value || '').trim().toLowerCase() === 'chapter_servant';
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getSession() {
  return (
    safeParse(localStorage.getItem(SESSION_KEY), null) ||
    safeParse(sessionStorage.getItem(SESSION_KEY), null)
  );
}

function updateStoredSession(nextSession) {
  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }
}
