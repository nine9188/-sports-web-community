'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { toast } from 'react-toastify';
import ItemCard from './ItemCard';
import PurchaseModal from './PurchaseModal';

interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string;
  price: number;
  is_default: boolean;
  is_active: boolean;
}

interface ItemGridProps {
  items: ShopItem[];
  userItems: number[];
  userPoints: number;
  userId?: string;
}

export default function ItemGrid({ items, userItems: initialUserItems, userPoints: initialPoints, userId }: ItemGridProps) {
  const supabase = createClient();
  const [userItems, setUserItems] = useState<number[]>(initialUserItems);
  const [points, setPoints] = useState<number>(initialPoints);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // 아이템 구매 처리 (수정)
  const handlePurchase = async () => {
    if (!selectedItem || !userId) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    try {
      setIsPurchasing(true);
      
      // 구매 전 사용자의 현재 포인트 확인
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        throw new Error('사용자 포인트를 확인할 수 없습니다.');
      }
      
      if (profileData.points < selectedItem.price) {
        throw new Error('포인트가 부족합니다.');
      }
      
      // 이미 소유하고 있는지 확인
      const { data: existingItem } = await supabase
        .from('user_items')
        .select('*')
        .eq('user_id', userId)
        .eq('item_id', selectedItem.id)
        .single();
      
      if (existingItem) {
        throw new Error('이미 소유하고 있는 아이템입니다.');
      }
      
      // 아이템 구매 처리 (RPC 대신 직접 처리)
      // 1. 포인트 차감
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: profileData.points - selectedItem.price })
        .eq('id', userId);
      
      if (updateError) {
        throw updateError;
      }
      
      // 2. 사용자 아이템 추가
      const { error: insertError } = await supabase
        .from('user_items')
        .insert({ user_id: userId, item_id: selectedItem.id });
      
      if (insertError) {
        // 롤백: 차감된 포인트 복구
        await supabase
          .from('profiles')
          .update({ points: profileData.points })
          .eq('id', userId);
        
        throw insertError;
      }
      
      // 구매 성공 시 보유 아이템 목록 업데이트
      setUserItems(prev => [...prev, selectedItem.id]);
      
      // 포인트 차감
      setPoints(prev => prev - selectedItem.price);
      
      toast.success('아이템 구매가 완료되었습니다!');
      setSelectedItem(null);
    } catch (error: unknown) {
      console.error('아이템 구매 중 오류:', error);
      
      let errorMessage = '아이템 구매에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div>
      {/* 구매 확인 모달 */}
      {selectedItem && (
        <PurchaseModal
          item={selectedItem}
          isProcessing={isPurchasing}
          onCancel={() => setSelectedItem(null)}
          onConfirm={handlePurchase}
          canAfford={points >= selectedItem.price}
          userPoints={points}
        />
      )}
      
      {/* 아이템 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            isOwned={userItems.includes(item.id)}
            canAfford={points >= item.price}
            onPurchase={() => setSelectedItem(item)}
          />
        ))}
      </div>
      
      {/* 아이템이 없는 경우 */}
      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">현재 구매 가능한 아이템이 없습니다.</p>
        </div>
      )}
    </div>
  );
} 