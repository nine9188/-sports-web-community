'use client';

import { Button } from '@/shared/components/ui/button';
import { ImageSelector } from './ImageSelector';
import { renderCategoryOptions } from './utils';
import type { StorageImage, ShopCategory, ShopItem } from './types';

interface ShopItemFormProps {
  editingItem: ShopItem | null;
  storageImages: StorageImage[];
  selectedImage: StorageImage | null;
  hierarchicalCategories: ShopCategory[];
  name: string;
  description: string;
  price: string;
  selectedCategory: number | null;
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onCategoryChange: (value: number | null) => void;
  onSelectImage: (image: StorageImage) => void;
  onUploadImage: (file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
}

export function ShopItemForm({
  editingItem,
  storageImages,
  selectedImage,
  hierarchicalCategories,
  name,
  description,
  price,
  selectedCategory,
  isLoading,
  onNameChange,
  onDescriptionChange,
  onPriceChange,
  onCategoryChange,
  onSelectImage,
  onUploadImage,
  onSubmit,
  onCancelEdit,
}: ShopItemFormProps) {
  const inputClassName =
    'w-full p-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400';

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">
        {editingItem ? '아이콘 수정' : '새 아이콘 추가'}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* 이미지 업로드 및 선택 */}
        <ImageSelector
          storageImages={storageImages}
          selectedImage={selectedImage}
          isLoading={isLoading}
          onSelectImage={onSelectImage}
          onUpload={onUploadImage}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              카테고리
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange(Number(e.target.value) || null)}
              className={inputClassName}
              required
            >
              <option value="">카테고리 선택</option>
              {renderCategoryOptions(hierarchicalCategories)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              아이콘 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className={inputClassName}
              placeholder="아이콘 이름 입력"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              가격 (포인트)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className={inputClassName}
              min="0"
              placeholder="가격 입력"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className={inputClassName}
            rows={2}
            placeholder="아이콘 설명 입력"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? '처리 중...' : editingItem ? '수정하기' : '등록하기'}
          </Button>
          {editingItem && (
            <Button type="button" variant="outline" onClick={onCancelEdit} disabled={isLoading}>
              취소
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
