'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function PostsPagination({ 
  currentPage, 
  totalPages 
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 페이지 번호를 기준으로 URL 생성 함수
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // 표시할 페이지 범위 계산 (최대 5개)
  let startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, totalPages);
  
  // 시작 페이지가 항상 5개 미만일 경우 조정
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // 페이지가 없으면 표시하지 않음
  if (totalPages <= 0) {
    return null;
  }

  return (
    <nav className="flex justify-center my-4">
      <ul className="flex space-x-1">
        {/* 첫 페이지 버튼 */}
        {currentPage > 1 && (
          <li>
            <Link
              href={createPageURL(1)}
              className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-100"
            >
              처음
            </Link>
          </li>
        )}
        
        {/* 이전 페이지 버튼 */}
        {currentPage > 1 && (
          <li>
            <Link
              href={createPageURL(currentPage - 1)}
              className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-100"
            >
              이전
            </Link>
          </li>
        )}
        
        {/* 페이지 번호 */}
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
          <li key={page}>
            <Link
              href={createPageURL(page)}
              className={`px-3 py-2 border rounded text-sm ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {page}
            </Link>
          </li>
        ))}
        
        {/* 다음 페이지 버튼 */}
        {currentPage < totalPages && (
          <li>
            <Link
              href={createPageURL(currentPage + 1)}
              className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-100"
            >
              다음
            </Link>
          </li>
        )}
        
        {/* 마지막 페이지 버튼 */}
        {currentPage < totalPages && (
          <li>
            <Link
              href={createPageURL(totalPages)}
              className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-100"
            >
              마지막
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
} 