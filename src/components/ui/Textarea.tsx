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
          <label htmlFor={textareaId} className="block text-sm font-medium text-noir mb-2">
            {label}
            {props.required && <span className="text-bleu ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${widthClass} px-4 py-3 bg-white text-noir border-[1.5px] rounded-xl placeholder:text-[#767676] focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15 transition-[border-color,box-shadow] duration-150 resize-vertical ${error ? 'border-red-600' : 'border-champ'} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
