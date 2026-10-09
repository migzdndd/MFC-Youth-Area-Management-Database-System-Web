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
    'inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] sm:min-h-[32px]',
    md: 'text-sm px-4 py-2 min-h-[44px]',
    lg: 'text-base px-6 py-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary: 'bg-navy text-white hover:bg-navy-light active:bg-navy-deep focus-visible:ring-navy shadow-2xs',
    secondary: 'bg-white text-text-main border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400 shadow-2xs',
    danger: 'bg-mfc-red text-white hover:bg-red-800 focus-visible:ring-mfc-red shadow-2xs',
    ghost: 'text-text-muted hover:text-text-main hover:bg-slate-100/80 focus-visible:ring-slate-400',
    accent: 'bg-gold text-white hover:bg-gold-dark focus-visible:ring-gold shadow-2xs',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
