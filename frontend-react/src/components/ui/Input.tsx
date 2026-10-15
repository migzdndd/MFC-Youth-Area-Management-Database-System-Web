import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  disableCopyPaste?: boolean;
  preventAutofill?: boolean;
  onBlockedClipboard?: (action: 'copy' | 'paste' | 'cut') => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      id,
      name,
      type = 'text',
      autoComplete,
      disableCopyPaste = false,
      preventAutofill = false,
      onBlockedClipboard,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || (name ? String(name) : `input-${generatedId}`);
    const inputName = name || inputId;
    const [showPassword, setShowPassword] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(Boolean(preventAutofill));

    const unlockField = () => {
      if (preventAutofill && isReadOnly) {
        setIsReadOnly(false);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      unlockField();
      props.onFocus?.(e);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
      unlockField();
      props.onMouseDown?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
      unlockField();
      props.onTouchStart?.(e);
    };

    const handleCopy = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disableCopyPaste) {
        e.preventDefault();
        onBlockedClipboard?.('copy');
      }
      props.onCopy?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disableCopyPaste) {
        e.preventDefault();
        onBlockedClipboard?.('paste');
      }
      props.onPaste?.(e);
    };

    const handleCut = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (disableCopyPaste) {
        e.preventDefault();
        onBlockedClipboard?.('cut');
      }
      props.onCut?.(e);
    };

    const handleDrop = (e: React.DragEvent<HTMLInputElement>) => {
      if (disableCopyPaste) {
        e.preventDefault();
      }
      props.onDrop?.(e);
    };

    const isPassword = type === 'password';
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const effectiveReadOnly = props.readOnly ?? (preventAutofill ? isReadOnly : undefined);

    const resolvedAutoComplete = autoComplete ?? (() => {
      if (preventAutofill) return 'off';
      const field = String(name || id || '').toLowerCase();
      if (type === 'email' || field.includes('email')) return 'email';
      if (type === 'password') return 'current-password';
      if (type === 'tel' || field.includes('contact') || field.includes('phone') || field.includes('mobile')) return 'tel';
      if (field.includes('firstname') || field.includes('first_name')) return 'given-name';
      if (field.includes('middlename') || field.includes('middle_name')) return 'additional-name';
      if (field.includes('lastname') || field.includes('last_name')) return 'family-name';
      if (field.includes('nickname')) return 'nickname';
      if (field.includes('search') || type === 'search') return 'off';
      return undefined;
    })();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-800 select-none flex items-center justify-between">
            <span>
              {label}
              {props.required && <span className="text-mfc-red ml-1">*</span>}
            </span>
          </label>
        )}
        <div className="relative flex items-center w-full">
          <input
            {...props}
            id={inputId}
            name={inputName}
            type={effectiveType}
            autoComplete={resolvedAutoComplete}
            readOnly={effectiveReadOnly}
            onFocus={handleFocus}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onCut={handleCut}
            onDrop={handleDrop}
            data-lpignore={preventAutofill ? 'true' : undefined}
            data-1p-ignore={preventAutofill ? 'true' : undefined}
            data-form-type={preventAutofill ? 'other' : undefined}
            autoCorrect={preventAutofill ? 'off' : props.autoCorrect}
            autoCapitalize={preventAutofill ? 'off' : props.autoCapitalize}
            spellCheck={preventAutofill ? false : props.spellCheck}
            ref={ref}
            className={`w-full px-3.5 py-2.5 text-sm bg-white text-slate-900 border rounded-lg min-h-[44px] transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/15 focus:border-navy disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed shadow-2xs ${
              isPassword ? 'pr-11' : ''
            } ${
              error ? 'border-mfc-red focus:border-mfc-red focus:ring-red-100' : 'border-slate-300 hover:border-slate-400'
            } ${className}`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 p-2 text-slate-400 hover:text-slate-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-mfc-red font-medium" role="alert">{error}</span>}
        {helperText && !error && <span className="text-xs text-slate-500">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

