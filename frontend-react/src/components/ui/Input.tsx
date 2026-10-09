import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-text-main select-none">
            {label}
            {props.required && <span className="text-mfc-red ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-sm bg-white text-text-main border rounded-md min-h-[44px] transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error ? 'border-mfc-red focus:border-mfc-red focus:ring-red-100' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-mfc-red font-medium">{error}</span>}
        {helperText && !error && <span className="text-xs text-text-muted">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
