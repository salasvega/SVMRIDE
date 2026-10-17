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
          <label htmlFor={inputId} className="block text-sm font-medium text-noir mb-2">
            {props.required ? label.replace(/\s*\*$/, '') : label}
            {props.required && <span className="text-lien ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${widthClass} px-4 py-3 bg-surface text-noir border-[1.5px] rounded-xl placeholder:text-doux-58 focus:outline-none focus:border-lien focus:ring-4 focus:ring-lien/15 transition-[border-color,box-shadow] duration-150 ${error ? 'border-red-600' : 'border-champ'} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-doux-68">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
