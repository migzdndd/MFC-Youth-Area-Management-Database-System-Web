import React from 'react';
import { Database, Clock, Cpu, Server, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { DeveloperMetrics } from '@/hooks/useDeveloper';

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

export interface SystemTelemetryGridProps {
  metrics: DeveloperMetrics | undefined;
  testedLatency: number | null;
  isPingPending: boolean;
  onPing: () => void;
}

export const SystemTelemetryGrid: React.FC<SystemTelemetryGridProps> = ({
  metrics,
  testedLatency,
  isPingPending,
  onPing,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Database Latency */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">System Connection</span>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
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
            disabled={isPingPending}
            onClick={onPing}
            className="font-bold text-navy hover:underline cursor-pointer disabled:opacity-50"
          >
            {isPingPending ? 'Testing...' : 'Test Speed'}
          </button>
        </div>
      </div>

      {/* Runtime & Uptime */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">Process Uptime</span>
          <div className="p-2 bg-sky-50 text-sky-800 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
          {metrics?.system.uptimeSeconds ? formatUptime(metrics.system.uptimeSeconds) : 'Calculating...'}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Runtime Engine</span>
          <span className="font-mono text-xs font-medium text-slate-800">{metrics?.system.nodeVersion || 'v20.x'}</span>
        </div>
      </div>

      {/* Memory Allocation */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">Memory Usage</span>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {metrics?.system.memory.heapUsedMb ? `${metrics.system.memory.heapUsedMb} MB` : 'N/A'}
          </span>
          <span className="text-xs text-slate-500 tabular-nums">
            / {metrics?.system.memory.heapTotalMb ? `${metrics.system.memory.heapTotalMb} MB` : 'N/A'}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Total Memory</span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {metrics?.system.memory.rssMb ? `${metrics.system.memory.rssMb} MB` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Architecture & Environment */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600">Host Platform</span>
          <div className="p-2 bg-sky-50 text-sky-800 rounded-lg">
            <Server className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900">
          {metrics?.system.platform ? `${metrics.system.platform} (${metrics.system.arch})` : 'Windows'}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Environment</span>
          <Badge variant="navy">{metrics?.system.env || 'production'}</Badge>
        </div>
      </div>
    </div>
  );
};
