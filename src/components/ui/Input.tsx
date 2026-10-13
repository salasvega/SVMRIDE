import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={widthClass}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#111111] mb-2">
            {label}
            {props.required && <span className="text-brand ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${widthClass} px-4 py-3 border border-[#AAAAAA] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all ${error ? 'border-brand' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-brand">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[#666666]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
