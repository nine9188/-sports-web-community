'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { ShopItem } from '../types'
import { purchaseItem } from '../actions/actions'

interface UseShopItemsProps {
  initialUserItems: number[]
  initialUserPoints: number
  userId?: string
}

export function useShopItems({
  initialUserItems,
  initialUserPoints,
  userId
}: UseShopItemsProps) {
  const [userItems, setUserItems] = useState<number[]>(initialUserItems)
  const [points, setPoints] = useState<number>(initialUserPoints)
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const handleSelectItem = (item: ShopItem) => {
    setSelectedItem(item)
  }

  const handleCancelPurchase = () => {
    setSelectedItem(null)
  }

  const handlePurchase = async () => {
    if (!selectedItem || !userId) {
      toast.error('로그인이 필요합니다.')
      return
    }
    
    try {
      setIsPurchasing(true)
      
      // 서버 액션을 통한 구매 처리
      await purchaseItem(selectedItem.id)
      
      // 구매 성공 시 보유 아이템 목록 업데이트
      setUserItems(prev => [...prev, selectedItem.id])
      
      // 포인트 차감
      setPoints(prev => prev - selectedItem.price)
      
      toast.success('아이템 구매가 완료되었습니다!')
      setSelectedItem(null)
    } catch (error: unknown) {
      console.error('아이템 구매 중 오류:', error)
      
      let errorMessage = '아이템 구매에 실패했습니다.'
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage
      }
      
      toast.error(errorMessage)
    } finally {
      setIsPurchasing(false)
    }
  }

  const isItemOwned = (itemId: number) => userItems.includes(itemId)
  const canAffordItem = (price: number) => points >= price

  return {
    userItems,
    points,
    selectedItem,
    isPurchasing,
    isItemOwned,
    canAffordItem,
    handleSelectItem,
    handleCancelPurchase,
    handlePurchase
  }
} 