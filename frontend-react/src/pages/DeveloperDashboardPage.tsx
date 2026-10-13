import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useDeveloperMetrics, useInspectTable, useDevPing } from '@/hooks/useDeveloper';
import { useAreas } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  Download,
  Trash2,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Building2,
  Calendar,
  FileText,
  Briefcase,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

import type { UserRole } from '@/types/auth';

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) return `${hours}h ${remMinutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h ${remMinutes}m`;
}

export const DeveloperDashboardPage: React.FC = () => {
  const { user, activeArea, setActiveArea, setSimulatedRole } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, isFetching, refetch } = useDeveloperMetrics();
  const { data: areas = [] } = useAreas();
  const inspectTable = useInspectTable();
  const pingMutation = useDevPing();

  const [testedLatency, setTestedLatency] = useState<number | null>(null);
  const [inspectedTable, setInspectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'members' | 'events' | 'reports'>('members');

  // Strict Supabase developer authorization
  const isAuthorized = Boolean(user?.is_developer);
  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInspect = async (tableName: string) => {
    setInspectedTable(tableName);
    setIsInspectModalOpen(true);
    try {
      const res = await inspectTable.mutateAsync(tableName);
      setTableData(res.rows || []);
    } catch {
      toast.error('Unable to load records for this category.', 'Connection Issue');
      setTableData([]);
    }
  };

  const handlePing = async () => {
    try {
      const res = await pingMutation.mutateAsync();
      setTestedLatency(res.latencyMs);
      toast.success(`Server response time: ${res.latencyMs}ms`, 'Connection Speed');
    } catch {
      toast.error('Could not reach the server.', 'Connection Failed');
    }
  };

  const handleClearCache = () => {
    queryClient.clear();
    toast.success('Temporary app data cleared successfully.', 'Cache Cleared');
    refetch();
  };

  const handleExportDiagnostics = () => {
    if (!metrics) return;
    const diagnosticData = {
      exportedAt: new Date().toISOString(),
      developerAccount: user?.email,
      activeArea: activeArea?.name || user?.area_name,
      metrics,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(diagnosticData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `mfc-system-diagnostic-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('System diagnostic snapshot exported to JSON.', 'Export Ready');
  };

  const FRIENDLY_TABLE_INFO: Record<string, { label: string; previewTitle: string; previewDesc: string }> = {
    members: {
      label: 'Members Directory',
      previewTitle: 'Members Directory Preview',
      previewDesc: 'Showing recent youth member records saved in the community.',
    },
    chapters: {
      label: 'Registered Chapters',
      previewTitle: 'Registered Chapters Preview',
      previewDesc: 'Showing recent youth chapters registered across areas.',
    },
    areas: {
      label: 'Area Communities',
      previewTitle: 'Area Communities Preview',
      previewDesc: 'Showing registered Area community divisions.',
    },
    events: {
      label: 'Community Events',
      previewTitle: 'Community Events Preview',
      previewDesc: 'Showing recent youth events, camps, and gatherings.',
    },
    event_participants: {
      label: 'Event Attendance',
      previewTitle: 'Event Attendance Preview',
      previewDesc: 'Showing recent attendee registrations and confirmations.',
    },
    activity_reports: {
      label: 'Activity Reports',
      previewTitle: 'Activity Reports Preview',
      previewDesc: 'Showing recent pastoral activity reports filed by servant leaders.',
    },
    services: {
      label: 'Universal Services',
      previewTitle: 'Universal Services Preview',
      previewDesc: 'Showing available pastoral service categories in the system.',
    },
    profiles: {
      label: 'Servant Accounts',
      previewTitle: 'Servant Accounts Preview',
      previewDesc: 'Showing registered servant leader account profiles.',
    },
  };

  const formatColumnHeader = (col: string): string => {
    const customNames: Record<string, string> = {
      id: 'Record ID',
      created_at: 'Date Created',
      updated_at: 'Last Updated',
      area_id: 'Area ID',
      chapter_id: 'Chapter ID',
      member_id: 'Member ID',
      created_by: 'Created By',
      starts_at: 'Start Time',
      ends_at: 'End Time',
      first_name: 'First Name',
      last_name: 'Last Name',
      middle_name: 'Middle Name',
      must_change_password: 'Password Reset',
      is_active: 'Active Account',
      is_developer: 'Developer Access',
      report_type: 'Report Category',
      manual_attendance: 'Attendance',
      payment_status: 'Payment Status',
      venue: 'Location / Venue',
      fee: 'Fee',
      status: 'Status',
      role: 'Assigned Role',
      email: 'Email Address',
      name: 'Name',
      description: 'Description',
    };
    if (customNames[col]) return customNames[col];
    return col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return 'None';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val);
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
      return formatDateTime(str);
    }
    return str;
  };

  const tableCards = [
    { key: 'members', label: 'Members Directory', count: metrics?.counts.members ?? 0, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { key: 'chapters', label: 'Registered Chapters', count: metrics?.counts.chapters ?? 0, icon: Building2, color: 'text-amber-600 bg-amber-50' },
    { key: 'areas', label: 'Area Communities', count: metrics?.counts.areas ?? 0, icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'events', label: 'Community Events', count: metrics?.counts.events ?? 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
    { key: 'event_participants', label: 'Event Attendance', count: metrics?.counts.participants ?? 0, icon: UserCheck, color: 'text-violet-600 bg-violet-50' },
    { key: 'activity_reports', label: 'Activity Reports', count: metrics?.counts.reports ?? 0, icon: FileText, color: 'text-rose-600 bg-rose-50' },
    { key: 'services', label: 'Universal Services', count: metrics?.counts.services ?? 0, icon: Briefcase, color: 'text-teal-600 bg-teal-50' },
    { key: 'profiles', label: 'Servant Accounts', count: metrics?.counts.profiles ?? 0, icon: Layers, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-navy-deep via-navy to-slate-900 text-white rounded-2xl p-6 shadow-md border border-navy-light/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </span>
              <Badge variant="gold">Developer Access</Badge>
              {user?.email && (
                <span className="text-xs text-slate-300 font-mono">
                  {user.email}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Developer & Operations Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              System records overview, server health, memory status, and administrative testing tools for MFC Youth Area Management.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 flex items-center gap-2 min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh Stats'}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportDiagnostics}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold border-none flex items-center gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Export Summary</span>
            </Button>
          </div>
        </div>
      </div>

      {/* System Vitals & Performance Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database Latency */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Connection</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {testedLatency !== null
                ? `${testedLatency}ms`
                : metrics?.system.dbLatencyMs !== undefined
                ? `${metrics.system.dbLatencyMs}ms`
                : 'Checking...'}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected & Active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Response speed</span>
            <button
              type="button"
              disabled={pingMutation.isPending}
              onClick={handlePing}
              className="font-bold text-navy hover:underline cursor-pointer disabled:opacity-50"
            >
              {pingMutation.isPending ? 'Testing...' : 'Test Speed'}
            </button>
          </div>
        </div>

        {/* Runtime & Uptime */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Process Uptime</span>
            <div className="p-2 bg-sky-50 text-sky-800 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics?.system.uptimeSeconds ? formatUptime(metrics.system.uptimeSeconds) : 'Calculating...'}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Runtime Engine</span>
            <span className="font-mono font-medium text-slate-800">{metrics?.system.nodeVersion || 'v20.x'}</span>
          </div>
        </div>

        {/* Memory Allocation */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Memory Usage</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {metrics?.system.memory.heapUsedMb ? `${metrics.system.memory.heapUsedMb} MB` : 'N/A'}
            </span>
            <span className="text-xs text-slate-500">
              / {metrics?.system.memory.heapTotalMb ? `${metrics.system.memory.heapTotalMb} MB` : 'N/A'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Total Memory</span>
            <span className="font-mono font-medium text-slate-800">{metrics?.system.memory.rssMb ? `${metrics.system.memory.rssMb} MB` : 'N/A'}</span>
          </div>
        </div>

        {/* Architecture & Environment */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Host Platform</span>
            <div className="p-2 bg-violet-50 text-violet-700 rounded-lg">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 uppercase">
            {metrics?.system.platform ? `${metrics.system.platform} (${metrics.system.arch})` : 'Windows'}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Environment</span>
            <Badge variant="navy">{metrics?.system.env || 'production'}</Badge>
          </div>
        </div>
      </div>

      {/* System Records Overview */}
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
                onClick={() => handleInspect(card.key)}
                className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 hover:border-navy/40 rounded-xl transition-all duration-150 text-left cursor-pointer group flex flex-col justify-between min-h-[100px]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
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

      {/* Dual Section: Recent Activity & Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Feed (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
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
                  <div key={m.id} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {m.first_name} {m.last_name}
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
                  <div key={e.id} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{e.name}</div>
                      <div className="text-slate-500 truncate text-[11px]">{e.venue}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={e.fee > 0 ? 'warning' : 'success'}>{e.fee > 0 ? `₱${e.fee}` : 'Free'}</Badge>
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
                  <div key={r.id} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{r.report_type}</div>
                      <div className="text-slate-500 truncate text-[11px]">ID: {r.id.slice(0, 8)}...</div>
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

        {/* System Management Tools (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              System Management Tools
            </h2>
            <p className="text-xs text-slate-500">
              Administrative actions, speed tests, and diagnostic utilities.
            </p>
          </div>

          <div className="space-y-3">
            {/* Ping Test */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">Connection Speed Test</div>
                <div className="text-[11px] text-slate-500">Measure server response time</div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePing}
                isLoading={pingMutation.isPending}
                className="shrink-0 min-h-[36px]"
              >
                Run Test
              </Button>
            </div>

            {/* Clear Query Cache */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">Clear Saved App Cache</div>
                <div className="text-[11px] text-slate-500">Reset locally saved temporary data</div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearCache}
                className="shrink-0 min-h-[36px] text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear Cache
              </Button>
            </div>

            {/* Toast System Diagnostic */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
              <div>
                <div className="text-xs font-bold text-slate-900">Notification Preview Test</div>
                <div className="text-[11px] text-slate-500">Test in-app alert and notice banners</div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.success('Operation completed successfully.', 'Success Alert')}
                  className="text-emerald-700 text-xs min-h-[36px]"
                >
                  Success
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.showToast({ type: 'warning', title: 'Warning Alert', message: 'Session check requires attention.' })}
                  className="text-amber-700 text-xs min-h-[36px]"
                >
                  Warning
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.error('Sample synthetic error occurred.', 'Error Alert')}
                  className="text-rose-700 text-xs min-h-[36px]"
                >
                  Error
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.showToast({ type: 'info', title: 'Notice Alert', message: 'New system event captured.' })}
                  className="text-sky-700 text-xs min-h-[36px]"
                >
                  Info
                </Button>
              </div>
            </div>

            {/* Area Context Simulation */}
            {areas.length > 0 && (
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">Simulate Area View</div>
                  <span className="text-[10px] text-slate-500">Switch view</span>
                </div>
                <select
                  value={activeArea?.id || user?.area_id || ''}
                  onChange={(e) => {
                    const found = areas.find((a) => a.id === e.target.value);
                    if (found) {
                      setActiveArea(found);
                      queryClient.clear();
                      toast.success(`Active area set to ${found.name}`, 'View Updated');
                    }
                  }}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 min-h-[38px]"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.id === user?.area_id ? '(Home Area)' : ''}
                    </option>
                  ))}
                </select>

                {/* Role Simulation within simulated area */}
                {activeArea && user?.area_id && activeArea.id !== user.area_id && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700">Role in Simulated Area</span>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Isolated (No Leaks)
                      </span>
                    </div>
                    <select
                      value={user?.role || 'member'}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setSimulatedRole(newRole);
                        toast.showToast({
                          type: 'info',
                          title: `Simulated role set to ${newRole.replace(/_/g, ' ')}`,
                          message: 'Role Simulation Scope Updated'
                        });
                      }}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 min-h-[38px]"
                    >
                      <option value="member">Member (Default non-servant)</option>
                      <option value="chapter_servant">Chapter Servant</option>
                      <option value="area_servant">Area Servant</option>
                      <option value="youth_head">Youth Head</option>
                      <option value="national_coordinator">National Coordinator</option>
                    </select>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Your authentic role ({user?.home_role ? user.home_role.replace(/_/g, ' ') : 'Lit Servant'}) is protected and does not stick to other Area Databases.
                    </p>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs mt-1"
                      onClick={() => {
                        const home = areas.find((a) => a.id === user?.area_id);
                        setActiveArea(home || null);
                        queryClient.clear();
                        toast.success('Restored to your home Area Database and authentic role', 'Simulation Reset');
                      }}
                    >
                      Reset to Home Area
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Rows Inspection Modal */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => {
          setIsInspectModalOpen(false);
          setInspectedTable(null);
          setTableData([]);
        }}
        title={FRIENDLY_TABLE_INFO[inspectedTable || '']?.previewTitle || 'Record Preview'}
        description={FRIENDLY_TABLE_INFO[inspectedTable || '']?.previewDesc || 'Showing recent entries sorted by newest first.'}
        maxWidth="xl"
      >
        <div className="space-y-4">
          {inspectTable.isPending ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Spinner size="lg" />
              <span className="text-xs text-slate-500">Loading records...</span>
            </div>
          ) : tableData.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No records found in this category.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    {Object.keys(tableData[0]).map((col) => (
                      <th key={col} className="p-2.5 px-3 border-r border-slate-200/80 whitespace-nowrap">
                        {formatColumnHeader(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      {Object.keys(tableData[0]).map((col) => {
                        const val = row[col];
                        const renderedVal = formatCellValue(val);

                        return (
                          <td
                            key={col}
                            className="p-2.5 px-3 border-r border-slate-100 max-w-[200px] truncate text-slate-800"
                            title={renderedVal}
                          >
                            {renderedVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Showing top {tableData.length} newest entries (View only)
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsInspectModalOpen(false)}
              className="min-h-[36px]"
            >
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
