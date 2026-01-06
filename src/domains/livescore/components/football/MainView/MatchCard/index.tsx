'use client';

import Link from 'next/link';
import { Match } from '@/domains/livescore/types/match';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

// 경기 상태 한글 매핑
const STATUS_MAP: Record<string, { label: string; isLive: boolean }> = {
  // 진행 중 (빨간색)
  'LIVE': { label: '진행중', isLive: true },
  '1H': { label: '전반전', isLive: true },
  '2H': { label: '후반전', isLive: true },
  'HT': { label: '하프타임', isLive: true },
  'ET': { label: '연장전', isLive: true },
  'BT': { label: '휴식', isLive: true },
  'P': { label: '승부차기', isLive: true },
  'SUSP': { label: '중단', isLive: true },
  'INT': { label: '중단', isLive: true },
  'IN_PLAY': { label: '진행중', isLive: true },
  // 종료 (회색)
  'FT': { label: '종료', isLive: false },
  'AET': { label: '연장종료', isLive: false },
  'PEN': { label: '승부차기종료', isLive: false },
  'AWD': { label: '몰수승', isLive: false },
  'WO': { label: '부전승', isLive: false },
  // 시작 전 (회색)
  'NS': { label: '예정', isLive: false },
  'TBD': { label: '미정', isLive: false },
  'PST': { label: '연기', isLive: false },
  'CANC': { label: '취소', isLive: false },
  'ABD': { label: '중단', isLive: false },
};

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

  // 상태 정보 가져오기
  const getStatusInfo = (): { label: string; isLive: boolean } => {
    // 진행 중인 경기에서 경과 시간이 있으면 시간 표시
    if ((statusCode === 'LIVE' || statusCode === '1H' || statusCode === '2H' || statusCode === 'IN_PLAY') && elapsed > 0) {
      return { label: `${elapsed}'`, isLive: true };
    }
    // NS, TBD는 시간 표시 (STATUS_MAP보다 먼저 체크)
    if (statusCode === 'NS' || statusCode === 'TBD') {
      const timeStr = new Date(match.time?.date ?? 0).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul'
      });
      return { label: timeStr, isLive: false };
    }
    // STATUS_MAP에서 확인
    if (STATUS_MAP[statusCode]) {
      return STATUS_MAP[statusCode];
    }
    return { label: statusCode, isLive: false };
  };

  const statusInfo = getStatusInfo();

  const getScore = (isHome: boolean) => {
    if (statusCode === 'NS' || statusCode === 'TBD') return '-';
    return isHome ? homeTeam.score : awayTeam.score;
  };

  return (
    <Link
      href={`/livescore/football/match/${match.id}`}
      className={`
        flex items-center h-12 px-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors
        ${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}
      `}
    >
      {/* 경기 상태 */}
      <div className="w-14 flex-shrink-0 flex items-center">
        {statusInfo.isLive ? (
          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-1 rounded animate-pulse whitespace-nowrap">
            {statusInfo.label}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-1.5 py-1 rounded whitespace-nowrap">
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* 홈팀 정보 */}
      <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate text-right">
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
      <div className="px-2 flex-shrink-0">
        <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
          {getScore(true)} - {getScore(false)}
        </span>
      </div>

      {/* 원정팀 정보 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
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
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
          {awayTeam.name}
        </span>
      </div>
    </Link>
  );
} 