'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenLine, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { leagueUrl } from '@/domains/livescore/utils/urls';
import SeoSummaryCallout from '@/shared/components/SeoSummaryCallout';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  type?: string;
}

interface Breadcrumb {
  id: string;
  name: string;
  slug?: string;
}

interface LeagueInfoProps {
  leagueData: LeagueData | null;
  boardId: string;
  boardSlug?: string;
  isLoggedIn?: boolean;
  className?: string;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrl?: string;
  leagueLogoUrlDark?: string;
  description?: string | null;
  breadcrumbs?: Breadcrumb[];
}

export default function LeagueInfo({
  leagueData,
  boardId,
  boardSlug,
  isLoggedIn = false,
  className = '',
  leagueLogoUrl,
  leagueLogoUrlDark,
  description,
  breadcrumbs,
}: LeagueInfoProps) {
  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (window.innerWidth >= 768) {
      const saved = localStorage.getItem(`4590_board_desc_collapsed_${boardId}`);
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      } else {
        setIsCollapsed(false);
      }
    } else {
      setIsCollapsed(true);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkMobile);
    };
  }, [boardId]);

  const handleToggle = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem(`4590_board_desc_collapsed_${boardId}`, String(nextState));
  };

  // 다크모드에 맞는 로고 URL 선택
  const effectiveLogoUrl = isDark && leagueLogoUrlDark
    ? leagueLogoUrlDark
    : (leagueLogoUrl || LEAGUE_PLACEHOLDER);

  // 데이터가 없으면 기본 UI 반환
  if (!leagueData) {
    return (
      <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${className}`}>
        <p className="text-[13px] text-gray-500 dark:text-gray-400">리그 정보를 불러올 수 없습니다.</p>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-1.5 rounded-full border border-blue-500 dark:border-blue-500/80 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#1D1D1D] shadow-sm"
            prefetch={false}
          >
            <PenLine className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${!isMobile && !isCollapsed && description ? 'border-b border-black/5 dark:border-white/10' : ''} ${className}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          {/* 리그 로고 */}
          <div className="relative w-6 h-6 flex-shrink-0">
            <UnifiedSportsImageClient
              src={effectiveLogoUrl}
              alt={`${leagueData.name} logo`}
              width={24}
              height={24}
              className="object-contain w-6 h-6"
            />
          </div>
          <span className="text-[13px] font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{leagueData.name}</span>
          
          <Link
            href={leagueUrl(leagueData.id, getLeagueSlug(leagueData.id, leagueData.name))}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors flex-shrink-0"
            prefetch={false}
          >
            리그 정보 →
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          {isLoggedIn && (
            <Link
              href={`/boards/${boardSlug || boardId}/create`}
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
              <span className="text-xs font-semibold text-gray-900 dark:text-[#F0F0F0]">{leagueData.name} 정보</span>
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
}
