import { useState, useCallback } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertTriangle,
  GripVertical,
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
  maxFileSizeMB?: number; // taille max AVANT compression
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number; // 0-1
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

  // état visuel pour le drag&drop de fichiers dans la zone d'upload
  const [isDropTarget, setIsDropTarget] = useState(false);

  // ========== UTIL: compression image ==========
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target) return reject(new Error('Lecture fichier échouée'));
        img.src = e.target.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Impossible de lire le fichier image"));
      };

      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // redimension proportionnel
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

  // ========== UPLOAD D'UNE SEULE IMAGE (interne) ==========
  const uploadSingleFile = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      // 1. validation avant compression
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

  // ========== UPLOAD MULTI (sélection OU drop) ==========
  const handleFilesBatch = useCallback(
    async (fileList: FileList | File[]) => {
      if (!fileList || fileList.length === 0) return;

      // limite nombre max avant même d'essayer
      const availableSlots = maxImages - images.length;
      if (availableSlots <= 0) {
        setError(`Limite atteinte (${maxImages} images max).`);
        return;
      }

      // on convertit FileList en vrai array pour map/filter
      const filesArray = Array.from(fileList).slice(0, availableSlots);

      setUploading(true);
      setError('');

      const uploadedResults: UploadedImage[] = [];

      // séquentiel simple mais batché: on accumule puis on pousse une seule fois
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

  // ========== INPUT FILE "classique" ==========
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    await handleFilesBatch(files ?? []);
    e.target.value = '';
  };

  // ========== DROP DIRECTEMENT DANS LA ZONE D'UPLOAD ==========
  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // feedback visuel
    if (!isDropTarget) setIsDropTarget(true);
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

  // ========== SUPPRESSION ==========
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
  };

  // ========== RÉORDONNANCEMENT (drag des vignettes) ==========
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

  // ========== RENDER ==========
  return (
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
              <img
                src={img.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {index === 0 && (
                <div className="absolute top-2 left-2 bg-[#C62E2E] text-white text-[10px] font-semibold px-2 py-1 rounded">
                  Principale
                </div>
              )}

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
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

        {/* Zone d'upload avec input + drop */}
        {images.length < maxImages && (
          <label
            className={[
              'border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer transition-all text-center px-2',
              isDropTarget
                ? 'border-[#C62E2E] bg-[#C62E2E]/10'
                : 'border-[#CCCCCC] hover:border-[#C62E2E] hover:bg-[#C62E2E]/5',
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C62E2E] mx-auto mb-2"></div>
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
  );
}
