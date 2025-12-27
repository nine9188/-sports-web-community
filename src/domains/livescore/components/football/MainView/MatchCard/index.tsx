'use client';

import Link from 'next/link';
import { Match } from '@/domains/livescore/types/match';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

interface MatchCardProps {
  match: Match;
  isLast?: boolean;
}

export default function MatchCard({ match, isLast = false }: MatchCardProps) {
  const homeTeam = {
    id: match.teams?.home?.id || 0,
    name: match.teams?.home?.name || '',
    score: match.teams?.home?.score ?? 0
  };

  const awayTeam = {
    id: match.teams?.away?.id || 0,
    name: match.teams?.away?.name || '',
    score: match.teams?.away?.score ?? 0
  };

  const statusCode = match.status?.code || '';
  const elapsed = match.status?.elapsed || 0;

  const getStatusDisplay = () => {
    if (statusCode === 'LIVE' || statusCode === '1H' || statusCode === '2H') {
      return elapsed > 0 ? `${elapsed}'` : 'LIVE';
    }
    if (statusCode === 'HT') return 'HT';
    if (statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN') return 'FT';
    if (statusCode === 'NS' || statusCode === 'TBD') {
      return new Date(match.time?.date ?? 0).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul'
      });
    }
    return statusCode;
  };

  const isLive = statusCode === 'LIVE' || statusCode === '1H' || statusCode === '2H' || statusCode === 'HT';

  const getScore = (isHome: boolean) => {
    if (statusCode === 'NS' || statusCode === 'TBD') return '-';
    return isHome ? homeTeam.score : awayTeam.score;
  };

  return (
    <Link
      href={`/livescore/football/match/${match.id}`}
      className={`
        flex items-center h-14 px-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors
        ${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}
      `}
    >
      {/* 경기 상태 */}
      <div className="w-12 flex-shrink-0">
        {isLive ? (
          <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded animate-pulse">
            LIVE
          </span>
        ) : (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">
            {getStatusDisplay()}
          </span>
        )}
      </div>

      {/* 홈팀 정보 */}
      <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 px-3">
        <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate text-right">
          {homeTeam.name}
        </span>
        {homeTeam.id > 0 && (
          <div className="w-6 h-6 flex-shrink-0 relative">
            <UnifiedSportsImage
              imageId={homeTeam.id}
              imageType={ImageType.Teams}
              alt={homeTeam.name}
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          </div>
        )}
      </div>

      {/* 스코어 */}
      <div className="px-4 flex-shrink-0">
        <span className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0]">
          {getScore(true)} - {getScore(false)}
        </span>
      </div>

      {/* 원정팀 정보 */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0 px-3">
        {awayTeam.id > 0 && (
          <div className="w-6 h-6 flex-shrink-0 relative">
            <UnifiedSportsImage
              imageId={awayTeam.id}
              imageType={ImageType.Teams}
              alt={awayTeam.name}
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
          </div>
        )}
        <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
          {awayTeam.name}
        </span>
      </div>
    </Link>
  );
} 