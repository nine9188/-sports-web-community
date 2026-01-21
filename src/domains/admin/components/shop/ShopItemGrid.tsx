'use client';

import Image from 'next/image';
import { Trash2, Pencil } from 'lucide-react';
import { TabList, type TabItem } from '@/shared/components/ui';
import type { ShopItem, ShopCategory } from './types';

interface ShopItemGridProps {
  items: ShopItem[];
  hierarchicalCategories: ShopCategory[];
  activeCategory: number | null;
  isLoading: boolean;
  onCategoryChange: (categoryId: number | null) => void;
  onEditItem: (item: ShopItem) => void;
  onDeleteItem: (itemId: number) => void;
}

export function ShopItemGrid({
  items,
  hierarchicalCategories,
  activeCategory,
  isLoading,
  onCategoryChange,
  onEditItem,
  onDeleteItem,
}: ShopItemGridProps) {
  // 카테고리 탭 데이터 생성
  const categoryTabs: TabItem[] = [
    { id: 'all', label: '전체' },
    ...hierarchicalCategories.map((category) => ({
      id: category.id.toString(),
      label: category.name,
    })),
  ];

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    if (tabId === 'all') {
      onCategoryChange(null);
    } else {
      onCategoryChange(parseInt(tabId));
    }
  };

  // 현재 활성 탭 ID 결정
  const activeTab = activeCategory ? activeCategory.toString() : 'all';

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">
        등록된 아이콘 ({items.length}개)
      </h2>

      {/* 카테고리 탭 */}
      <TabList tabs={categoryTabs} activeTab={activeTab} onTabChange={handleTabChange} variant="minimal" />

      {/* 필터링된 아이템 목록 - 작은 아이콘 */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-black/7 dark:border-white/10 rounded p-2 group relative bg-white dark:bg-[#1D1D1D]"
          >
            {/* 아이콘 이미지 - 32x32 고정 */}
            <div className="flex justify-center mb-1.5">
              <div className="w-8 h-8 relative">
                <Image src={item.image_url} alt={item.name} fill className="object-contain" sizes="32px" />
              </div>
            </div>

            {/* 아이콘 정보 */}
            <p
              className="text-[10px] text-center font-medium truncate text-gray-900 dark:text-[#F0F0F0]"
              title={item.name}
            >
              {item.name}
            </p>
            <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">{item.price}P</p>

            {/* 호버 시 액션 버튼들 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
              <button
                onClick={() => onEditItem(item)}
                className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded"
                disabled={isLoading}
                title="수정"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded"
                disabled={isLoading}
                title="삭제"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">등록된 아이콘이 없습니다.</div>
      )}
    </div>
  );
}
