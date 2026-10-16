import { useState, useRef } from 'react';
import {
  X,
  Upload as UploadIcon,
  FileText,
  AlertTriangle,
} from 'lucide-react';

// Représente un fichier uploadé enrichi de métadonnées utiles à l'UI
export type UploadedDoc = {
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
  lowQuality?: boolean;
};

interface FileUploadProps {
  label?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string; // ex: "image/*,application/pdf"
  value?: UploadedDoc[]; // liste contrôlée par le parent
  onChange: (files: UploadedDoc[]) => void; // callback pour mettre à jour côté parent
}

export function FileUpload({
  label = 'Fichiers',
  maxFiles = 10,
  maxSizeMB = 10,
  accept = '',
  value = [],
  onChange,
}: FileUploadProps) {
  // état local visuel
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null); // pour la lightbox
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  //
  // Utils d'affichage
  //

  // Transforme un MIME type trop verbeux en extension courte lisible
  // Ex:
  //  - "image/jpeg" → "jpeg"
  //  - "application/pdf" → "pdf"
  //  - Word openxml → "docx"
  //  - etc.
  const getShortType = (file: File): string => {
    const mime = file.type;

    if (mime.startsWith('image/')) {
      return mime.split('/')[1]; // "jpeg", "png", etc.
    }

    if (mime === 'application/pdf') {
      return 'pdf';
    }

    if (mime.includes('word')) {
      return 'docx';
    }

    if (mime.includes('presentation') || mime.includes('powerpoint')) {
      return 'ppt';
    }

    if (mime.includes('excel') || mime.includes('spreadsheet')) {
      return 'xls';
    }

    if (mime.startsWith('text/')) {
      return 'txt';
    }

    const ext = file.name.split('.').pop();
    return ext ? ext.toLowerCase() : 'fichier';
  };

  // Analyse d'une image: dimensions, qualité, previewUrl
  const analyzeImage = (file: File): Promise<UploadedDoc> =>
    new Promise((resolve) => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const lowQuality = width < 800 && height < 800; // règle simple: trop petit -> risque illisible
        resolve({
          file,
          previewUrl,
          width,
          height,
          lowQuality,
        });
      };
      img.onerror = () => {
        resolve({
          file,
          previewUrl,
        });
      };
      img.src = previewUrl;
    });

  //
  // Gestion interne des fichiers
  //

  // Ajoute des fichiers (depuis le drop ou l'<input type="file">)
  const addFiles = async (incomingList: FileList | File[]) => {
    setError('');

    // fichiers actuels (contrôlé par parent)
    const current = [...value];

    // combien de slots restants ?
    const slotsLeft = maxFiles - current.length;
    if (slotsLeft <= 0) {
      setError(
        `Vous avez déjà ajouté ${maxFiles} fichier(s) (limite atteinte).`
      );
      return;
    }

    // Normalise FileList en tableau, tronque si trop de fichiers
    const incoming = Array.from(incomingList).slice(0, slotsLeft);

    // Limite taille max (en Mo)
    const maxBytes = maxSizeMB * 1024 * 1024;

    // On va fabriquer les UploadedDoc à ajouter
    const processedDocs: UploadedDoc[] = [];

    for (const f of incoming) {
      if (f.size > maxBytes) {
        setError(
          `"${f.name}" dépasse ${maxSizeMB} Mo et n’a pas été ajouté.`
        );
        continue;
      }

      if (f.type.startsWith('image/')) {
        // image: on lit dimensions, qualité, etc.
        const analyzed = await analyzeImage(f);
        processedDocs.push(analyzed);
      } else {
        // document non-image: pas d'analyse dimensions
        const previewUrl = URL.createObjectURL(f);
        processedDocs.push({
          file: f,
          previewUrl,
        });
      }
    }

    // On notifie le parent avec la nouvelle liste fusionnée
    onChange([...current, ...processedDocs]);
  };

  // Retire un fichier par index
  const removeFile = (index: number) => {
    const newList = value.filter((_, i) => i !== index);
    onChange(newList);
  };

  //
  // Handlers UI: clic, input, drag & drop
  //

  const handleClickBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(files);

    // reset pour pouvoir ré-uploader le même nom de fichier après
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const dropped = e.dataTransfer.files;
    if (!dropped || dropped.length === 0) {
      return;
    }

    addFiles(dropped);
  };

  //
  // Lightbox
  //

  const openLightbox = (url: string) => {
    setPreviewImageUrl(url);
  };

  const closeLightbox = () => {
    setPreviewImageUrl(null);
  };

  //
  // Rendu UI: preview pour chaque fichier
  //

  const renderPreviewThumb = (doc: UploadedDoc) => {
    const isImage = doc.file.type.startsWith('image/');
    if (isImage) {
      return (
        <button
          type="button"
          onClick={() => openLightbox(doc.previewUrl)}
          className="w-10 h-10 rounded-md overflow-hidden border border-bordure flex-shrink-0 focus:ring-2 focus:ring-bleu/30"
          title="Aperçu"
        >
          <img
            src={doc.previewUrl}
            alt={doc.file.name}
            className="w-full h-full object-cover"
          />
        </button>
      );
    }

    return (
      <div className="bg-fond text-[#666666] rounded-md p-2 flex items-center justify-center w-10 h-10 flex-shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  };

  //
  // Rendu principal
  //

  return (
    <>
      <div className="space-y-3">
        {label && (
          <label className="block text-sm font-medium text-noir">
            {label}
          </label>
        )}

        {/* Zone drag & drop / clic */}
        <div
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-brand bg-brand/5'
              : 'border-champ bg-white hover:border-brand hover:bg-brand/5'
          }`}
          onClick={handleClickBrowse}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* input caché natif */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={accept}
            onChange={handleFileInputChange}
          />

          <div className="flex flex-col items-center justify-center text-gris">
            <UploadIcon className="w-8 h-8 text-[#6B6B6B] mb-2 pointer-events-none" />

            <p className="text-sm leading-snug text-center">
              Glissez-déposez vos documents
              <br />
              <span className="text-[#666666]">
                ou cliquez pour parcourir
              </span>
            </p>

            <p className="text-[11px] text-[#6B6B6B] mt-2 leading-snug">
              {value.length}/{maxFiles} fichier(s) ajouté(s)
              <br />
              Max {maxSizeMB} Mo / fichier
            </p>
          </div>
        </div>

        {/* Liste des fichiers sélectionnés */}
        {value.length > 0 && (
          <ul className="space-y-2">
            {value.map((doc, index) => (
              <li
                key={index}
                className="flex items-start justify-between bg-white border border-bordure rounded-lg p-3 text-sm"
              >
                <div className="flex items-start gap-3">
                  {/* vignette (image cliquable pour aperçu / icône sinon) */}
                  {renderPreviewThumb(doc)}

                  <div className="min-w-0">
                    {/* nom du fichier */}
                    <div className="font-medium text-noir truncate max-w-[220px]">
                      {doc.file.name}
                    </div>

                    {/* taille du fichier */}
                    <div className="text-[11px] text-[#666666]">
                      {(doc.file.size / (1024 * 1024)).toFixed(2)} Mo
                    </div>

                    {/* type court */}
                    <div className="text-[11px] text-[#6B6B6B] uppercase">
                      {getShortType(doc.file)}
                    </div>

                    {/* alerte qualité faible si image petite */}
                    {doc.lowQuality && (
                      <div className="text-[#D97706] flex items-center gap-1 mt-1 text-[11px] leading-tight">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>
                          Qualité faible : photo floue ou trop petite
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* bouton supprimer */}
                <button
                  type="button"
                  className="text-[#6B6B6B] hover:text-brand ml-4"
                  onClick={() => removeFile(index)}
                  aria-label={`Supprimer ${doc.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* message d'erreur global (taille max, limite nb fichiers, etc.) */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-[13px]">
            {error}
          </div>
        )}

        <p className="text-[11px] text-[#6B6B6B] leading-snug">
          Exemples : pièce d'identité, justificatif de domicile,
          bulletin de salaire.
        </p>
      </div>

      {/* Lightbox plein écran pour prévisualiser une image */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // évite de fermer en cliquant sur l'image
          >
            {/* bouton fermer */}
            <button
              type="button"
              className="absolute -top-4 -right-4 bg-white text-noir rounded-full shadow-lg p-2 hover:bg-[#111111] hover:text-white transition-colors"
              onClick={closeLightbox}
              aria-label="Fermer l’aperçu"
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
