import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  User,
  CreditCard,
  FileText,
  Users,
  Copy,
  Check,
  Edit2,
} from 'lucide-react';
import { ROLE_LABELS, type UserRole } from '@/types/auth';
import type { CommunityEvent, Participant } from '@/types/event';
import { getEventRelativeTime, getEventStatusBadge } from './event-utils';

interface EventSummaryModalProps {
  event: CommunityEvent | null;
  isOpen: boolean;
  onClose: () => void;
  areaName?: string;
  canEdit: boolean;
  summaryParticipants: Participant[];
  isLoadingParticipants: boolean;
  hasCopiedBriefing: boolean;
  onCopyBriefing: (event: CommunityEvent) => void;
  onOpenAttendance: (event: CommunityEvent) => void;
  onOpenEdit: (event: CommunityEvent) => void;
}

export const EventSummaryModal: React.FC<EventSummaryModalProps> = ({
  event,
  isOpen,
  onClose,
  areaName,
  canEdit,
  summaryParticipants,
  isLoadingParticipants,
  hasCopiedBriefing,
  onCopyBriefing,
  onOpenAttendance,
  onOpenEdit,
}) => {
  if (!event) return null;

  const statusBadge = getEventStatusBadge(event.starts_at);
  const relativeTime = getEventRelativeTime(event.starts_at);

  const attendedCount = summaryParticipants.filter((p) => p.attended).length;
  const paidCount = summaryParticipants.filter(
    (p) => p.payment_status === 'Paid'
  ).length;
  const attendanceRate =
    summaryParticipants.length > 0
      ? Math.round((attendedCount / summaryParticipants.length) * 100)
      : 0;

  const chaptersRepresented = Array.from(
    new Set(
      summaryParticipants
        .map((p) => p.member?.chapter_name)
        .filter((c): c is string => Boolean(c))
    )
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Comprehensive Briefing"
      description={`Official overview and details for ${event.name}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              <Badge variant={event.fee > 0 ? 'warning' : 'success'}>
                {event.fee > 0
                  ? `${formatCurrency(event.fee)} Registration`
                  : 'Free Gathering'}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {relativeTime}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading tracking-tight mb-2">
            {event.name}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Area-wide community gathering organized under {areaName || 'Area Community'}.
          </p>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-navy/10 text-navy shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">
                Schedule & Timing
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {formatDateTime(event.starts_at)}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{relativeTime}</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-700 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-600">
                Venue Location
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {event.venue}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Designated gathering venue
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-800 shrink-0 mt-0.5">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-600">
                Event Organizer
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {event.creator_name || 'Area Leadership'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {event.creator_role
                  ? ROLE_LABELS[event.creator_role as UserRole] ||
                    event.creator_role
                  : 'Area Servant'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-800 shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">
                Registration Fee
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {event.fee > 0 ? formatCurrency(event.fee) : 'Free Admission'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {event.fee > 0
                  ? 'Remittance upon check-in'
                  : 'No registration charge'}
              </div>
            </div>
          </div>
        </div>

        {/* Agenda / Description */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
            <FileText className="w-4 h-4 text-navy" />
            <span>Program Briefing & Details</span>
          </div>
          {event.description?.trim() ? (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-500 italic">
              No additional briefing notes or description were provided for this gathering.
            </div>
          )}
        </div>

        {/* Attendance Snapshot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
              <Users className="w-4 h-4 text-navy" />
              <span>Attendance & Registration Snapshot</span>
            </div>
            {isLoadingParticipants && <Spinner size="sm" />}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-[11px] text-slate-500 font-medium">Registered</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {summaryParticipants.length}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-[11px] text-slate-500 font-medium">Attended</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                {attendedCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-[11px] text-slate-500 font-medium">Paid Fees</div>
              <div className="text-lg font-bold text-sky-700 mt-0.5">
                {paidCount}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <div className="text-[11px] text-slate-500 font-medium">
                Attendance Rate
              </div>
              <div className="text-lg font-bold text-navy mt-0.5">
                {attendanceRate}%
              </div>
            </div>
          </div>

          {chaptersRepresented.length > 0 && (
            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 text-xs">
              <span className="font-semibold text-slate-700 mr-2">
                Chapters Represented:
              </span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                {chaptersRepresented.map((chapterName) => (
                  <span
                    key={chapterName}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
                  >
                    {chapterName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onCopyBriefing(event)}
            className="flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            {hasCopiedBriefing ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {hasCopiedBriefing ? 'Briefing Copied!' : 'Copy Event Briefing'}
            </span>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="min-h-[44px]"
            >
              Close
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenAttendance(event);
              }}
              className="flex items-center gap-1.5 min-h-[44px]"
            >
              <Users className="w-4 h-4 text-navy" />
              <span>View Attendance Roster</span>
            </Button>

            {canEdit && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenEdit(event);
                }}
                className="flex items-center gap-1.5 min-h-[44px]"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Event</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
