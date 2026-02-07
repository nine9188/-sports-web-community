'use client';

import { useState, useEffect } from 'react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

// 4590 표준: placeholder URL
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

// Overview에서 전달받는 stats 타입
interface OverviewStats {
  league?: {
    id?: number;
    name: string;
    country: string;
    logo: string;
    season: number;
  };
  fixtures?: {
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals?: {
    for: {
      total?: { total: number };
      average?: { total: string };
    };
    against: {
      total?: { total: number };
      average?: { total: string };
    };
  };
  clean_sheet?: { total: number };
  form?: string;
}

interface StatsCardsProps {
  stats: OverviewStats;
  onTabChange: (tab: string) => void;
  // 4590 표준: 이미지 Storage URL
  leagueLogoUrl?: string;
  leagueLogoDarkUrl?: string;  // 다크모드 리그 로고
}

export default function StatsCards({ stats, onTabChange, leagueLogoUrl, leagueLogoDarkUrl }: StatsCardsProps) {
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

  // 4590 표준: 다크모드 시 다크 로고 우선 사용
  const finalLeagueLogo = (isDark && leagueLogoDarkUrl) ? leagueLogoDarkUrl : (leagueLogoUrl || LEAGUE_PLACEHOLDER);

  // 안전한 데이터 접근
  const safeLeague = stats.league || {
    id: 0,
    name: '',
    country: '',
    logo: '',
    season: 0
  };

  const safeFixtures = stats.fixtures || {
    wins: { total: 0 },
    draws: { total: 0 },
    loses: { total: 0 }
  };

  const totalPlayed = safeFixtures.wins.total + safeFixtures.draws.total + safeFixtures.loses.total;

  const safeGoals = {
    for: {
      total: stats.goals?.for?.total?.total || 0,
      average: stats.goals?.for?.average?.total || '0'
    },
    against: {
      total: stats.goals?.against?.total?.total || 0,
      average: stats.goals?.against?.average?.total || '0'
    }
  };

  const safeCleanSheet = stats.clean_sheet?.total || 0;

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      {/* 기본 정보 섹션 */}
      <ContainerHeader>
        <ContainerTitle>기본 정보</ContainerTitle>
      </ContainerHeader>
      {/* 소제목 */}
      <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
        <div className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">리그 정보</div>
        <div className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">최근 5경기</div>
      </div>
      {/* 데이터 */}
      <div className="flex items-center py-3">
        {/* 리그 정보 */}
        <div className="flex-1 flex items-center justify-center gap-2 relative">
          <div className="w-6 h-6 flex-shrink-0">
            <UnifiedSportsImageClient
              src={finalLeagueLogo}
              alt={safeLeague.name || ''}
              width={24}
              height={24}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0] truncate">
              {getLeagueKoreanName(safeLeague.name) || safeLeague.name || '-'}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <span>{safeLeague.season || '-'}</span>
              <span>•</span>
              <span>{safeLeague.country || '-'}</span>
            </div>
          </div>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>

        {/* 최근 5경기 */}
        <div className="flex-1 flex items-center justify-center">
          {stats.form
            ?.split('')
            .reverse()
            .slice(0, 5)
            .map((result, index) => (
              <div
                key={index}
                className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded mx-0.5 ${
                  result === 'W' ? 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-400' :
                  result === 'D' ? 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-800/50 text-red-800 dark:text-red-400'
                }`}
              >
                {result}
              </div>
            )) || <p className="text-sm text-gray-500 dark:text-gray-400">데이터 없음</p>}
        </div>
      </div>

      {/* 시즌 통계 섹션 */}
      <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
        <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">시즌 통계</span>
      </div>
      {/* 소제목 */}
      <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
        {['경기', '승', '무', '패', '득점', '실점', '클린시트'].map((label) => (
          <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
        ))}
      </div>
      {/* 데이터 */}
      <div className="flex items-center py-3">
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {totalPlayed}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {safeFixtures.wins.total}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {safeFixtures.draws.total}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
          {safeFixtures.loses.total}
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>
        <div className="flex-1 text-center relative">
          <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.for.total}</div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.for.average})</div>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>
        <div className="flex-1 text-center relative">
          <div className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">{safeGoals.against.total}</div>
          <div className="text-[9px] text-gray-400 dark:text-gray-500">({safeGoals.against.average})</div>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-[#EAEAEA] dark:bg-[#333333]" />
        </div>
        <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
          {safeCleanSheet}
        </div>
      </div>

      {/* 자세한 통계 보기 버튼 */}
      <Button
        variant="secondary"
        onClick={() => onTabChange('stats')}
        className="w-full rounded-none rounded-b-lg border-t border-black/5 dark:border-white/10"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-medium">자세한 통계 보기</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Button>
    </Container>
  );
}
