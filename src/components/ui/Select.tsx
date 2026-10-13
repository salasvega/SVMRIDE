import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, fullWidth = true, className = '', id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={widthClass}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[#111111] mb-2">
            {label}
            {props.required && <span className="text-brand ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`${widthClass} px-4 py-3 border border-[#AAAAAA] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all appearance-none bg-white ${error ? 'border-brand' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-brand">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
