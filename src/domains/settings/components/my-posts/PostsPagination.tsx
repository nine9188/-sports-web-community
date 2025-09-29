'use client';

import React from 'react';
import ShopPagination from '@/domains/shop/components/ShopPagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function PostsPagination({ 
  currentPage, 
  totalPages 
}: PaginationProps) {
  
  // totalPages를 total 아이템 수로 변환 (ShopPagination 시그니처 맞추기)
  const totalItems = Math.max(0, totalPages) * 10; // settings는 limit 10 고정
  if (totalPages <= 0) return null;

  return (
    <div className="px-4 sm:px-6">
      <ShopPagination
        page={currentPage}
        pageSize={10}
        total={totalItems}
        withMargin={false}
      />
    </div>
  );
} 