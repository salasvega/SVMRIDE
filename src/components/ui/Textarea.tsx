import { TextareaHTMLAttributes, forwardRef } from 'react';
import { sansReperes } from '../../lib/edition';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? sansReperes(label).toLowerCase().replace(/\s+/g, '-') : undefined);
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={widthClass}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-noir mb-2">
            {props.required ? label.replace(/\s*\*(?=[\u2061-\u2064\u200C\u2060]*$)/, '') : label}
            {props.required && <span className="text-lien ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${widthClass} px-4 py-3 bg-surface text-noir border-[1.5px] rounded-xl placeholder:text-doux-58 focus:outline-none focus:border-lien focus:ring-4 focus:ring-lien/15 transition-[border-color,box-shadow] duration-150 resize-vertical ${error ? 'border-red-600' : 'border-champ'} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
