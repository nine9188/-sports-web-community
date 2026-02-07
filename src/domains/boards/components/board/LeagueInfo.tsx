'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  type?: string;
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
}

export default function LeagueInfo({ leagueData, boardId, boardSlug, isLoggedIn = false, className = '', leagueLogoUrl, leagueLogoUrlDark }: LeagueInfoProps) {
  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);

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
    return () => observer.disconnect();
  }, []);

  // 다크모드에 맞는 로고 URL 선택
  const effectiveLogoUrl = isDark && leagueLogoUrlDark
    ? leagueLogoUrlDark
    : (leagueLogoUrl || LEAGUE_PLACEHOLDER);
  // 데이터가 없으면 기본 UI 반환
  if (!leagueData) {
    return (
      <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">리그 정보를 불러올 수 없습니다.</p>
        {isLoggedIn && (
          <Link
            href={`/boards/${boardSlug || boardId}/create`}
            aria-label="글쓰기"
            title="글쓰기"
            className="p-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
          >
            <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
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
        <span className="text-sm font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{leagueData.name}</span>
      </div>
      {isLoggedIn && (
        <Link
          href={`/boards/${boardSlug || boardId}/create`}
          aria-label="글쓰기"
          title="글쓰기"
          className="p-2 rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
        >
          <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
        </Link>
      )}
    </div>
  );
} 
