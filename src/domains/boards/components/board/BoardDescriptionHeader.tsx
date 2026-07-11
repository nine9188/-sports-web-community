'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenLine, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import SeoSummaryCallout from '@/shared/components/SeoSummaryCallout';
import BoardBreadcrumbs from '../common/BoardBreadcrumbs';

interface Breadcrumb {
  id: string;
  name: string;
  slug?: string;
}

interface BoardDescriptionHeaderProps {
  boardId: string;
  name: string;
  slug: string;
  description: string | null;
  canWritePost: boolean;
  defaultCollapsed?: boolean;
  alwaysCollapsed?: boolean;
  breadcrumbs?: Breadcrumb[];
  plain?: boolean;
}

export default function BoardDescriptionHeader({
  boardId,
  name,
  slug,
  description,
  canWritePost,
  defaultCollapsed = false,
  alwaysCollapsed = false,
  breadcrumbs,
  plain = false
}: BoardDescriptionHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(alwaysCollapsed || defaultCollapsed);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (window.innerWidth >= 768 && !alwaysCollapsed) {
      const saved = localStorage.getItem(`4590_board_desc_collapsed_${boardId}`);
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } else {
      setIsCollapsed(true);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, [boardId, alwaysCollapsed]);

  const handleToggle = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (!alwaysCollapsed) {
      localStorage.setItem(`4590_board_desc_collapsed_${boardId}`, String(nextState));
    }
  };

  const content = (
    <>
      {/* 브레드크럼 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="h-6 px-4 flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5]/30 dark:bg-[#262626]/30">
          <BoardBreadcrumbs breadcrumbs={breadcrumbs} plain small />
        </div>
      )}
      {/* 게시판 헤더 바 */}
      <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${!isMobile && !isCollapsed && description ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
        <div className="flex items-center min-w-0">
          <h1 className="text-[13px] font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">
            {name}
          </h1>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {description && (
            isMobile ? (
              <button
                onClick={() => setIsInfoModalOpen(true)}
                aria-label="설명 보기"
                className="p-1.5 rounded-full border border-gray-200 dark:border-[#444444] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-500 dark:text-gray-400 flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#1D1D1D] shadow-sm"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleToggle}
                aria-label={isCollapsed ? '설명 보기' : '설명 접기'}
                className="p-1.5 rounded-full border border-gray-200 dark:border-[#444444] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-500 dark:text-gray-400 flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#1D1D1D] shadow-sm"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            )
          )}
          {canWritePost && (
            <Link
              href={`/boards/${slug}/create`}
              aria-label="글쓰기"
              title="글쓰기"
              className="p-1.5 rounded-full border border-blue-500 dark:border-blue-500/80 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#1D1D1D] shadow-sm"
              prefetch={false}
            >
              <PenLine className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </Link>
          )}
        </div>
      </div>

      {/* 설명글 영역 (데스크톱 전용) */}
      {!isMobile && !isCollapsed && description && (
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
          <SeoSummaryCallout summary={description} plain />
        </div>
      )}

      {/* 정보 팝업 모달 (모바일 전용) */}
      {isMobile && isInfoModalOpen && description && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop 클릭 시 닫기 */}
          <div className="absolute inset-0" onClick={() => setIsInfoModalOpen(false)} />
          
          <div className="relative bg-white dark:bg-[#1D1D1D] rounded-lg max-w-sm w-full border border-gray-200 dark:border-[#333333] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-10">
            {/* 모달 헤더 */}
            <div className="h-11 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <span className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">{name} 정보</span>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1 rounded hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-500 dark:text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* 모달 본문 */}
            <div className="p-4 max-h-[300px] overflow-y-auto no-scrollbar">
              <SeoSummaryCallout summary={description} plain />
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (plain) {
    return content;
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-none md:rounded-lg border border-black/7 dark:border-0 overflow-hidden mb-4">
      {content}
    </div>
  );
}
