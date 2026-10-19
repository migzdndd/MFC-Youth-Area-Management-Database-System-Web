import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useDashboardMetrics, useAreas } from '@/hooks/useDashboard';
import { useDailyReadings } from '@/hooks/useReadings';
import {
  Users,
  Building2,
  Calendar,
  FileText,
  UserPlus,
  CalendarPlus,
  FilePlus,
  BookOpen,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Area } from '@/types/auth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeArea, requestAreaSwitch } = useAuthStore();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: areas } = useAreas();
  const { data: readingsData } = useDailyReadings();

  const isNationalCoordinator = user?.role === 'national_coordinator';
  const matchedArea = areas?.find((a: Area) => a.id === (activeArea?.id || user?.area_id));
  const effectiveAreaName = activeArea?.name || user?.area_name || matchedArea?.name || (areas && areas.length > 0 ? areas[0].name : 'MFC Youth Area Database');

  const memberSubtitle = (() => {
    switch (user?.role) {
      case 'campus_servant':
        return 'College & SHS roster';
      case 'mfc_high_servant':
        return 'High School (JHS 7-10) roster';
      case 'area_kids_servant':
        return 'Kids Ministry roster';
      case 'lit_servant':
        return 'Creative Ministries roster';
      case 'chapter_servant':
        return 'Chapter roster';
      default:
        return 'Area-wide youth roster';
    }
  })();

  return (
    <div className="space-y-6">
      {/* Top Banner and Area Switcher */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading tracking-tight">
            Welcome, {user?.first_name || 'Servant Leader'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Managing community pastoral operations for{' '}
            <span className="text-navy font-semibold">{effectiveAreaName}</span>.
          </p>
        </div>

        {/* Global Admin (National Coordinator / Developer) Area Selector */}
        {(isNationalCoordinator || user?.is_developer) && areas && areas.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <MapPin className="w-4 h-4 text-navy shrink-0" />
            <label htmlFor="areaSelect" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Switch Area:
            </label>
            <select
              id="areaSelect"
              value={activeArea?.id || user?.area_id || ''}
              onChange={(e) => {
                const selected = areas.find((a: Area) => a.id === e.target.value);
                requestAreaSwitch(selected || null);
              }}
              className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-navy/20 cursor-pointer shadow-2xs"
            >
              {areas.map((a: Area) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Primary & Secondary Metrics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Primary Card - Total Members */}
        <Link
          to="/members"
          className="lg:col-span-6 p-6 sm:p-7 bg-white dark:bg-[#0e1e36] border-2 border-navy/20 dark:border-sky-500/30 hover:border-navy/50 dark:hover:border-sky-400/60 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-navy dark:text-sky-400 uppercase tracking-wider">
                Primary Focus &middot; Total Members
              </span>
              <div className="p-3 rounded-xl bg-navy dark:bg-sky-500/20 text-white dark:text-sky-400 border border-transparent dark:border-sky-500/30 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight mb-2">
              {metricsLoading ? <Skeleton className="h-11 w-24 rounded-lg inline-block" /> : (metrics?.totalMembers ?? 0)}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {memberSubtitle}
            </p>
          </div>

          <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-navy dark:text-sky-400 group-hover:underline">
              View Community Directory
            </span>
            <ArrowRight className="w-4 h-4 text-navy dark:text-sky-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Secondary Cards Column */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active Chapters */}
          <Link
            to="/chapters"
            className="p-5 bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-sky-500/40 transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Active Chapters
              </span>
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-500/30 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-16 rounded-md inline-block" /> : (metrics?.totalChapters ?? 0)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">View all registered Chapters</p>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>

          {/* Activity Reports */}
          <Link
            to="/reports"
            className="p-5 bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-sky-500/40 transition-all duration-200 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Activity Reports
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-500/30 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-16 rounded-md inline-block" /> : (metrics?.totalReports ?? 0)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Pastoral logs filed</p>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Section: Upcoming Events Card + Quick Servant Actions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Events Card */}
        <Link
          to="/events"
          className="lg:col-span-5 bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-sky-500/40 transition-all duration-200 group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-transparent dark:border-sky-500/30 group-hover:scale-105 transition-transform shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Upcoming Events
                </h2>
              </div>
              <span className="text-2xl font-bold text-sky-800 dark:text-sky-400 font-heading">
                {metricsLoading ? <Skeleton className="h-8 w-14 rounded-md inline-block" /> : (metrics?.upcomingEvents ?? 0)}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Track area assemblies, youth camps, conferences, and member attendance check-ins.
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-400 group-hover:underline">
              Open Events Calendar & Attendance
            </span>
            <ArrowRight className="w-4 h-4 text-sky-800 dark:text-sky-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Quick Servant Actions Card */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Quick Servant Actions
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">One-tap operational shortcuts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100/90 dark:hover:bg-slate-900 active:scale-[0.98] border border-slate-200/90 dark:border-slate-800 rounded-xl transition-all duration-150 text-left group cursor-pointer shadow-2xs hover:shadow-xs min-h-[56px]"
            >
              <div className="p-2.5 rounded-lg bg-navy dark:bg-sky-500/20 text-white dark:text-sky-400 border border-transparent dark:border-sky-500/30 shadow-2xs group-hover:scale-105 transition-transform duration-150">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-navy dark:group-hover:text-sky-300 transition-colors">
                  Register Member
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Add to Area roster</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/events')}
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100/90 dark:hover:bg-slate-900 active:scale-[0.98] border border-slate-200/90 dark:border-slate-800 rounded-xl transition-all duration-150 text-left group cursor-pointer shadow-2xs hover:shadow-xs min-h-[56px]"
            >
              <div className="p-2.5 rounded-lg bg-amber-600 dark:bg-amber-500/20 text-white dark:text-amber-300 border border-transparent dark:border-amber-500/30 shadow-2xs group-hover:scale-105 transition-transform duration-150">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                  Schedule Event
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Schedule an Area-Wide Event</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100/90 dark:hover:bg-slate-900 active:scale-[0.98] border border-slate-200/90 dark:border-slate-800 rounded-xl transition-all duration-150 text-left group cursor-pointer shadow-2xs hover:shadow-xs min-h-[56px]"
            >
              <div className="p-2.5 rounded-lg bg-emerald-700 dark:bg-emerald-500/20 text-white dark:text-emerald-300 border border-transparent dark:border-emerald-500/30 shadow-2xs group-hover:scale-105 transition-transform duration-150">
                <FilePlus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                  File Report
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Log gathering</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Liturgical Readings Snippet */}
      {readingsData && (
        <div className="bg-gradient-to-r from-amber-50/60 to-white dark:from-amber-950/30 dark:to-[#0e1e36] border border-amber-200/80 dark:border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/30 shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5 text-amber-800 dark:text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">Daily Liturgical Readings</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">&middot; {readingsData.date}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {readingsData.celebration || 'Liturgical Readings for Today'}
              </h3>
            </div>
          </div>

          <Link
            to="/readings"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-navy dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-bold rounded-lg hover:bg-navy-light dark:hover:bg-sky-400 active:scale-[0.98] transition-all duration-150 shadow-2xs hover:shadow-xs shrink-0 select-none min-h-[40px]"
          >
            <span>Read Scriptures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

