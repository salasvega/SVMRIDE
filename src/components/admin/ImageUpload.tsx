import { useState, useCallback } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertTriangle,
  GripVertical,
  Maximize2,
  Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface UploadedImage {
  url: string;
  path: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxFileSizeMB?: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 8,
  maxFileSizeMB = 20,
  maxWidthPx = 1600,
  maxHeightPx = 1600,
  quality = 0.8,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);

  // état de prévisualisation plein écran
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);

  // ========= COMPRESSION =========
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target) return reject(new Error('Lecture fichier échouée'));
        img.src = e.target.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Impossible de lire le fichier image'));
      };

      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // resize proportionnel avec largeur/hauteur max
        if (targetWidth > maxWidthPx) {
          const ratio = maxWidthPx / targetWidth;
          targetWidth = maxWidthPx;
          targetHeight = Math.round(targetHeight * ratio);
        }
        if (targetHeight > maxHeightPx) {
          const ratio = maxHeightPx / targetHeight;
          targetHeight = maxHeightPx;
          targetWidth = Math.round(targetWidth * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context non dispo'));
          return;
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression échouée'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Impossible de charger l'image pour compression"));
      };

      reader.readAsDataURL(file);
    });
  }

  // ========= UPLOAD D'UNE IMAGE =========
  const uploadSingleFile = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      if (!file.type.startsWith('image/')) {
        setError('Fichier non supporté. Images uniquement.');
        return null;
      }

      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxFileSizeMB) {
        setError(
          `Image trop lourde (${sizeMB.toFixed(
            1
          )} Mo). Max ${maxFileSizeMB} Mo avant compression.`
        );
        return null;
      }

      try {
        const compressedBlob = await compressImage(file);

        const fileExt = 'jpg';
        const fileName = `${Math.random()
          .toString(36)
          .substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(filePath, compressedBlob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);

        return { url: publicUrl, path: filePath };
      } catch (err) {
        console.error('Error uploading image:', err);
        setError("Erreur lors de l’upload de l’image");
        return null;
      }
    },
    [maxFileSizeMB, quality, maxWidthPx, maxHeightPx]
  );

  // ========= UPLOAD MULTIPLE =========
  const handleFilesBatch = useCallback(
    async (fileList: FileList | File[]) => {
      if (!fileList || fileList.length === 0) return;

      const availableSlots = maxImages - images.length;
      if (availableSlots <= 0) {
        setError(`Limite atteinte (${maxImages} images max).`);
        return;
      }

      const filesArray = Array.from(fileList).slice(0, availableSlots);

      setUploading(true);
      setError('');

      const uploadedResults: UploadedImage[] = [];

      for (const file of filesArray) {
        const uploaded = await uploadSingleFile(file);
        if (uploaded) {
          uploadedResults.push(uploaded);
        }
      }

      setUploading(false);

      if (uploadedResults.length > 0) {
        onChange([...images, ...uploadedResults]);
      }
    },
    [images, maxImages, uploadSingleFile, onChange]
  );

  // input type="file"
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    await handleFilesBatch(files ?? []);
    e.target.value = '';
  };

  // ========= DROPZONE UPLOAD =========
  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(true);
  };

  const handleDropZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
  };

  const handleDropZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);

    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;

    await handleFilesBatch(dt.files);
  };

  // ========= SUPPRESSION =========
  const removeImage = async (index: number) => {
    const imgToRemove = images[index];

    if (imgToRemove?.path) {
      const { error: removeError } = await supabase.storage
        .from('vehicle-images')
        .remove([imgToRemove.path]);

      if (removeError) {
        console.error('Error removing image from storage:', removeError);
        setError('Impossible de supprimer cette image du stockage.');
        return;
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);

    // si on supprime celle qu'on est en train de prévisualiser: fermer la modale
    if (previewImage && previewImage.path === imgToRemove.path) {
      setPreviewImage(null);
    }
  };

  // ========= RÉORDONNANCEMENT =========
  const handleDragStartReorder = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOverReorder = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropReorder = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setDragIndex(null);
    onChange(reordered);
  };

  // ========= DÉFINIR COMME PHOTO PRINCIPALE =========
  // Déplace l'image choisie en index 0
  const setAsPrimary = (img: UploadedImage) => {
    const currentIndex = images.findIndex(
      (i) => i.path === img.path && i.url === img.url
    );
    if (currentIndex === -1) return;

    // si elle est déjà en 0, rien à faire
    if (currentIndex === 0) {
      return;
    }

    const reordered = [...images];
    const [chosen] = reordered.splice(currentIndex, 1);
    reordered.unshift(chosen);

    onChange(reordered);

    // on garde la modale ouverte, mais on met à jour previewImage
    setPreviewImage(chosen);
  };

  // ========= RENDER =========
  return (
    <>
      {/* Bloc principal */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#111111] mb-2">
          Photos du véhicule
        </label>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, index) => (
            <div
              key={index}
              className={`relative group rounded-lg border-2 border-[#E5E5E5] bg-white flex flex-col overflow-hidden ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={() => handleDragStartReorder(index)}
              onDragOver={handleDragOverReorder}
              onDrop={() => handleDropReorder(index)}
            >
              <div className="relative w-full h-32 overflow-hidden bg-[#F5F5F5] flex items-center justify-center">
                {/* miniature */}
                <img
                  src={img.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* badge Principale */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-brand text-white text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white text-white" />
                    <span>Principale</span>
                  </div>
                )}

                {/* bouton suppression */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* bouton voir en grand */}
                <button
                  type="button"
                  onClick={() => setPreviewImage(img)}
                  className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-medium"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Voir</span>
                </button>
              </div>

              <div className="flex items-center justify-between px-2 py-2 bg-white text-[#666666] text-[11px]">
                <div className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-[#999999] cursor-grab" />
                  <span className="truncate max-w-[6rem]">
                    {img.path || 'image'}
                  </span>
                </div>
                <span className="text-[10px] text-[#999999]">
                  {index + 1}/{images.length}
                </span>
              </div>
            </div>
          ))}

          {/* Zone d'upload */}
          {images.length < maxImages && (
            <label
              className={[
                'border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer transition-all text-center px-2',
                isDropTarget
                  ? 'border-brand bg-brand/10'
                  : 'border-[#CCCCCC] hover:border-brand hover:bg-brand/5',
              ].join(' ')}
              onDragOver={handleDropZoneDragOver}
              onDragLeave={handleDropZoneDragLeave}
              onDrop={handleDropZoneDrop}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />

              {uploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
                  <p className="text-xs text-[#666666]">
                    Upload & compression...
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-[#AAAAAA] mb-2 pointer-events-none" />
                  <span className="text-sm text-[#666666] leading-snug">
                    Glissez-déposez
                    <br />
                    ou cliquez
                  </span>
                  <span className="text-[10px] text-[#AAAAAA] mt-1 leading-tight block">
                    Plusieurs fichiers autorisés
                    <br />
                    ({images.length}/{maxImages})
                  </span>
                </>
              )}
            </label>
          )}
        </div>

        <p className="text-xs text-[#666666]">
          <ImageIcon className="w-3 h-3 inline mr-1" />
          Glissez pour réordonner les photos. La première est utilisée comme visuel principal.
        </p>

        <p className="text-[10px] text-[#999999] leading-snug">
          Les images sont redimensionnées (max {maxWidthPx}px) et compressées (~
          {Math.round(quality * 100)}% qualité) avant l’upload pour charger vite
          sur mobile.
        </p>
      </div>

      {/* ===== Modale de prévisualisation plein écran ===== */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-[#111111] rounded-xl shadow-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()} // ne pas fermer si on clique dans la modale
          >
            {/* Bouton fermeture */}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Bouton "Définir comme principale" */}
            <button
              type="button"
              onClick={() => setAsPrimary(previewImage)}
              className="absolute top-3 left-3 bg-brand hover:bg-[#a92222] text-white text-xs font-semibold rounded-full px-3 py-2 flex items-center gap-1 shadow-lg"
            >
              <Star className="w-4 h-4 fill-white text-white" />
              <span>Définir comme photo principale</span>
            </button>

            {/* Image en grand */}
            <img
              src={previewImage.url}
              alt="Preview"
              className="max-h-[75vh] max-w-[90%] object-contain"
            />

            {/* Bandeau d'info bas */}
            <div className="w-full bg-black/60 text-white text-xs px-3 py-2 flex justify-between flex-wrap gap-2">
              <span className="truncate max-w-[70%]">
                {previewImage.path || 'image'}
              </span>
              <span className="opacity-75">
                clic en dehors pour fermer
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
