'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueCardProps {
  leagueId: number;
  name: string;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrl?: string;
  leagueLogoDarkUrl?: string;  // 다크모드 리그 로고
}

export default function LeagueCard({ leagueId, name, leagueLogoUrl, leagueLogoDarkUrl }: LeagueCardProps) {
  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 초기 다크모드 상태 확인
    setIsDark(document.documentElement.classList.contains('dark'));

    // 다크모드 변경 감지
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

  // 다크모드에 따른 리그 로고 URL 선택
  const effectiveLogoUrl = isDark && leagueLogoDarkUrl ? leagueLogoDarkUrl : leagueLogoUrl;

  return (
    <Link
      href={`/livescore/football/leagues/${leagueId}`}
      className="group flex flex-col items-center rounded-md hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors p-2 pb-2.5 border-b border-dashed border-gray-300 dark:border-gray-600"
    >
      <UnifiedSportsImageClient
        src={effectiveLogoUrl || LEAGUE_PLACEHOLDER}
        alt={`${name} 로고`}
        width={36}
        height={36}
        className="w-8 h-8 lg:w-9 lg:h-9 object-contain"
      />
      <h3 className="mt-1.5 text-[11px] lg:text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight line-clamp-2 break-keep">
        {name}
      </h3>
    </Link>
  );
}
