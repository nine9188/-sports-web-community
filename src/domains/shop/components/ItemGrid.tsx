'use client'

import ItemCard from './ItemCard'
import PurchaseModal from './PurchaseModal'
import { ShopItem } from '../types'
import { useShopItems } from '../hooks/useShopItems'

interface ItemGridProps {
  items: ShopItem[]
  userItems: number[]
  userPoints: number
  userId?: string
}

export default function ItemGrid({ 
  items, 
  userItems: initialUserItems, 
  userPoints: initialPoints, 
  userId 
}: ItemGridProps) {
  const {
    userItems,
    points,
    selectedItem,
    isPurchasing,
    handleSelectItem,
    handleCancelPurchase,
    handlePurchase
  } = useShopItems({
    initialUserItems,
    initialUserPoints: initialPoints,
    userId
  })

  return (
    <div>
      {/* 구매 확인 모달 */}
      {selectedItem && (
        <PurchaseModal
          item={selectedItem}
          isProcessing={isPurchasing}
          onCancel={handleCancelPurchase}
          onConfirm={handlePurchase}
          canAfford={points >= selectedItem.price}
          userPoints={points}
          isLoggedIn={Boolean(userId)}
        />
      )}
      
      {/* 아이템 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            isOwned={userItems.includes(item.id)}
            onPurchase={() => handleSelectItem(item)}
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
  )
} 