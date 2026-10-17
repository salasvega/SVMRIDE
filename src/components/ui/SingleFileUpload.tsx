import { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, AlertTriangle } from 'lucide-react';
import { ChoixSource, SOURIS_SEULEMENT } from './ChoixSource';

interface SingleFileUploadProps {
  label?: string;
  /** Chemin du fichier déjà envoyé (vide s'il n'y en a pas) */
  value?: string;
  /** Lien temporaire de consultation du fichier déjà envoyé (fichiers privés) */
  fileUrl?: string;
  onChange: (file: File) => void;
  onDelete?: () => void;
  disabled?: boolean;
  accept?: string;
  required?: boolean;
}

export function SingleFileUpload({
  label,
  value,
  fileUrl,
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
    // Fichier déjà envoyé : aperçu par lien temporaire (l'espace de stockage est privé)
    if (!value) {
      setPreviewUrl(null);
      setFileInfo(null);
      setLowQuality(false);
      return;
    }
    if (!fileUrl) return;

    const fileName = value.split('/').pop() || 'document';
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    let fileType = 'application/octet-stream';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(fileExt)) {
      fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
    } else if (fileExt === 'pdf') {
      fileType = 'application/pdf';
    }

    setPreviewUrl(fileUrl);
    setFileInfo({ name: fileName, size: 0, type: fileType });

    if (fileType.startsWith('image/')) {
      const img = new Image();
      img.onload = () => setLowQuality(img.width < 800 && img.height < 800);
      img.src = fileUrl;
    }
  }, [value, fileUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) traiterFichier(file);
  };

  const traiterFichier = (file: File) => {

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
          className="w-10 h-10 rounded-md overflow-hidden border border-bordure flex-shrink-0 focus:ring-2 focus:ring-lien/30"
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
      <div className="bg-fond text-doux-64 rounded-md p-2 flex items-center justify-center w-10 h-10 flex-shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  };

  return (
    <>
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-noir">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        {value || previewUrl ? (
          <div className="flex items-start justify-between bg-surface border border-bordure rounded-lg p-3 text-sm">
            <div className="flex items-start gap-3">
              {renderPreviewThumb()}

              <div className="min-w-0">
                <div className="font-medium text-noir truncate max-w-[220px]">
                  {getFileName()}
                </div>

                {fileInfo && fileInfo.size > 0 && (
                  <div className="text-[11px] text-doux-64">
                    {(fileInfo.size / (1024 * 1024)).toFixed(2)} Mo
                  </div>
                )}

                {fileInfo && (
                  <div className="text-[11px] text-doux-62 uppercase">
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
                className="text-doux-62 hover:text-lien ml-4"
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
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-champ rounded-lg hover:border-lien hover:bg-lien/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${SOURIS_SEULEMENT}`}
            >
              <Upload className="w-5 h-5 text-doux-62" />
              <span className="text-sm text-gris">
                Cliquer pour choisir un fichier
              </span>
            </button>
            <ChoixSource
              onFichiers={(f) => traiterFichier(f[0])}
              accept={accept}
              multiple={false}
              disabled={disabled}
              className="rounded-lg border-2 border-dashed border-champ p-3"
            />
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
              className="absolute -top-4 -right-4 bg-surface text-noir rounded-full shadow-lg p-2 hover:bg-noir hover:text-inverse transition-colors"
              onClick={() => setPreviewImageUrl(null)}
              aria-label="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={previewImageUrl}
              alt="Aperçu du fichier"
              className="max-w-[90vw] max-h-[80vh] rounded-lg shadow-2xl object-contain bg-noir"
            />
          </div>
        </div>
      )}
    </>
  );
}
