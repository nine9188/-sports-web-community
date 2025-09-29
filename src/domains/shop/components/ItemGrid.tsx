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
  viewMode?: 'grid' | 'compact' | 'table'
  isLoading?: boolean
}

export default function ItemGrid({ 
  items, 
  userItems: initialUserItems, 
  userPoints: initialPoints, 
  userId,
  viewMode = 'grid',
  isLoading = false
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

  const renderGrid = () => (
    <div className={viewMode === 'compact' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4'}>
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          isOwned={userItems.includes(item.id)}
          onPurchase={() => handleSelectItem(item)}
          // compact 모드 시 내부 간격을 줄이기 위해 data-attribute 전달 (선택적)
          data-compact={viewMode === 'compact' ? true : undefined as unknown as never}
        />
      ))}
    </div>
  )

  const renderTable = () => (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left w-10">아이콘</th>
            <th className="px-3 py-2 text-left">이름</th>
            <th className="px-3 py-2 text-right w-24">가격</th>
            <th className="px-3 py-2 text-right w-24">상태</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-t">
              <td className="px-3 py-2 align-middle">
                <div className="w-5 h-5 relative">
                  {/* LCP 고려: Next Image 사용 */}
                  <picture>
                    <source srcSet={item.image_url} />
                    <img src={item.image_url} alt={item.name} width={20} height={20} className="w-5 h-5 object-contain" loading="lazy" />
                  </picture>
                </div>
              </td>
              <td className="px-3 py-2 align-middle">
                <span className="truncate inline-block max-w-[320px] align-middle" title={item.name}>{item.name}</span>
              </td>
              <td className="px-3 py-2 text-right align-middle tabular-nums">{item.is_default ? '기본' : `${item.price} P`}</td>
              <td className="px-3 py-2 text-right align-middle">
                {userItems.includes(item.id) ? (
                  <span className="inline-flex items-center justify-center h-7 px-2 text-xs rounded bg-gray-600 text-white">보유 중</span>
                ) : (
                  <button onClick={() => handleSelectItem(item)} className="inline-flex items-center justify-center h-7 px-3 text-xs rounded bg-gray-200 hover:bg-gray-300">구매</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

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
      
      {/* 아이템 표시 */}
      {viewMode === 'table' ? renderTable() : renderGrid()}
      
      {/* 아이템이 없는 경우 (로딩 중에는 표시하지 않음) */}
      {items.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">현재 구매 가능한 아이템이 없습니다.</p>
        </div>
      )}
    </div>
  )
} 