import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={widthClass}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-[#111111] mb-2">
            {label}
            {props.required && <span className="text-[#D10000] ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${widthClass} px-4 py-3 border border-[#AAAAAA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D10000] focus:border-transparent transition-all resize-vertical ${error ? 'border-[#D10000]' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[#D10000]">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
