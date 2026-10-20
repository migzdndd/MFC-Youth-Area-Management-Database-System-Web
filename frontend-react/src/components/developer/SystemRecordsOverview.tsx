import React from 'react';
import {
  Users,
  Building2,
  MapPin,
  Calendar,
  UserCheck,
  FileText,
  Briefcase,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import type { DeveloperMetrics } from '@/hooks/useDeveloper';

export interface SystemRecordsOverviewProps {
  metrics: DeveloperMetrics | undefined;
  isLoading: boolean;
  onInspect: (tableKey: string) => void;
}

export const SystemRecordsOverview: React.FC<SystemRecordsOverviewProps> = ({
  metrics,
  isLoading,
  onInspect,
}) => {
  const tableCards = [
    { key: 'members', label: 'Members Directory', count: metrics?.counts.members ?? 0, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { key: 'chapters', label: 'Registered Chapters', count: metrics?.counts.chapters ?? 0, icon: Building2, color: 'text-amber-600 bg-amber-50' },
    { key: 'areas', label: 'Area Communities', count: metrics?.counts.areas ?? 0, icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'events', label: 'Community Events', count: metrics?.counts.events ?? 0, icon: Calendar, color: 'text-sky-700 bg-sky-50' },
    { key: 'event_participants', label: 'Event Attendance', count: metrics?.counts.participants ?? 0, icon: UserCheck, color: 'text-amber-700 bg-amber-50' },
    { key: 'activity_reports', label: 'Activity Reports', count: metrics?.counts.reports ?? 0, icon: FileText, color: 'text-rose-600 bg-rose-50' },
    { key: 'services', label: 'Universal Services', count: metrics?.counts.services ?? 0, icon: Briefcase, color: 'text-teal-600 bg-teal-50' },
    { key: 'profiles', label: 'Servant Accounts', count: metrics?.counts.profiles ?? 0, icon: Layers, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            System Records Overview
          </h2>
          <p className="text-xs text-slate-500">
            Live count of records saved across the community system. Click any category to view recent entries.
          </p>
        </div>
        {isLoading && <Spinner size="sm" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {tableCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onInspect(card.key)}
              className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 hover:border-navy/40 rounded-xl transition-[background-color,border-color] duration-150 text-left cursor-pointer group flex flex-col justify-between min-h-[100px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                  {card.count}
                </div>
                <div className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                  {card.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
