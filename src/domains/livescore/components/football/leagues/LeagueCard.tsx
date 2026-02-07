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
      className="group flex flex-col items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors p-2 lg:p-3"
    >
      <UnifiedSportsImageClient
        src={effectiveLogoUrl || LEAGUE_PLACEHOLDER}
        alt={`${name} 로고`}
        width={40}
        height={40}
        className="w-7 h-7 lg:w-10 lg:h-10 object-contain"
      />
      <h3 className="mt-1 lg:mt-2 text-[9px] lg:text-xs font-medium text-gray-900 dark:text-[#F0F0F0] text-center leading-tight line-clamp-2">
        {name}
      </h3>
    </Link>
  );
}
