import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-navy-deep/60 backdrop-blur-xs z-50 animate-in fade-in duration-200" />
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Dialog.Content
            className={`w-full ${widthClasses[maxWidth]} bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-7 max-h-[90vh] overflow-y-auto focus:outline-none animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-900 font-heading">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-sm text-slate-500 mt-0.5">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <div className="mt-5">{children}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

