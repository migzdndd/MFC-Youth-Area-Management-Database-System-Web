import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Terminal, RotateCcw, ShieldAlert } from 'lucide-react';
import { ROLE_LABELS } from '@/types/auth';

export const SimulationBanner: React.FC = () => {
  const { user, simulatedRole, activeArea, setSimulatedRole } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  if (!simulatedRole || !user) return null;

  const simulatedLabel = ROLE_LABELS[simulatedRole] || simulatedRole;
  const originalLabel = user.home_role ? ROLE_LABELS[user.home_role] || user.home_role : 'Servant';

  const handleExitSimulation = () => {
    setSimulatedRole(null);
    queryClient.clear();
    toast.success(
      `Validated: Your original role (${originalLabel}) is now active.`,
      'Simulation Exited'
    );
  };

  return (
    <aside
      aria-label="Live simulation notification"
      className="bg-amber-800 text-white text-xs px-4 py-2 shadow-2xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 border-b border-amber-900"
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0" />
        <span className="font-bold">
          Live Role Simulation:
        </span>
        <span className="bg-amber-950/70 px-2 py-0.5 rounded text-xs font-bold text-amber-100 border border-amber-500/40">
          {simulatedLabel}
        </span>
        <span className="hidden sm:inline text-amber-100/90">
          in {activeArea?.name || 'Area Community'} &bull; Authentic Role: <span className="underline decoration-amber-300 font-semibold">{originalLabel}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/dev')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-900/40 hover:bg-amber-900/70 text-amber-100 rounded-md transition-colors cursor-pointer text-[11px] font-semibold border border-amber-400/30"
          title="Open Developer Console"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Dev Console</span>
        </button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleExitSimulation}
          className="bg-white text-amber-900 hover:bg-amber-50 border-white text-[11px] h-7 px-2.5 font-bold cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          <span>Exit Simulation</span>
        </Button>
      </div>
    </aside>
  );
};
