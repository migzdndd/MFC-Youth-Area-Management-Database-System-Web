/**
 * ============================================================================
 * MFC Youth Area Management System - Global Settings & Ministry Lists
 * ============================================================================
 * What this file is:
 * This script holds the standard rules, ministry names, and access roles
 * used across the entire Area Management System.
 *
 * Backup plan if something breaks:
 * If an unrecognized role or scrambled text is found, this file supplies safe
 * default values so the rest of the application never gets stuck.
 * ============================================================================
 */

// Section 1: Storage Keys & Visual Smoothness

// Storage labels for browser memory
const DB_KEY = 'mfc_web_database_v1';
const SESSION_KEY = 'mfc_demo_session';
const USER_KEY = 'mfc_demo_users';
const DB_VERSION = 8;
let activeModalCleanup = null;

/**
 * Initializes Smooth Fade-in Animations
 *
 * What it does:
 * Makes cards and tables fade in gently as you scroll or open pages.
 *
 * Backup plan if it breaks:
 * If your device has "Reduce Motion" turned on in system settings, it turns
 * off the animations immediately and displays everything without delay.
 */
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

// Section 2: Standard Ministries & Access Roles

// Official list of youth community services
const SERVICES = [
  'Unit Servant',
  'Household Servant',
  'Chapter Servant',
  'Area Servant',
  'Area LIT Servant',
  'Campus Servant',
  'Area Kids Servant',
  'MFC High Servant',
  'Music',
  'Dance',
  'Creative Writing',
  'Graphics & Promo',
  'Photography & Videography'
];

// Official leadership levels and user-friendly labels
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

// Common alternative spellings mapped to official ministry names
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
  ['mfc high servant', 'MFC High Servant'],
  ['mfc_high_servant', 'MFC High Servant'],
  ['music', 'Music'],
  ['dance', 'Dance'],
  ['creative writing', 'Creative Writing'],
  ['creative_writing', 'Creative Writing'],
  ['graphics & promo', 'Graphics & Promo'],
  ['graphics and promo', 'Graphics & Promo'],
  ['graphics_promo', 'Graphics & Promo'],
  ['photography & videography', 'Photography & Videography'],
  ['photography and videography', 'Photography & Videography'],
  ['photography_videography', 'Photography & Videography']
]);

// Maps leadership positions to their default ministry title
const ACCESS_ROLE_SERVICE_MAP = Object.freeze({
  area_servant: 'Area Servant',
  lit_servant: 'Area LIT Servant',
  campus_servant: 'Campus Servant',
  area_kids_servant: 'Area Kids Servant',
  mfc_high_servant: 'MFC High Servant',
  chapter_servant: 'Chapter Servant'
});

// Section 3: Name Cleaning & Role Detection Helpers

/**
 * Standardizes Ministry Name
 *
 * What it does:
 * Converts variations or lowercase ministry names into official titles.
 *
 * Backup plan if it breaks:
 * If the input is empty, it returns blank text. If the name is unlisted,
 * it returns the original text so your custom title is not lost.
 */
function normalizeServiceName(value) {
  const service = String(value || '').trim().replace(/\s+/g, ' ');
  if (!service) return '';
  return SERVICE_ALIASES.get(service.toLowerCase()) || service;
}

/**
 * Finds Member Ministries
 *
 * What it does:
 * Looks up what ministry a member belongs to, or infers one from their servant title.
 *
 * Backup plan if it breaks:
 * If no ministry or leadership role matches, it safely returns an empty list.
 */
function detectedMemberServices(member) {
  const explicit = Array.isArray(member?.services)
    ? [...new Set(member.services.map(normalizeServiceName).filter(Boolean))]
    : [];
  if (explicit.length) return [explicit[0]];

  const inferred = ACCESS_ROLE_SERVICE_MAP[normalizeAccessRole(member?.accessLevel || 'member')];
  return inferred ? [inferred] : [];
}

// Leadership roles with Area-wide management access
const AREA_ADMIN_ROLES = new Set([
  'national_coordinator',
  'couple_coordinator',
  'area_servant',
  'lit_servant',
  'campus_servant',
  'mfc_high_servant',
  'area_kids_servant',
  'area_admin'
]);

/**
 * Validates Access Role
 *
 * What it does:
 * Confirms that a role matches an approved system permission level.
 *
 * Backup plan if it breaks:
 * If an unrecognized or blank role is provided, it safely defaults to "member"
 * so unauthorized actions are blocked.
 */
function normalizeAccessRole(value) {
  const role = String(value || 'member').trim().toLowerCase();
  if (role === 'area_admin') return 'area_servant';
  return ACCESS_ROLE_VALUES.has(role) ? role : 'member';
}

/**
 * User-Friendly Role Title
 *
 * What it does:
 * Returns the human-readable label for a role (e.g., "Area Servant").
 *
 * Backup plan if it breaks:
 * If missing, it safely returns "Member".
 */
function accessRoleLabel(value) {
  const normalized = normalizeAccessRole(value);
  return ACCESS_LEVELS.find(item => item.value === normalized)?.label || 'Member';
}

/**
 * Safe Text for Click Handlers
 *
 * What it does:
 * Encodes text safely before embedding it in button click actions so quotes
 * or symbols don't break the page.
 *
 * Backup plan if it breaks:
 * Cleans out angle brackets, quotes, and ampersands automatically.
 */
function inlineJsArg(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

/**
 * Checks Area Admin Role
 *
 * What it does:
 * Checks if a specific role string belongs to an Area-level leader.
 *
 * Backup plan if it breaks:
 * Returns false if blank or missing.
 */
function isAreaAdminRole(value) {
  return AREA_ADMIN_ROLES.has(String(value || '').trim().toLowerCase());
}

/**
 * Checks Chapter Servant Role
 *
 * What it does:
 * Checks if a specific role string is "chapter_servant".
 *
 * Backup plan if it breaks:
 * Returns false if blank or missing.
 */
function isChapterServantRole(value) {
  return String(value || '').trim().toLowerCase() === 'chapter_servant';
}

/**
 * Safe Data Reader
 *
 * What it does:
 * Unpacks saved information from storage.
 *
 * Backup plan if it breaks:
 * If the saved text is corrupt, it returns the provided safe fallback.
 */
function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Retrieves Active Login Session
 *
 * What it does:
 * Checks whether you are currently logged in.
 *
 * Backup plan if it breaks:
 * Returns null if no login data exists.
 */
function getSession() {
  return (
    safeParse(localStorage.getItem(SESSION_KEY), null) ||
    safeParse(sessionStorage.getItem(SESSION_KEY), null)
  );
}

/**
 * Updates Saved Login Details
 *
 * What it does:
 * Saves updated account details (like newly chosen areas or names) into storage.
 *
 * Backup plan if it breaks:
 * Detects whether you chose "Remember Me" and updates the right storage location
 * without losing your sign-in preferences.
 */
function updateStoredSession(nextSession) {
  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }
}
