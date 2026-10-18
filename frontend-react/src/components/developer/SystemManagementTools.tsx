import React from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAreas } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Trash2, ShieldCheck, RotateCcw } from 'lucide-react';
import { ROLE_LABELS, type UserRole } from '@/types/auth';

export interface SystemManagementToolsProps {
  onPing: () => void;
  isPingPending: boolean;
  onClearCache: () => void;
}

export const SystemManagementTools: React.FC<SystemManagementToolsProps> = ({
  onPing,
  isPingPending,
  onClearCache,
}) => {
  const {
    user,
    activeArea,
    simulatedRole,
    setSimulatedRole,
    requestAreaSwitch,
    roleRestorationValidated,
  } = useAuthStore();
  const { data: areas = [] } = useAreas();
  const toast = useToast();
  const queryClient = useQueryClient();

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
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
            onClick={onPing}
            isLoading={isPingPending}
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
            onClick={onClearCache}
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
              onClick={() =>
                toast.showToast({
                  type: 'warning',
                  title: 'Warning Alert',
                  message: 'Session check requires attention.',
                })
              }
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
              onClick={() =>
                toast.showToast({
                  type: 'info',
                  title: 'Notice Alert',
                  message: 'New system event captured.',
                })
              }
              className="text-sky-700 text-xs min-h-[36px]"
            >
              Info
            </Button>
          </div>
        </div>

        {/* Live Role Access & Area Database Simulator */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Live Role Simulator</div>
              <div className="text-[10px] text-slate-500">Test access levels system-wide</div>
            </div>
            {simulatedRole ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Simulating
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Authentic
              </span>
            )}
          </div>

          {/* Status Indicator */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-600">
              <span>Authentic Role:</span>
              <span className="font-semibold text-slate-800">
                {user?.home_role ? ROLE_LABELS[user.home_role] || user.home_role : 'Servant'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Effective Active Role:</span>
              <span className={`font-bold ${simulatedRole ? 'text-amber-700' : 'text-emerald-700'}`}>
                {user?.role ? ROLE_LABELS[user.role] || user.role : 'Member'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Current Area DB:</span>
              <span className="font-semibold text-slate-800">
                {activeArea?.name || 'Home Database'}
              </span>
            </div>
          </div>

          {roleRestorationValidated && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Authentic role verified and restored.</span>
            </div>
          )}

          {/* Role Selector */}
          <div className="space-y-1.5">
            <label htmlFor="devSimulateRole" className="text-[11px] font-semibold text-slate-700 block">
              Simulate Live Role Access
            </label>
            <select
              id="devSimulateRole"
              value={simulatedRole || user?.role || 'member'}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                if (newRole === user?.home_role) {
                  setSimulatedRole(null);
                  toast.success(
                    `Restored to authentic role: ${ROLE_LABELS[newRole]}`,
                    'Authentic Role Restored'
                  );
                } else {
                  setSimulatedRole(newRole);
                  toast.showToast({
                    type: 'info',
                    title: `Simulating ${ROLE_LABELS[newRole]}`,
                    message: 'Role permissions applied across the system.',
                  });
                }
              }}
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 min-h-[38px] font-medium text-slate-800"
            >
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label} {user?.home_role === key ? '(Your Authentic Role)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reset to Authentic Role Button */}
          {simulatedRole && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs flex items-center justify-center gap-1.5 min-h-[36px] text-slate-700 hover:text-slate-900 border-slate-300"
              onClick={() => {
                setSimulatedRole(null);
                queryClient.clear();
                toast.success(
                  `Validated: Authentic role "${user?.home_role ? ROLE_LABELS[user.home_role] || user.home_role : 'Servant'}" restored.`,
                  'Role Restored'
                );
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset to Authentic Role
            </Button>
          )}

          {/* Area Database Switcher */}
          {areas.length > 0 && (
            <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="devAreaSwitch" className="text-[11px] font-semibold text-slate-700 cursor-pointer">
                  Area Database
                </label>
                <span className="text-[10px] text-slate-500">Live isolation</span>
              </div>
              <select
                id="devAreaSwitch"
                aria-label="Select active area database"
                value={activeArea?.id || user?.area_id || ''}
                onChange={(e) => {
                  const found = areas.find((a) => a.id === e.target.value);
                  if (found) {
                    const direct = requestAreaSwitch(found);
                    if (direct) {
                      queryClient.clear();
                      toast.success(`Active area set to ${found.name}`, 'View Updated');
                    }
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
              <p className="text-[10px] text-slate-500 leading-normal">
                Switching area databases while simulation is active prompts for confirmation and automatically restores and validates your authentic role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
