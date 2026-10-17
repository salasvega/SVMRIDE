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
          <label htmlFor={selectId} className="block text-sm font-medium text-noir mb-2">
            {props.required ? label.replace(/\s*\*$/, '') : label}
            {props.required && <span className="text-lien ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`${widthClass} px-4 py-3 bg-surface text-noir border-[1.5px] rounded-xl placeholder:text-doux-58 focus:outline-none focus:border-lien focus:ring-4 focus:ring-lien/15 transition-[border-color,box-shadow] duration-150 appearance-none champ-select ${error ? 'border-red-600' : 'border-champ'} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
