import React, { useId } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, children, className = '', id, name, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || (name ? String(name) : `select-${generatedId}`);
    const selectName = name || selectId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-slate-800 select-none">
            {label}
            {props.required && <span className="text-mfc-red ml-1">*</span>}
          </label>
        )}
        <select
          id={selectId}
          name={selectName}
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-sm bg-white text-slate-900 border rounded-lg min-h-[44px] transition-all focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed shadow-2xs ${
            error ? 'border-mfc-red focus:border-mfc-red focus:ring-red-100' : 'border-slate-300 hover:border-slate-400'
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
        {error && <span className="text-xs text-mfc-red font-medium" role="alert">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

