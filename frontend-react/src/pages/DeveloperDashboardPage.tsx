import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useDeveloperMetrics, useInspectTable, useDevPing } from '@/hooks/useDeveloper';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Download } from 'lucide-react';
import {
  SystemTelemetryGrid,
  SystemRecordsOverview,
  RecentActivityFeed,
  SystemManagementTools,
  TableInspectModal,
} from '@/components/developer';

export const DeveloperDashboardPage: React.FC = () => {
  const { user, activeArea } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, isFetching, refetch } = useDeveloperMetrics();
  const inspectTable = useInspectTable();
  const pingMutation = useDevPing();

  const [testedLatency, setTestedLatency] = useState<number | null>(null);
  const [inspectedTable, setInspectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-navy-deep via-navy to-slate-900 text-white rounded-2xl p-6 shadow-md border border-navy-light/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            {user?.email && (
              <span className="text-xs text-slate-300 font-mono block">
                {user.email}
              </span>
            )}
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
      <SystemTelemetryGrid
        metrics={metrics}
        testedLatency={testedLatency}
        isPingPending={pingMutation.isPending}
        onPing={handlePing}
      />

      {/* System Records Overview */}
      <SystemRecordsOverview
        metrics={metrics}
        isLoading={isLoading}
        onInspect={handleInspect}
      />

      {/* Dual Section: Recent Activity & Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RecentActivityFeed metrics={metrics} />
        </div>
        <div className="lg:col-span-5">
          <SystemManagementTools
            onPing={handlePing}
            isPingPending={pingMutation.isPending}
            onClearCache={handleClearCache}
          />
        </div>
      </div>

      {/* Table Rows Inspection Modal */}
      <TableInspectModal
        isOpen={isInspectModalOpen}
        onClose={() => {
          setIsInspectModalOpen(false);
          setInspectedTable(null);
          setTableData([]);
        }}
        tableName={inspectedTable}
        tableData={tableData}
        isLoading={inspectTable.isPending}
      />
    </div>
  );
};
