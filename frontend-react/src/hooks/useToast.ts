import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * useToast Hook
 *
 * What it does:
 * Provides convenient access to trigger popup notifications across application components.
 *
 * Backup plan / Safety:
 * Ensures the component is wrapped in ToastProvider, throwing a clear error if invoked outside.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
