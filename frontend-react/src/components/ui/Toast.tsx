import React, { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext, type ToastOptions, type ToastItem } from '@/hooks/useToast';


/**
 * Toast Notification System
 *
 * What it does:
 * Displays floating feedback banners (such as 'Successful' or 'Failed')
 * with accessible roles, smooth animations, and automatic dismiss timers.
 *
 * Backup plan / Safety:
 * Gracefully defaults missing fields, ensures touch targets exceed 44px,
 * and maintains polite aria-live regions for assistive technologies.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4500 }: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
      {children}
      <div
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto w-full bg-white rounded-xl shadow-lg border p-4 flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-top-2 sm:slide-in-from-right-4 ${
                isSuccess
                  ? 'border-emerald-200 shadow-emerald-500/5'
                  : isError
                  ? 'border-red-200 shadow-red-500/5'
                  : isWarning
                  ? 'border-amber-200 shadow-amber-500/5'
                  : 'border-slate-200'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <XCircle className="w-5 h-5 text-mfc-red" />}
                {isWarning && <AlertCircle className="w-5 h-5 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-navy" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-sm font-bold text-slate-900 font-heading leading-tight">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy -mr-2 -mt-2"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
