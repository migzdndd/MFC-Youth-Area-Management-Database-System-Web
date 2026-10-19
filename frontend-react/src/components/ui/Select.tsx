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

    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-slate-800 dark:text-slate-100 select-none">
            {label}
            {props.required && <span className="text-mfc-red ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          id={selectId}
          name={selectName}
          ref={ref}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId}
          className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border rounded-lg min-h-[44px] transition-all focus:outline-none focus:ring-2 focus:ring-navy/15 dark:focus:ring-sky-500/20 focus:border-navy dark:focus:border-sky-400 disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed shadow-2xs ${
            error ? 'border-mfc-red focus:border-mfc-red focus:ring-red-100' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
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
        {error && <span id={errorId} className="text-xs text-mfc-red font-medium" role="alert">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

