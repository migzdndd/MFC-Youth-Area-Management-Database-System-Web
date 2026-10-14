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
