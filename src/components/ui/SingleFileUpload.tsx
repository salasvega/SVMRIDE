import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

interface SingleFileUploadProps {
  label?: string;
  value?: string;
  onChange: (file: File) => void;
  onDelete?: () => void;
  disabled?: boolean;
  accept?: string;
  required?: boolean;
}

export function SingleFileUpload({
  label,
  value,
  onChange,
  onDelete,
  disabled = false,
  accept = 'image/*,.pdf',
  required = false,
}: SingleFileUploadProps) {
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = 10;
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      setError(`Le fichier dépasse ${maxSizeMB} Mo`);
      return;
    }

    setError('');
    onChange(file);
    e.target.value = '';
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const getFileName = () => {
    if (!value) return null;
    const parts = value.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      {value ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 truncate max-w-[200px]">
                {getFileName()}
              </span>
            </div>
          </div>
          {!disabled && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 p-1"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            required={required}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              Cliquer pour choisir un fichier
            </span>
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
