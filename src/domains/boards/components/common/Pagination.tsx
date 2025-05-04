'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/shared/ui';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  boardSlug: string;
  fromBoardId?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  boardSlug,
  fromBoardId
}: PaginationProps) {
  // 페이지 번호 배열 생성 (현재 페이지 주변의 5개 페이지만 표시)
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // 페이지가 적은 경우 시작 페이지 조정
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // 페이지 링크 생성 함수
  const getPageLink = (page: number) => {
    const baseUrl = `/boards/${boardSlug}`;
    const fromParam = fromBoardId ? `&from=${fromBoardId}` : '';
    return `${baseUrl}?page=${page}${fromParam}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center gap-1 my-4">
      {/* 처음 페이지 버튼 */}
      {currentPage > 1 && (
        <Link href={getPageLink(1)} passHref>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            &lt;&lt;
          </Button>
        </Link>
      )}
      
      {/* 이전 페이지 버튼 */}
      {currentPage > 1 && (
        <Link href={getPageLink(currentPage - 1)} passHref>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            &lt;
          </Button>
        </Link>
      )}
      
      {/* 페이지 번호 */}
      {generatePageNumbers().map((page) => (
        <Link key={page} href={getPageLink(page)} passHref>
          <Button
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={`h-8 w-8 p-0 ${
              currentPage === page
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : ""
            }`}
          >
            {page}
          </Button>
        </Link>
      ))}
      
      {/* 다음 페이지 버튼 */}
      {currentPage < totalPages && (
        <Link href={getPageLink(currentPage + 1)} passHref>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            &gt;
          </Button>
        </Link>
      )}
      
      {/* 마지막 페이지 버튼 */}
      {currentPage < totalPages && (
        <Link href={getPageLink(totalPages)} passHref>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            &gt;&gt;
          </Button>
        </Link>
      )}
    </div>
  );
} 