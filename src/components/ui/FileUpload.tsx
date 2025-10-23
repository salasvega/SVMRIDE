import { useState, useRef } from 'react';
import { Upload, X, File } from 'lucide-react';

interface FileUploadProps {
  label: string;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  onChange: (files: File[]) => void;
  required?: boolean;
}

export function FileUpload({
  label,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp',
  onChange,
  required = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError('');

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Vous ne pouvez télécharger que ${maxFiles} fichiers maximum`);
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const invalidFiles = selectedFiles.filter((file) => file.size > maxSizeBytes);

    if (invalidFiles.length > 0) {
      setError(`Les fichiers doivent faire moins de ${maxSizeMB}MB`);
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    onChange(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange(newFiles);
    setError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[#111111]">
        {label}
        {required && <span className="text-[#D10000] ml-1">*</span>}
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#CCCCCC] rounded-lg cursor-pointer bg-white hover:bg-[#F9F9F9] transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-[#666666]" />
              <p className="mb-2 text-sm text-[#666666]">
                <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
              </p>
              <p className="text-xs text-[#999999]">
                PDF, Word, Excel, TXT, CSV, Images (max {maxSizeMB}MB)
              </p>
              <p className="text-xs text-[#999999] mt-1">
                {files.length}/{maxFiles} fichier(s)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept={accept}
              onChange={handleFileSelect}
              disabled={files.length >= maxFiles}
            />
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#F9F9F9] rounded-lg border border-[#EEEEEE]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-5 h-5 text-[#666666] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111111] truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#666666]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 p-1 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                  aria-label={`Supprimer ${file.name}`}
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
