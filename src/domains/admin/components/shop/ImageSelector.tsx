'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/shared/components/ui/button';
import type { StorageImage } from './types';

interface ImageSelectorProps {
  storageImages: StorageImage[];
  selectedImage: StorageImage | null;
  isLoading: boolean;
  onSelectImage: (image: StorageImage) => void;
  onUpload: (file: File) => void;
}

export function ImageSelector({
  storageImages,
  selectedImage,
  isLoading,
  onSelectImage,
  onUpload,
}: ImageSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="space-y-4">
      {/* 새 이미지 업로드 */}
      <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-lg p-4 text-center">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? '업로드 중...' : '새 이미지 업로드'}
        </Button>
      </div>

      {/* 저장된 이미지 목록 - 작은 아이콘 크기 */}
      <div className="border border-black/7 dark:border-white/10 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          저장된 이미지 ({storageImages.length}개)
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-[200px] overflow-y-auto">
          {storageImages.map((image) => (
            <div
              key={image.name}
              className={`relative cursor-pointer border rounded p-1.5 hover:border-gray-400 dark:hover:border-gray-500 transition-colors
                ${selectedImage?.url === image.url ? 'border-gray-500 dark:border-gray-400 bg-[#F5F5F5] dark:bg-[#2D2D2D]' : 'border-black/7 dark:border-white/10'}`}
              onClick={() => onSelectImage(image)}
              title={image.name}
            >
              <div className="w-8 h-8 relative mx-auto">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
