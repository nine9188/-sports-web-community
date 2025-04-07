'use client';

import { useState, useMemo } from 'react';
import ItemGrid from '../components/ItemGrid';

// 쇼핑 아이템 인터페이스 정의
interface ShopItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  is_default: boolean;
  is_active: boolean;
  category?: {
    name: string;
  };
}

interface CategoryFilterProps {
  items: ShopItem[];
  userItems: number[];
  userPoints: number;
  userId: string | undefined;
  categories: {
    id: number;
    name: string;
  }[];
}

export default function CategoryFilter({ items, userItems, userPoints, userId, categories }: CategoryFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter(item => item.category_id.toString() === activeCategory);
  }, [items, activeCategory]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeCategory === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id.toString())}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeCategory === category.id.toString()
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <ItemGrid
        items={filteredItems}
        userItems={userItems}
        userPoints={userPoints}
        userId={userId}
      />
    </div>
  );
} 