import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CreditCard } from 'lucide-react';
import type { Participant } from '@/types/event';

export interface PaymentPromptData {
  participant?: Participant;
  memberId?: string;
  name: string;
  currentStatus: 'Paid' | 'Not Paid';
  targetStatus: 'Paid' | 'Not Paid';
}

interface PaymentConfirmModalProps {
  prompt: PaymentPromptData | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isConfirming: boolean;
}

export const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  prompt,
  onClose,
  onConfirm,
  isConfirming,
}) => {
  return (
    <Modal
      isOpen={Boolean(prompt)}
      onClose={onClose}
      title="Confirm Payment Status Change"
      maxWidth="sm"
    >
      {prompt && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <CreditCard className="w-5 h-5 text-navy shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Update payment record for{' '}
              <strong className="text-slate-900">{prompt.name}</strong> from{' '}
              <span className="font-bold text-amber-700">
                {prompt.currentStatus}
              </span>{' '}
              to{' '}
              <span className="font-bold text-emerald-700">
                {prompt.targetStatus}
              </span>
              ?
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              isLoading={isConfirming}
            >
              Confirm Update
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
