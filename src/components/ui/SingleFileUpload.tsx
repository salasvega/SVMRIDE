import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const [lowQuality, setLowQuality] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadExistingFile = async () => {
      if (value && value.startsWith('financing-documents/')) {
        const filePath = value.replace('financing-documents/', '');
        const { data } = supabase.storage
          .from('financing-documents')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          setPreviewUrl(data.publicUrl);
          const fileName = value.split('/').pop() || 'document';

          const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
          let fileType = 'application/octet-stream';

          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExt)) {
            fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
          } else if (fileExt === 'pdf') {
            fileType = 'application/pdf';
          }

          try {
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            const size = contentLength ? parseInt(contentLength, 10) : 0;

            setFileInfo({ name: fileName, size, type: fileType });

            if (fileType.startsWith('image/')) {
              const img = new Image();
              img.onload = () => {
                const isLowQuality = img.width < 800 && img.height < 800;
                setLowQuality(isLowQuality);
              };
              img.src = data.publicUrl;
            }
          } catch (error) {
            setFileInfo({ name: fileName, size: 0, type: fileType });
          }
        }
      } else {
        setPreviewUrl(null);
        setFileInfo(null);
        setLowQuality(false);
      }
    };

    loadExistingFile();
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMB = 10;
    const maxBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxBytes) {
      setError(`Le fichier dépasse ${maxSizeMB} Mo`);
      return;
    }

    setError('');

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFileInfo({ name: file.name, size: file.size, type: file.type });

    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        const isLowQuality = img.width < 800 && img.height < 800;
        setLowQuality(isLowQuality);
      };
      img.src = objectUrl;
    } else {
      setLowQuality(false);
    }

    onChange(file);
    e.target.value = '';
  };

  const handleDelete = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileInfo(null);
    setLowQuality(false);
    if (onDelete) {
      onDelete();
    }
  };

  const getFileName = () => {
    if (fileInfo) return fileInfo.name;
    if (!value) return null;
    const parts = value.split('/');
    return parts[parts.length - 1];
  };

  const getShortType = (): string => {
    if (!fileInfo) return '';
    const mime = fileInfo.type;

    if (mime.startsWith('image/')) {
      return mime.split('/')[1];
    }
    if (mime === 'application/pdf') {
      return 'pdf';
    }
    if (mime.includes('word')) {
      return 'docx';
    }

    const ext = fileInfo.name.split('.').pop();
    return ext ? ext.toLowerCase() : 'fichier';
  };

  const renderPreviewThumb = () => {
    if (!previewUrl || !fileInfo) return null;

    const isImage = fileInfo.type.startsWith('image/');
    if (isImage) {
      return (
        <button
          type="button"
          onClick={() => setPreviewImageUrl(previewUrl)}
          className="w-10 h-10 rounded-md overflow-hidden border border-[#E5E5E5] flex-shrink-0 focus:ring-2 focus:ring-brand"
          title="Aperçu"
        >
          <img
            src={previewUrl}
            alt={fileInfo.name}
            className="w-full h-full object-cover"
          />
        </button>
      );
    }

    return (
      <div className="bg-[#F5F5F5] text-[#666666] rounded-md p-2 flex items-center justify-center w-10 h-10 flex-shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  };

  return (
    <>
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-[#111111]">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        {value || previewUrl ? (
          <div className="flex items-start justify-between bg-white border border-[#E5E5E5] rounded-lg p-3 text-sm">
            <div className="flex items-start gap-3">
              {renderPreviewThumb()}

              <div className="min-w-0">
                <div className="font-medium text-[#111111] truncate max-w-[220px]">
                  {getFileName()}
                </div>

                {fileInfo && fileInfo.size > 0 && (
                  <div className="text-[11px] text-[#666666]">
                    {(fileInfo.size / (1024 * 1024)).toFixed(2)} Mo
                  </div>
                )}

                {fileInfo && (
                  <div className="text-[11px] text-[#999999] uppercase">
                    {getShortType()}
                  </div>
                )}

                {lowQuality && (
                  <div className="text-[#D97706] flex items-center gap-1 mt-1 text-[11px] leading-tight">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>
                      Qualité faible : photo floue ou trop petite
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!disabled && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-[#999999] hover:text-brand ml-4"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#CCCCCC] rounded-lg hover:border-brand hover:bg-brand/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5 text-[#999999]" />
              <span className="text-sm text-[#444444]">
                Cliquer pour choisir un fichier
              </span>
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-4 -right-4 bg-white text-[#111111] rounded-full shadow-lg p-2 hover:bg-[#111111] hover:text-white transition-colors"
              onClick={() => setPreviewImageUrl(null)}
              aria-label="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={previewImageUrl}
              alt="Aperçu du fichier"
              className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl object-contain bg-[#111111]"
            />
          </div>
        </div>
      )}
    </>
  );
}
