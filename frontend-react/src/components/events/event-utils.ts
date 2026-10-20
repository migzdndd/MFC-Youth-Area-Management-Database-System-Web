import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ROLE_LABELS, type UserRole } from '@/types/auth';
import type { CommunityEvent } from '@/types/event';

export const getEventRelativeTime = (startsAt: string): string => {
  const now = new Date();
  const eventDate = new Date(startsAt);
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < -1000 * 60 * 60 * 24) {
    const daysAgo = Math.abs(diffDays);
    return `Concluded ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  }
  if (diffMs < 0) {
    return 'Happening today / Concluding';
  }
  if (diffHours < 24) {
    return diffHours <= 1 ? 'Starting shortly' : `Starts in ${diffHours} hours`;
  }
  return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
};

export const getEventStatusBadge = (
  startsAt: string
): { label: string; variant: 'default' | 'warning' | 'success' } => {
  const now = new Date();
  const eventDate = new Date(startsAt);
  const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < -24) {
    return { label: 'Past Gathering', variant: 'default' };
  }
  if (diffHours >= -24 && diffHours <= 12) {
    return { label: 'Active / Today', variant: 'warning' };
  }
  return { label: 'Upcoming', variant: 'success' };
};

export const formatForDateTimeInput = (dateString?: string | null): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export interface SecretariatMetadata {
  category?: string;
  targetTrack?: string;
  targetHeadcount?: string;
  secretariatLead?: string;
  secretariatContact?: string;
  registrationDeadline?: string;
  dressCode?: string;
  thingsToBring?: string;
  secretariatNotes?: string;
}

export const SECRETARIAT_MARKER = '📋 SECRETARIAT BRIEFING & EVENT LOGISTICS';

export const EVENT_CATEGORIES = [
  { value: 'Chapter Assembly', label: 'Chapter Assembly (Monthly Gathering)' },
  { value: 'Area Assembly / Conference', label: 'Area Assembly / Conference' },
  { value: 'Youth Camp', label: 'Youth Camp (Entry-Level Formation)' },
  { value: 'Leaders Retreat & Formation', label: 'Leaders Retreat & Formation' },
  { value: 'Praise & Worship Gathering', label: 'Praise & Worship Gathering' },
  { value: 'Fellowship & Sportsfest', label: 'Fellowship & Sportsfest' },
  { value: 'Creative & Liturgical Workshop', label: 'Creative & Liturgical Workshop' },
  { value: 'Pastoral Meeting', label: 'Pastoral Meeting / Briefing' },
  { value: 'Community Service & Mission', label: 'Community Service & Mission' },
  { value: 'Other Gathering', label: 'Other Gathering' },
];

export const TARGET_TRACK_OPTIONS = [
  { value: 'All Demographic Tracks', label: 'All Demographic Tracks (Universal)' },
  { value: 'Heartchamps (MFC Kids)', label: 'Heartchamps (MFC Kids 7–12)' },
  { value: 'Junior High School (JHS 7-10)', label: 'Junior High School (JHS 7–10)' },
  { value: 'Senior High School (SHS 11-12)', label: 'Senior High School (SHS 11–12)' },
  { value: 'College Track', label: 'College Track' },
  { value: 'Working Youth Track', label: 'Working Youth Track' },
  { value: 'Servant Leaders Only', label: 'Servant Leaders Only' },
];

export const DRESS_CODE_OPTIONS = [
  { value: 'Community Shirt / Blue Shirt', label: 'Community Shirt / Blue Shirt' },
  { value: 'Sunday Best / Church Formal', label: 'Sunday Best / Church Formal' },
  { value: 'Modest Casual', label: 'Modest Casual' },
  { value: 'Sports / Athletic Attire', label: 'Sports / Athletic Attire' },
  { value: 'White Top / Shirt', label: 'White Top / Shirt' },
  { value: 'Color-Coded Chapter Shirt', label: 'Color-Coded Chapter Shirt' },
];

export function serializeDescription(
  mainDescription: string,
  meta: SecretariatMetadata
): string {
  const metaLines: string[] = [];
  if (meta.category?.trim()) metaLines.push(`• Category: ${meta.category.trim()}`);
  if (meta.targetTrack?.trim()) metaLines.push(`• Target Demographic: ${meta.targetTrack.trim()}`);
  if (meta.targetHeadcount?.trim()) metaLines.push(`• Target Headcount: ${meta.targetHeadcount.trim()}`);
  if (meta.secretariatLead?.trim()) {
    const contact = meta.secretariatContact?.trim() ? ` (${meta.secretariatContact.trim()})` : '';
    metaLines.push(`• Secretariat Lead: ${meta.secretariatLead.trim()}${contact}`);
  } else if (meta.secretariatContact?.trim()) {
    metaLines.push(`• Secretariat Contact: ${meta.secretariatContact.trim()}`);
  }
  if (meta.registrationDeadline?.trim()) metaLines.push(`• Registration Deadline: ${meta.registrationDeadline.trim()}`);
  if (meta.dressCode?.trim()) metaLines.push(`• Attire / Dress Code: ${meta.dressCode.trim()}`);
  if (meta.thingsToBring?.trim()) metaLines.push(`• Things to Bring: ${meta.thingsToBring.trim()}`);
  if (meta.secretariatNotes?.trim()) metaLines.push(`• Secretariat Notes: ${meta.secretariatNotes.trim()}`);

  const cleanMain = mainDescription.trim();

  if (metaLines.length === 0) {
    return cleanMain;
  }

  const secretariatBlock = [
    '──────────────────────────────────────',
    SECRETARIAT_MARKER,
    '──────────────────────────────────────',
    ...metaLines,
  ].join('\n');

  return cleanMain ? `${cleanMain}\n\n${secretariatBlock}` : secretariatBlock;
}

export function parseDescription(rawDescription?: string | null): {
  mainDescription: string;
  meta: SecretariatMetadata;
} {
  if (!rawDescription) {
    return { mainDescription: '', meta: {} };
  }

  const markerIndex = rawDescription.indexOf(SECRETARIAT_MARKER);
  if (markerIndex === -1) {
    return { mainDescription: rawDescription, meta: {} };
  }

  const beforeMarker = rawDescription.substring(0, markerIndex);
  const dividerMatch = beforeMarker.match(/─{10,}\s*$/);
  const mainDescription = (dividerMatch
    ? beforeMarker.substring(0, dividerMatch.index)
    : beforeMarker
  ).trim();

  const afterMarker = rawDescription.substring(markerIndex + SECRETARIAT_MARKER.length);
  const lines = afterMarker.split('\n');

  const meta: SecretariatMetadata = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('•')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.substring(1, colonIdx).trim().toLowerCase();
    const val = trimmed.substring(colonIdx + 1).trim();

    if (key === 'category') meta.category = val;
    else if (key.includes('target demographic') || key.includes('target track')) meta.targetTrack = val;
    else if (key.includes('headcount')) meta.targetHeadcount = val;
    else if (key.includes('secretariat lead')) {
      const match = val.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        meta.secretariatLead = match[1].trim();
        meta.secretariatContact = match[2].trim();
      } else {
        meta.secretariatLead = val;
      }
    } else if (key.includes('secretariat contact')) meta.secretariatContact = val;
    else if (key.includes('deadline')) meta.registrationDeadline = val;
    else if (key.includes('attire') || key.includes('dress code')) meta.dressCode = val;
    else if (key.includes('things to bring')) meta.thingsToBring = val;
    else if (key.includes('secretariat notes')) meta.secretariatNotes = val;
  }

  return { mainDescription, meta };
}

export const generateEventBriefingText = (
  event: CommunityEvent,
  areaName?: string
): string => {
  const relative = getEventRelativeTime(event.starts_at);
  const feeText = event.fee > 0 ? formatCurrency(event.fee) : 'Free';
  const creatorRoleText = event.creator_role
    ? ROLE_LABELS[event.creator_role as UserRole] || event.creator_role
    : 'Area Servant';
  const organizer = event.creator_name
    ? `${event.creator_name} (${creatorRoleText})`
    : 'Area Leadership';

  const lines = [
    `*${event.name}*`,
    `Date & Time: ${formatDateTime(event.starts_at)} (${relative})`,
    `Venue: ${event.venue}`,
    `Registration Fee: ${feeText}`,
    `Organized By: ${organizer}`,
    `Area: ${areaName || 'Area Community'}`,
  ];

  if (event.description?.trim()) {
    lines.push('', 'Briefing & Description:', event.description.trim());
  }

  return lines.join('\n');
};
