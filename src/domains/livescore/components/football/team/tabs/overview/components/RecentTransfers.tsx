'use client';

import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder URLs
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
import { Container, ContainerHeader, ContainerTitle, Button } from '@/shared/components/ui';
import { TeamTransfersData } from '@/domains/livescore/actions/teams/transfers';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { formatDateDot } from '@/shared/utils/dateUtils';
import { translateTransferType as formatType } from '@/domains/livescore/utils/transferUtils';
import { PlayerKoreanNames } from '../../../TeamPageClient';
import { getPlayerSlugFromName } from '@/domains/livescore/utils/slugs';
import { playerUrl } from '@/domains/livescore/utils/urls';

interface RecentTransfersProps {
  transfers: TeamTransfersData;
  onTabChange?: (tab: string, subTab?: string) => void;
  playerKoreanNames?: PlayerKoreanNames;
  // 4590 표준: Storage URL 맵
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}


export default function RecentTransfers({ transfers, onTabChange, playerKoreanNames = {}, playerPhotoUrls = {}, teamLogoUrls = {} }: RecentTransfersProps) {
  const { getTeamDisplayName } = useTeamLeague();
  /** 팀 한글명 (매핑 없으면 원본 반환) */
  const teamName = (id: number, fallback: string): string => {
    const display = getTeamDisplayName(id);
    return display.startsWith('팀 ') ? fallback : display;
  };
  // 4590 표준: URL 조회 헬퍼
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const recentIn = transfers.in.slice(0, 5);
  const recentOut = transfers.out.slice(0, 5);

  if (recentIn.length === 0 && recentOut.length === 0) {
    return null;
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>최근 이적</ContainerTitle>
        <Link
          href="/transfers"
          className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-0.5 transition-colors"
        prefetch={false}
        >
          이적센터
          <svg
            className="w-3 h-3"
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
        </Link>
      </ContainerHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5 dark:divide-white/10">
        {/* 영입 */}
        <div>
          <div className="bg-[#F5F5F5] dark:bg-[#262626] py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
            <span className="text-blue-600 dark:text-blue-400">IN</span> 영입
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {recentIn.length > 0 ? (
              recentIn.map((transfer, index) => (
                <Link
                  key={`in-${transfer.player.id}-${index}`}
                  href={playerUrl(transfer.player.id, getPlayerSlugFromName(transfer.player.name))}
                  className="block px-3 py-2 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
                prefetch={false}
                >
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                      <UnifiedSportsImageClient
                        src={getPlayerPhoto(transfer.player.id)}
                        alt={transfer.player.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate leading-tight">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                          <div className="hidden md:block w-5 h-5 flex-shrink-0">
                            <UnifiedSportsImageClient
                              src={getTeamLogo(transfer.fromTeam.id)}
                              alt={transfer.fromTeam.name}
                              width={20}
                              height={20}
                              fit="contain"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs md:text-[13px] text-gray-500 dark:text-gray-400 truncate leading-tight flex-shrink-0 max-w-[100px]">
                            {teamName(transfer.fromTeam.id, transfer.fromTeam.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                        <span>{formatDateDot(transfer.date)}</span>
                        {formatType(transfer.type) && <span>{formatType(transfer.type)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                데이터 없음
              </div>
            )}
          </div>
        </div>

        {/* 방출 */}
        <div>
          <div className="bg-[#F5F5F5] dark:bg-[#262626] py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
            <span className="text-red-600 dark:text-red-400">OUT</span> 방출
          </div>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {recentOut.length > 0 ? (
              recentOut.map((transfer, index) => (
                <Link
                  key={`out-${transfer.player.id}-${index}`}
                  href={playerUrl(transfer.player.id, getPlayerSlugFromName(transfer.player.name))}
                  className="block px-3 py-2 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
                prefetch={false}
                >
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0">
                      <UnifiedSportsImageClient
                        src={getPlayerPhoto(transfer.player.id)}
                        alt={transfer.player.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs md:text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0] truncate leading-tight">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
                          <div className="hidden md:block w-5 h-5 flex-shrink-0">
                            <UnifiedSportsImageClient
                              src={getTeamLogo(transfer.toTeam.id)}
                              alt={transfer.toTeam.name}
                              width={20}
                              height={20}
                              fit="contain"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-xs md:text-[13px] text-gray-500 dark:text-gray-400 truncate leading-tight flex-shrink-0 max-w-[100px]">
                            {teamName(transfer.toTeam.id, transfer.toTeam.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                        <span>{formatDateDot(transfer.date)}</span>
                        {formatType(transfer.type) && <span>{formatType(transfer.type)}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
                데이터 없음
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 전체 이적 보기 버튼 */}
      {onTabChange && (
        <Button
          variant="secondary"
          onClick={() => onTabChange('transfers', 'in')}
          className="w-full rounded-none md:rounded-b-lg border-t border-black/5 dark:border-white/10"
        >
          <div className="flex items-center justify-center gap-1">
            <span className="text-[13px] font-medium">전체 이적 보기</span>
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
      )}
    </Container>
  );
}
