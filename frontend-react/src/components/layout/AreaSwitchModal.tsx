import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ROLE_LABELS, type UserRole } from '@/types/auth';

export const AreaSwitchModal: React.FC = () => {
  const {
    user,
    simulatedRole,
    pendingAreaSwitch,
    confirmPendingAreaSwitch,
    cancelPendingAreaSwitch,
  } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  if (!pendingAreaSwitch) return null;

  const currentRoleLabel = simulatedRole
    ? ROLE_LABELS[simulatedRole]
    : user?.role
      ? ROLE_LABELS[user.role]
      : 'Servant';

  const originalRole: UserRole = user?.home_role || 'area_servant';
  const originalRoleLabel = ROLE_LABELS[originalRole] || originalRole;

  const handleProceed = () => {
    const result = confirmPendingAreaSwitch();
    if (result?.success) {
      queryClient.clear();
      toast.success(
        `Validated: Original role "${ROLE_LABELS[result.restoredRole]}" has been verified and restored in ${result.areaName}.`,
        'Authentic Role Restored'
      );
    } else {
      toast.error('Unable to restore original role.', 'Switch Error');
    }
  };

  return (
    <Modal
      isOpen={Boolean(pendingAreaSwitch)}
      onClose={cancelPendingAreaSwitch}
      title="Switch Area Database: Restore Original Role"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Warning Callout */}
        <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-900 leading-relaxed">
            <p className="font-bold text-amber-950">
              Role Simulation Active: {currentRoleLabel}
            </p>
            <p>
              Switching to the <strong className="text-amber-950">{pendingAreaSwitch.name}</strong> database
              will immediately exit live role simulation and return you to your authentic role.
            </p>
          </div>
        </div>

        {/* Transition Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Current Simulated Role
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{currentRoleLabel}</span>
            </div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Target Authentic Role
            </span>
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{originalRoleLabel}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          When you click <strong className="text-slate-800">Proceed &amp; Restore Role</strong>, the system will switch to <strong>{pendingAreaSwitch.name}</strong> and validate that your original privileges are completely re-established.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={cancelPendingAreaSwitch}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleProceed}
            className="flex items-center gap-1.5"
          >
            <span>Proceed &amp; Restore Role</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
