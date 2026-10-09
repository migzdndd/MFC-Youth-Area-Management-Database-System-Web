import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-text-main select-none">
            {label}
            {props.required && <span className="text-mfc-red ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-sm bg-white text-text-main border rounded-md min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy disabled:bg-slate-100 disabled:cursor-not-allowed ${
            error ? 'border-mfc-red focus:border-mfc-red focus:ring-red-100' : 'border-slate-300'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-mfc-red font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
