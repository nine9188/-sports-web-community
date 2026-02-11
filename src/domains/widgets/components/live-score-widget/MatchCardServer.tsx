import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import type { Match } from './types';

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

// 상태 정보 가져오기
function getStatusInfo(
  status: string,
  elapsed?: number,
  kickoffTime?: string,
  dateLabel?: 'today' | 'tomorrow'
): { label: string; isLive: boolean; subLabel?: string } {
  // 진행 중인 경기에서 경과 시간이 있으면 시간 표시
  const liveStatuses = ['LIVE', '1H', '2H', 'ET', 'P', 'IN_PLAY'];
  if (liveStatuses.includes(status) && elapsed && elapsed > 0) {
    return { label: `${elapsed}'`, isLive: true };
  }
  // STATUS_MAP에서 확인
  if (STATUS_MAP[status]) {
    const statusInfo = STATUS_MAP[status];
    // 예정 경기인 경우
    if (status === 'NS') {
      // 내일 경기
      if (dateLabel === 'tomorrow') {
        return {
          label: kickoffTime || '예정',
          isLive: false,
          subLabel: '내일'
        };
      }
      // 오늘 경기면 시간 또는 "예정"
      if (kickoffTime) {
        return {
          label: kickoffTime,
          isLive: false
        };
      }
    }
    return statusInfo;
  }
  // 숫자로만 이루어진 경우 시간 표시 (예: "45", "90+3")
  if (/^\d+(\+\d+)?$/.test(status)) {
    return { label: `${status}'`, isLive: true };
  }
  return { label: status, isLive: false };
}

interface MatchCardServerProps {
  match: Match;
  isLast: boolean;
  /** 첫 번째 리그 이미지에 eager/priority 적용 (LCP 최적화) */
  priorityImages?: boolean;
}

/**
 * 경기 카드 서버 컴포넌트
 *
 * - 개별 경기 정보를 서버에서 렌더링
 * - LCP 최적화: 초기 HTML에 경기 정보 포함
 */
export default function MatchCardServer({ match, isLast, priorityImages = false }: MatchCardServerProps) {
  const statusInfo = getStatusInfo(match.status, match.elapsed, match.kickoffTime, match.dateLabel);

  return (
    <Link
      href={`/livescore/football/match/${match.id}`}
      prefetch={false}
      className={`
        flex items-center h-12 px-4 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors
        ${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}
      `}
    >
      {/* 경기 상태 */}
      <div className="w-20 flex-shrink-0 flex items-center gap-1">
        {statusInfo.isLive ? (
          <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-1 rounded animate-pulse whitespace-nowrap">
            {statusInfo.label}
          </span>
        ) : (
          <>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] px-1.5 py-1 rounded whitespace-nowrap">
              {statusInfo.label}
            </span>
            {statusInfo.subLabel && (
              <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {statusInfo.subLabel}
              </span>
            )}
          </>
        )}
      </div>

      {/* 홈팀 정보 */}
      <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate text-right">
          {match.homeTeam.name}
        </span>
        {match.homeTeam.logo && (
          <div className="w-6 h-6 flex-shrink-0 relative">
            <UnifiedSportsImageClient
              src={match.homeTeam.logo}
              alt={match.homeTeam.name}
              width={24}
              height={24}
              priority={priorityImages}
              className="w-6 h-6 object-contain"
            />
          </div>
        )}
      </div>

      {/* 스코어 */}
      <div className="px-2 flex-shrink-0">
        <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
          {match.score.home} - {match.score.away}
        </span>
      </div>

      {/* 원정팀 정보 */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {match.awayTeam.logo && (
          <div className="w-6 h-6 flex-shrink-0 relative">
            <UnifiedSportsImageClient
              src={match.awayTeam.logo}
              alt={match.awayTeam.name}
              width={24}
              height={24}
              priority={priorityImages}
              className="w-6 h-6 object-contain"
            />
          </div>
        )}
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
          {match.awayTeam.name}
        </span>
      </div>
    </Link>
  );
}
