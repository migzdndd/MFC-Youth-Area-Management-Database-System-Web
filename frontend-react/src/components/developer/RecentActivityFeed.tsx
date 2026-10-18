import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import type { DeveloperMetrics } from '@/hooks/useDeveloper';

export interface RecentActivityFeedProps {
  metrics: DeveloperMetrics | undefined;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ metrics }) => {
  const [activeActivityTab, setActiveActivityTab] = useState<'members' | 'events' | 'reports'>('members');

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Recent System Activity
          </h2>
          <p className="text-xs text-slate-500">
            Latest updates and entries recorded across the community.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveActivityTab('members')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeActivityTab === 'members'
                ? 'bg-white text-navy shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Members ({metrics?.recentActivity.members.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveActivityTab('events')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeActivityTab === 'events'
                ? 'bg-white text-navy shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Events ({metrics?.recentActivity.events.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveActivityTab('reports')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeActivityTab === 'reports'
                ? 'bg-white text-navy shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reports ({metrics?.recentActivity.reports.length || 0})
          </button>
        </div>
      </div>

      {/* Activity items list */}
      <div className="space-y-2.5">
        {activeActivityTab === 'members' && (
          metrics?.recentActivity.members.length ? (
            metrics.recentActivity.members.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {[m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')}
                  </div>
                  <div className="text-slate-500 truncate font-mono text-[11px]">{m.email}</div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={m.status === 'Active' ? 'success' : 'default'}>{m.status}</Badge>
                  <div className="text-[10px] text-slate-500 mt-1">{formatDateTime(m.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No member records recorded yet.</div>
          )
        )}

        {activeActivityTab === 'events' && (
          metrics?.recentActivity.events.length ? (
            metrics.recentActivity.events.map((e) => (
              <div
                key={e.id}
                className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{e.name}</div>
                  <div className="text-slate-500 truncate text-[11px]">{e.venue}</div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={e.fee > 0 ? 'warning' : 'success'}>
                    {e.fee > 0 ? `₱${e.fee}` : 'Free'}
                  </Badge>
                  <div className="text-[10px] text-slate-500 mt-1">{formatDateTime(e.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No event records scheduled yet.</div>
          )
        )}

        {activeActivityTab === 'reports' && (
          metrics?.recentActivity.reports.length ? (
            metrics.recentActivity.reports.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{r.report_type}</div>
                  <div className="text-slate-500 truncate text-[11px]">
                    {r.chapter_id ? 'Chapter Assembly Report' : 'Area Community Report'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="info">{r.status || 'Filed'}</Badge>
                  <div className="text-[10px] text-slate-500 mt-1">{formatDateTime(r.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No activity report records filed yet.</div>
          )
        )}
      </div>
    </div>
  );
};
