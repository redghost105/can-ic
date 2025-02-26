"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface PhotoUploaderProps {
  onPhotoUploaded: (url: string) => void;
  initialImageUrl?: string;
}

export function PhotoUploader({ onPhotoUploaded, initialImageUrl }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append('file', file);

      // Upload to your storage service (e.g., Supabase Storage, AWS S3, etc.)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      setImageUrl(data.url);
      onPhotoUploaded(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    onPhotoUploaded('');
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!imageUrl ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={triggerFileInput}
        >
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 mb-2">
              {isUploading ? 'Uploading...' : 'Click to upload a photo of your vehicle'}
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG or GIF (max. 5MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <div className="aspect-video relative">
            <Image
              src={imageUrl}
              alt="Vehicle preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8"
            onClick={clearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 