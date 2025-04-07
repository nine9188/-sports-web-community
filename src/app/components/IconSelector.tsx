'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';

// 아이콘 항목 타입
interface ShopItem {
  id: number;
  name: string;
  image_url: string;
}

// Supabase 응답 데이터 타입
interface SupabaseUserItem {
  item_id: number;
  shop_items: {
    id: number;
    name: string;
    image_url: string;
  };
}

interface IconSelectorProps {
  userId: string;
  currentIconId: number | null;
  onSelect: (iconId: number) => void;
}

export default function IconSelector({ userId, currentIconId, onSelect }: IconSelectorProps) {
  const [purchasedIcons, setPurchasedIcons] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPurchasedIcons = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // 구매한 아이콘 목록 가져오기 (user_items 테이블 활용)
        const { data: userItems, error: itemsError } = await supabase
          .from('user_items')
          .select(`
            item_id,
            shop_items(id, name, image_url)
          `)
          .eq('user_id', userId);
          
        if (itemsError) throw itemsError;
        
        // 데이터 형식 변환
        if (userItems) {
          // 타입 어설션을 사용하여 Supabase 응답 데이터 처리
          const typedItems = userItems as unknown as SupabaseUserItem[];
          const icons = typedItems
            .filter(item => item.shop_items) // null 체크
            .map(item => ({
              id: item.item_id,
              name: item.shop_items.name,
              image_url: item.shop_items.image_url
            }));
            
          setPurchasedIcons(icons);
        }
      } catch (err: unknown) {
        console.error('구매한 아이콘 로딩 오류:', err);
        setError(err instanceof Error ? err.message : '아이콘 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPurchasedIcons();
  }, [userId]);

  if (isLoading) {
    return <div className="text-center py-4">아이콘 불러오는 중...</div>;
  }
  
  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }
  
  if (purchasedIcons.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        구매한 아이콘이 없습니다. 상점에서 아이콘을 구매해보세요!
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {purchasedIcons.map((icon) => (
          <div 
            key={icon.id}
            onClick={() => onSelect(icon.id)}
            className={`
              cursor-pointer p-1.5 rounded-md border hover:bg-gray-100 transition
              ${currentIconId === icon.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            `}
          >
            <div className="relative w-7 h-7 mx-auto">
              <Image
                src={icon.image_url}
                alt={icon.name}
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 