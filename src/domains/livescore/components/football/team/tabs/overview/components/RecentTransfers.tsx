'use client';

import { useRouter } from 'next/navigation';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 4590 표준: placeholder URLs
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
import { Container, ContainerHeader, ContainerTitle, Button } from '@/shared/components/ui';
import { TeamTransfersData } from '@/domains/livescore/actions/teams/transfers';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';
import { PlayerKoreanNames } from '../../../TeamPageClient';

interface RecentTransfersProps {
  transfers: TeamTransfersData;
  onTabChange?: (tab: string, subTab?: string) => void;
  playerKoreanNames?: PlayerKoreanNames;
  // 4590 표준: Storage URL 맵
  playerPhotoUrls?: Record<number, string>;
  teamLogoUrls?: Record<number, string>;
}

/** YYYY-MM-DD → YYYY.MM.DD (타임존 이슈 방지를 위해 문자열 직접 분리) */
function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/** 이적 타입 한국어 변환 */
function formatType(type: string): string {
  if (!type || type === 'N/A') return '';
  const lower = type.trim().toLowerCase();
  if (lower === 'free transfer' || lower === 'free') return '자유이적';
  if (lower === 'free agent') return '자유계약';
  if (lower === 'loan') return '임대';
  if (lower === 'return from loan' || lower.includes('return from loan')) return '임대복귀';
  if (lower.includes('end of loan')) return '임대종료';
  if (lower === 'permanent') return '완전이적';
  if (lower === 'transfer') return '이적';
  if (lower === 'return') return '복귀';
  if (lower === 'raise') return '승격';
  // 금액 포함된 경우 (€25M 등) 그대로 표시
  if (type.match(/[€$£]/)) return type.trim();
  return type.trim();
}

/** 팀 한글명 (매핑 없으면 원본 반환) */
function teamName(id: number, fallback: string): string {
  const display = getTeamDisplayName(id);
  // getTeamDisplayName은 매핑 없으면 "팀 {id}" 반환
  return display.startsWith('팀 ') ? fallback : display;
}

export default function RecentTransfers({ transfers, onTabChange, playerKoreanNames = {}, playerPhotoUrls = {}, teamLogoUrls = {} }: RecentTransfersProps) {
  const router = useRouter();

  // 4590 표준: URL 조회 헬퍼
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  // 선수 페이지로 이동
  const handlePlayerClick = (playerId: number) => {
    router.push(`/livescore/football/player/${playerId}`);
  };
  const recentIn = transfers.in.slice(0, 3);
  const recentOut = transfers.out.slice(0, 3);

  if (recentIn.length === 0 && recentOut.length === 0) {
    return null;
  }

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>최근 이적</ContainerTitle>
        <button
          onClick={() => router.push('/transfers')}
          className="ml-auto text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-0.5 transition-colors"
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
        </button>
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
                <div
                  key={`in-${transfer.player.id}-${index}`}
                  className="px-3 py-2 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
                  onClick={() => handlePlayerClick(transfer.player.id)}
                >
                  {/* 데스크톱: 가로 레이아웃 */}
                  <div className="hidden md:flex gap-2">
                    <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0 self-center">
                      <UnifiedSportsImageClient
                        src={getPlayerPhoto(transfer.player.id)}
                        alt={transfer.player.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-5 h-5 flex-shrink-0">
                            <UnifiedSportsImageClient
                              src={getTeamLogo(transfer.fromTeam.id)}
                              alt={transfer.fromTeam.name}
                              width={20}
                              height={20}
                              fit="contain"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                            {teamName(transfer.fromTeam.id, transfer.fromTeam.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatDate(transfer.date)}
                        </span>
                        {formatType(transfer.type) && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {formatType(transfer.type)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 모바일: 이미지 왼쪽, 텍스트 오른쪽 세로 배치 */}
                  <div className="md:hidden flex gap-2">
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
                        <p className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0] truncate leading-tight">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight flex-shrink-0 max-w-[100px]">
                          {teamName(transfer.fromTeam.id, transfer.fromTeam.name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                        <span>{formatDate(transfer.date)}</span>
                        {formatType(transfer.type) && <span>{formatType(transfer.type)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
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
                <div
                  key={`out-${transfer.player.id}-${index}`}
                  className="px-3 py-2 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
                  onClick={() => handlePlayerClick(transfer.player.id)}
                >
                  {/* 데스크톱: 가로 레이아웃 */}
                  <div className="hidden md:flex gap-2">
                    <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#333333] rounded-full overflow-hidden flex-shrink-0 self-center">
                      <UnifiedSportsImageClient
                        src={getPlayerPhoto(transfer.player.id)}
                        alt={transfer.player.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-5 h-5 flex-shrink-0">
                            <UnifiedSportsImageClient
                              src={getTeamLogo(transfer.toTeam.id)}
                              alt={transfer.toTeam.name}
                              width={20}
                              height={20}
                              fit="contain"
                              className="w-full h-full"
                            />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                            {teamName(transfer.toTeam.id, transfer.toTeam.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatDate(transfer.date)}
                        </span>
                        {formatType(transfer.type) && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {formatType(transfer.type)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 모바일: 이미지 왼쪽, 텍스트 오른쪽 세로 배치 */}
                  <div className="md:hidden flex gap-2">
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
                        <p className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0] truncate leading-tight">
                          {playerKoreanNames[transfer.player.id] || transfer.player.name}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight flex-shrink-0 max-w-[100px]">
                          {teamName(transfer.toTeam.id, transfer.toTeam.name)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                        <span>{formatDate(transfer.date)}</span>
                        {formatType(transfer.type) && <span>{formatType(transfer.type)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
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
            <span className="text-sm font-medium">전체 이적 보기</span>
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
