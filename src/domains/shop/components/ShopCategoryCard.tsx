'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShopCategory } from '../types'

interface ShopCategoryCardProps {
  category: ShopCategory
}

export default function ShopCategoryCard({ category }: ShopCategoryCardProps) {
  return (
    <Link 
      href={`/shop/${category.slug}`}
      className="block group"
    >
      <div className="border border-black/7 dark:border-0 rounded-lg overflow-hidden bg-white dark:bg-[#1D1D1D] shadow-sm transition-all hover:bg-[#EAEAEA] dark:hover:bg-[#333333]">
        <div className="h-48 bg-[#F5F5F5] dark:bg-[#262626] relative">
          {category.image_url ? (
            <Image 
              src={category.image_url} 
              alt={category.name}
              fill
              className="object-cover group-hover:brightness-75 transition-all"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-500 dark:text-gray-400">이미지 준비 중</span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0] transition-colors">
            {category.name}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-2">{category.description || `${category.name} 아이템을 구매해보세요.`}</p>
          <div className="mt-4 text-right">
            <span className="inline-block px-4 py-2 bg-[#262626] dark:bg-[#3F3F3F] text-white rounded-md group-hover:bg-[#3F3F3F] dark:group-hover:bg-[#4A4A4A] transition-colors">
              구경하기
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
} 