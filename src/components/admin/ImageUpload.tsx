import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError('');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);

      onChange([...images, publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadImage(files[i]);
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[#111111] mb-2">
        Photos du véhicule
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-[#E5E5E5]"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

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
              <p className="text-xs text-[#666666]">Upload...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[#AAAAAA] mb-2" />
              <span className="text-sm text-[#666666]">Ajouter des photos</span>
              <span className="text-xs text-[#AAAAAA] mt-1">JPG, PNG, WebP</span>
            </>
          )}
        </label>
      </div>

      <p className="text-xs text-[#666666]">
        <ImageIcon className="w-3 h-3 inline mr-1" />
        Les images sont automatiquement hébergées et optimisées
      </p>
    </div>
  );
}
