'use client';

import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { useDarkMode } from '@/shared/hooks/useDarkMode';
import type { WidgetLeague } from './types';

// 4590 표준: placeholder 상수
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface LeagueHeaderProps {
  league: WidgetLeague;
}

/**
 * 리그 헤더 클라이언트 컴포넌트
 *
 * - 다크모드에 따라 적절한 리그 로고 표시
 * - 4590 표준: 서버에서 전달받은 Storage URL 사용
 */
export default function LeagueHeader({ league }: LeagueHeaderProps) {
  const isDark = useDarkMode();

  // 다크모드에 따른 리그 로고 URL 선택
  const effectiveLogoUrl = isDark && league.logoDark ? league.logoDark : league.logo;

  return (
    <div className="flex items-center gap-3">
      {effectiveLogoUrl ? (
        <UnifiedSportsImageClient
          src={effectiveLogoUrl}
          alt={league.name}
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
      ) : league.icon ? (
        <span className="text-lg">{league.icon}</span>
      ) : null}
      <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
        {league.name}
      </span>
    </div>
  );
}
