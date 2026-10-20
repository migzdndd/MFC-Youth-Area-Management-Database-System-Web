import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 rounded-lg select-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2 min-h-[44px]',
    lg: 'text-base px-6 py-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-navy dark:bg-sky-600 text-white hover:bg-navy-light dark:hover:bg-sky-500 active:bg-navy-deep dark:active:bg-sky-700 focus-visible:ring-navy dark:focus-visible:ring-sky-400 shadow-xs hover:shadow-md border border-navy-light/40 dark:border-sky-400/30',
    secondary:
      'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 focus-visible:ring-slate-400 shadow-2xs hover:shadow-xs',
    danger:
      'bg-mfc-red dark:bg-rose-600 text-white hover:bg-red-800 dark:hover:bg-rose-500 active:bg-red-900 dark:active:bg-rose-700 focus-visible:ring-mfc-red shadow-xs border border-red-700/50 dark:border-rose-400/30',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 active:bg-slate-200/70 dark:active:bg-slate-700 focus-visible:ring-slate-400',
    accent:
      'bg-gold dark:bg-amber-600 text-white hover:bg-gold-dark dark:hover:bg-amber-500 active:bg-amber-800 focus-visible:ring-amber-500 shadow-xs hover:shadow-md border border-amber-600/40 dark:border-amber-400/30',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

