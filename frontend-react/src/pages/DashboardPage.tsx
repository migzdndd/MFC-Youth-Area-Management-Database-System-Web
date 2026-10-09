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
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { Area } from '@/types/auth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeArea, setActiveArea } = useAuthStore();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: areas } = useAreas();
  const { data: readingsData } = useDailyReadings();

  const isNationalCoordinator = user?.role === 'national_coordinator';
  const effectiveAreaName = activeArea?.name || user?.area_name || 'Assigned Area';

  const statCards = [
    {
      title: 'Total Members',
      count: metrics?.totalMembers ?? 0,
      icon: Users,
      link: '/members',
      subtitle: 'Registered youth profiles',
    },
    {
      title: 'Active Chapters',
      count: metrics?.totalChapters ?? 0,
      icon: Building2,
      link: '/chapters',
      subtitle: 'Area subdivisions',
    },
    {
      title: 'Upcoming Events',
      count: metrics?.upcomingEvents ?? 0,
      icon: Calendar,
      link: '/events',
      subtitle: 'Assemblies & camps',
    },
    {
      title: 'Activity Reports',
      count: metrics?.totalReports ?? 0,
      icon: FileText,
      link: '/reports',
      subtitle: 'Pastoral logs filed',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner and Area Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <span className="text-xs font-bold text-amber-700 tracking-wider font-heading">
            COMMAND OVERVIEW
          </span>
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight mt-0.5">
            Welcome, {user?.first_name || 'Servant Leader'}
          </h1>
          <p className="text-sm text-slate-600">
            Managing community pastoral operations for{' '}
            <strong className="text-navy font-semibold">{effectiveAreaName}</strong>.
          </p>
        </div>

        {/* National Coordinator Area Selector */}
        {isNationalCoordinator && areas && areas.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            <MapPin className="w-4 h-4 text-navy shrink-0" />
            <label htmlFor="areaSelect" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Switch Area:
            </label>
            <select
              id="areaSelect"
              value={activeArea?.id || user?.area_id || ''}
              onChange={(e) => {
                const selected = areas.find((a: Area) => a.id === e.target.value);
                setActiveArea(selected || null);
              }}
              className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-navy"
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="p-5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600">{card.title}</span>
                <div className="p-2 rounded-md bg-slate-100 text-navy group-hover:bg-navy group-hover:text-amber-300 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
                  {metricsLoading ? <Spinner size="sm" /> : card.count}
                </div>
                <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Servant Actions */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 font-heading mb-4">
          Quick Servant Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-2 justify-start px-4 text-slate-800 hover:border-slate-300"
            onClick={() => navigate('/members')}
          >
            <UserPlus className="w-4 h-4 text-navy shrink-0" />
            <span>Register New Member</span>
          </Button>

          <Button
            variant="secondary"
            className="flex items-center gap-2 justify-start px-4 text-slate-800 hover:border-slate-300"
            onClick={() => navigate('/events')}
          >
            <CalendarPlus className="w-4 h-4 text-navy shrink-0" />
            <span>Schedule Community Event</span>
          </Button>

          <Button
            variant="secondary"
            className="flex items-center gap-2 justify-start px-4 text-slate-800 hover:border-slate-300"
            onClick={() => navigate('/reports')}
          >
            <FilePlus className="w-4 h-4 text-navy shrink-0" />
            <span>File Activity Report</span>
          </Button>
        </div>
      </div>

      {/* Liturgical Readings Snippet */}
      {readingsData && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 shrink-0">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800">Daily Catholic Readings</span>
                <span className="text-xs text-slate-500">&middot; {readingsData.date}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                {readingsData.celebration || 'Liturgical Readings for Today'}
              </h3>
            </div>
          </div>

          <Link
            to="/readings"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-navy-light hover:underline shrink-0"
          >
            <span>Read Scriptures</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
