import { useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertTriangle, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface UploadedImage {
  url: string;   // URL publique pour affichage
  path: string;  // chemin interne dans le bucket pour suppression
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxFileSizeMB?: number; // taille max AVANT compression, pour éviter les énormes trucs genre 80 Mo
  maxWidthPx?: number;
  maxHeightPx?: number;
  quality?: number; // qualité de sortie JPEG/WebP entre 0 et 1
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 8,
  maxFileSizeMB = 20, // on autorise gros en entrée, car on va compresser
  maxWidthPx = 1600,
  maxHeightPx = 1600,
  quality = 0.8,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // ========= COMPRESSION IMAGE AVANT UPLOAD =========
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target) return reject(new Error("Lecture fichier échouée"));
        img.src = e.target.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Impossible de lire le fichier image"));
      };

      img.onload = () => {
        // dimensions originales
        const originalWidth = img.width;
        const originalHeight = img.height;

        // calcul du redimensionnement proportionnel
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // si ça dépasse nos limites, on scale
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
          reject(new Error("Canvas context non dispo"));
          return;
        }

        // dessin dans le canvas redimensionné
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // export en blob compressé
        // note: "image/jpeg" + quality 0.8 = excellent ratio qualité/poids pour annonces
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression échouée"));
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

  // ========= UPLOAD (avec compression) =========
  const uploadImage = async (file: File) => {
    // 1. validation basique avant de consommer du CPU
    if (!file.type.startsWith('image/')) {
      setError('Fichier non supporté. Images uniquement.');
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxFileSizeMB) {
      setError(`Image trop lourde (${sizeMB.toFixed(1)} Mo). Max ${maxFileSizeMB} Mo avant compression.`);
      return;
    }

    if (images.length >= maxImages) {
      setError(`Limite atteinte (${maxImages} images max).`);
      return;
    }

    try {
      setUploading(true);
      setError('');

      // 2. compresser/redimensionner en Blob JPEG
      const compressedBlob = await compressImage(file);

      // 3. on fabrique un File-like pour l'upload Supabase
      const fileExt = 'jpg'; // on force jpg car on encode en jpeg
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
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

      onChange([...images, { url: publicUrl, path: filePath }]);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Erreur lors de l’upload de l’image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // upload séquentiel (simple et sûr)
    for (let i = 0; i < files.length; i++) {
      await uploadImage(files[i]);
    }

    e.target.value = '';
  };

  // ========= SUPPRESSION (bucket + state) =========
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

  // ========= DRAG & DROP (réordonnancement local) =========
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // requis pour autoriser le drop
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setDragIndex(null);
    onChange(reordered);
  };

  // ========= RENDER =========
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
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
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

        {images.length < maxImages && (
          <label className="border-2 border-dashed border-[#CCCCCC] rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#C62E2E] hover:bg-[#C62E2E]/5 transition-all">
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
                <p className="text-xs text-[#666666]">Upload & compression...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#AAAAAA] mb-2" />
                <span className="text-sm text-[#666666] text-center">
                  Ajouter des photos
                </span>
                <span className="text-xs text-[#AAAAAA] mt-1 text-center leading-tight">
                  Redimensionnées en {maxWidthPx}px max,
                  <br />
                  qualité {Math.round(quality * 100)}%
                </span>
              </>
            )}
          </label>
        )}
      </div>

      <p className="text-xs text-[#666666]">
        <ImageIcon className="w-3 h-3 inline mr-1" />
        Les images sont compressées avant l’upload pour charger plus vite sur le site.
      </p>

      <p className="text-[10px] text-[#999999]">
        {images.length}/{maxImages} photos
      </p>
    </div>
  );
}
