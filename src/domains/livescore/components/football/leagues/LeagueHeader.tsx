'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import Link from 'next/link';
import { LeagueDetails } from '@/domains/livescore/actions/footballApi';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { ContainerHeader, ContainerContent } from '@/shared/components/ui';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueHeaderProps {
  league: LeagueDetails;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrl?: string;
  leagueLogoUrlDark?: string;
}

export default function LeagueHeader({ league, leagueLogoUrl, leagueLogoUrlDark }: LeagueHeaderProps) {
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
  // 한국어 리그명 매핑
  const leagueInfo = getLeagueById(league.id);
  const displayName = leagueInfo?.nameKo || league.name;

  return (
    <>
      <ContainerHeader>
        {/* 상단 네비게이션 */}
        <Link
          href="/livescore/football/leagues"
          className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors group px-2 py-1 rounded outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-bold">리그 선택</span>
        </Link>
      </ContainerHeader>

      <ContainerContent>
        <div className="flex items-center space-x-2">
          {/* 리그 로고 */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <UnifiedSportsImageClient
              src={(isDark && leagueLogoUrlDark) ? leagueLogoUrlDark : (leagueLogoUrl || LEAGUE_PLACEHOLDER)}
              alt={`${displayName} 로고`}
              width={32}
              height={32}
              className="object-contain w-8 h-8"
            />
          </div>

          {/* 리그 정보 */}
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                  {displayName}
                </h1>
                {/* 국가 플래그 */}
                {league.flag && (
                  <div className="relative w-5 h-3 flex-shrink-0">
                    <Image
                      src={league.flag}
                      alt={`${league.country} 국기`}
                      fill
                      className="object-cover rounded-sm"
                      sizes="20px"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                <span className="font-medium">{league.country}</span>
                <span className="mx-1">•</span>
                <span className="font-medium">{league.season} 시즌</span>
                {league.type && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="capitalize font-medium">{league.type}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ContainerContent>
    </>
  );
}
