import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  MapPin,
  Clock,
  Users,
  Trash2,
  Edit2,
  ChevronRight,
  Eye,
} from 'lucide-react';
import type { CommunityEvent } from '@/types/event';
import { getEventStatusBadge } from './event-utils';

interface EventCardProps {
  event: CommunityEvent;
  canEdit: boolean;
  onOpenDetails: (event: CommunityEvent) => void;
  onViewSummary: (event: CommunityEvent) => void;
  onEdit: (event: CommunityEvent) => void;
  onDelete: (event: CommunityEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  canEdit,
  onOpenDetails,
  onViewSummary,
  onEdit,
  onDelete,
}) => {
  const statusInfo = getEventStatusBadge(event.starts_at);

  const handleCardClick = () => {
    if (canEdit) {
      onOpenDetails(event);
    } else {
      onViewSummary(event);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-navy/40 transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-navy/30"
      title={
        canEdit
          ? 'Click to view Attendance & Payments Data Grid'
          : 'Click to view Event Comprehensive Briefing'
      }
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-slate-900 text-base font-heading group-hover:text-navy transition-colors line-clamp-2">
            {event.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewSummary(event);
              }}
              className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 active:scale-95 rounded-lg transition-all duration-150 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="View Event Summary"
              aria-label="View Event Summary"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 active:scale-95 rounded-lg transition-all duration-150 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title={`Edit ${event.name}`}
                  aria-label={`Edit ${event.name}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-lg transition-all duration-150 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title={`Delete ${event.name}`}
                  aria-label={`Delete ${event.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <Badge variant={event.fee > 0 ? 'warning' : 'success'}>
              {event.fee > 0 ? formatCurrency(event.fee) : 'Free'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {event.creator_name && (
            <span className="text-[11px] text-slate-500 truncate">
              By {event.creator_name}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="space-y-2 py-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Clock className="w-3.5 h-3.5 text-navy shrink-0" />
            <span className="font-medium">{formatDateTime(event.starts_at)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate font-medium">{event.venue}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-navy group-hover:text-navy-light">
        <span className="flex items-center gap-1.5">
          {canEdit ? (
            <>
              <Users className="w-4 h-4 text-navy" />
              <span>View Attendance Grid</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-navy" />
              <span>View Comprehensive Summary</span>
            </>
          )}
        </span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150 ease-out" />
      </div>
    </div>
  );
};
