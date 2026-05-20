import Link from 'next/link';
import Image from 'next/image';
import type { ComponentProps } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TransfersFullDataResponse, TransferFilters } from '@/domains/livescore/actions/transfers';
import { formatTransferType } from '@/domains/livescore/types/transfers';
import { Container, ContainerHeader, ContainerTitle, Pagination } from '@/shared/components/ui';
import { TransferFilters as TransferFiltersComponent } from '@/domains/livescore/components/football/transfers';
import { getTeamsByIds } from '@/domains/livescore/actions/teamLeagueData';
import { getPlayerHref, getTeamHref } from '@/domains/livescore/utils/entityLinks';
import { normalizeDisplayImageUrl, shouldUnoptimizeImageUrl, SPORTS_PLACEHOLDERS } from '@/shared/images/urls';

// 4590 표준: Placeholder URL
const PLAYER_PLACEHOLDER = SPORTS_PLACEHOLDERS.players;
const TEAM_PLACEHOLDER = SPORTS_PLACEHOLDERS.teams;

// 모바일용 간단한 이적 타입 포맷터
const formatTransferTypeMobile = (type: string): string => {
  if (!type || type === 'N/A') return '정보없음';

  const originalType = type.trim();
  const lowerType = originalType.toLowerCase();

  if (lowerType === 'free transfer' || lowerType === 'free') return '자유';
  if (lowerType === 'free agent') return '자유계약';
  if (lowerType === 'raise') return '승격';
  if (lowerType === 'return from loan' || lowerType.includes('return from loan')) return '임대복귀';

  // 금액이 포함된 경우
  if (originalType.match(/[€$£¥₩]/)) {
    if (originalType.includes('€')) {
      const euroMatch = originalType.match(/€\s*([\d.,]+)\s*M?/i);
      if (euroMatch) return `€${euroMatch[1]}M`;
    } else if (originalType.includes('$')) {
      const dollarMatch = originalType.match(/\$\s*([\d.,]+)\s*M?/i);
      if (dollarMatch) return `$${dollarMatch[1]}M`;
    } else if (originalType.includes('£')) {
      const poundMatch = originalType.match(/£\s*([\d.,]+)\s*M?/i);
      if (poundMatch) return `£${poundMatch[1]}M`;
    }
    return originalType;
  }

  if (lowerType === 'loan') return '임대';
  if (lowerType === 'permanent') return '완전';
  if (lowerType === 'transfer') return '이적';
  if (lowerType === 'return') return '복귀';
  if (lowerType === 'back from loan') return '임대복귀';

  return originalType;
};

// 4590 표준: 팀 로고 컴포넌트 (서버에서 전달받은 Storage URL 사용)
function TeamLogo({ teamName, logoUrl, size = 20 }: { teamName: string; logoUrl?: string; size?: number }) {
  const sizeClass = size === 20 ? 'w-5 h-5' : size === 24 ? 'w-6 h-6' : `w-${Math.floor(size / 4)} h-${Math.floor(size / 4)}`;
  const src = normalizeDisplayImageUrl(logoUrl, {
    fallback: TEAM_PLACEHOLDER,
    proxyExternal: true,
  });

  return (
    <div className={`${sizeClass} flex-shrink-0 relative transform-gpu`}>
      <Image
        src={src}
        alt={teamName || '팀'}
        width={size}
        height={size}
        unoptimized={shouldUnoptimizeImageUrl(src)}
        className={`object-contain ${sizeClass} rounded`}
      />
    </div>
  );
}

interface TransfersPageContentProps {
  initialData: TransfersFullDataResponse;
  playerKoreanNames: Record<number, string>;
  playerPhotoUrls: Record<number, string>;
  teamLogoUrls: Record<number, string>;
  currentFilters: TransferFilters;
  leagueTeamGroups?: ComponentProps<typeof TransferFiltersComponent>['leagueTeamGroups'];
}

export default async function TransfersPageContent({
  initialData,
  playerKoreanNames,
  playerPhotoUrls,
  teamLogoUrls,
  currentFilters,
  leagueTeamGroups
}: TransfersPageContentProps) {
  const { transfers, totalCount, currentPage, totalPages, success } = initialData;

  // 팀 한글명 일괄 조회 (DB)
  const allTeamIds = Array.from(new Set(transfers.flatMap(t => [
    t.transfers[0]?.teams?.in?.id,
    t.transfers[0]?.teams?.out?.id,
  ]).filter((id): id is number => typeof id === 'number')));
  const teamMap = allTeamIds.length > 0 ? await getTeamsByIds(allTeamIds) : {};
  const getTeamDisplayName = (id: number): string => teamMap[id]?.name_ko || `팀 ${id}`;

  if (!success) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">오류가 발생했습니다</h3>
          <p className="text-red-600 mb-4">{initialData.message}</p>
          <Link
            href="/transfers"
            className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          prefetch={false}
          >
            다시 시도
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-0">
      {/* 필터 섹션 */}
      <div data-nosnippet>
        <TransferFiltersComponent currentFilters={currentFilters} leagueTeamGroups={leagueTeamGroups} />
      </div>

      {/* 이적 목록 */}
      {transfers.length === 0 ? (
        <Container data-nosnippet>
          <ContainerHeader>
            <div className="flex items-center justify-between w-full">
              <ContainerTitle>이적 목록</ContainerTitle>
              <span className="text-xs text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">
                0건
              </span>
            </div>
          </ContainerHeader>
          <div className="bg-white dark:bg-[#1D1D1D] p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              이적 목록이 없습니다.
            </div>
          </div>
        </Container>
      ) : (
        <Container data-nosnippet>
          {/* 헤더 */}
          <ContainerHeader>
            <div className="flex items-center justify-between w-full">
              <ContainerTitle>이적 목록</ContainerTitle>
              <span className="text-xs text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">
                총 {totalCount}건
              </span>
            </div>
          </ContainerHeader>

          <div className="hidden grid-cols-[28%_38%_16%_18%] border-b border-black/5 bg-[#F5F5F5] text-xs font-medium uppercase tracking-wider text-gray-700 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300 md:grid">
            <div className="px-3 py-3">선수</div>
            <div className="px-3 py-3">이적 경로</div>
            <div className="px-3 py-3">이적료/타입</div>
            <div className="px-3 py-3">날짜</div>
          </div>

          <div className="divide-y divide-black/5 bg-white dark:divide-white/10 dark:bg-[#1D1D1D]">
            {transfers.map((transfer, index) => {
              const latestTransfer = transfer.transfers[0];
              const transferDate = new Date(latestTransfer.date);
              const playerName = playerKoreanNames[transfer.player.id] || transfer.player.name;
              const outTeamName = (() => {
                const displayName = getTeamDisplayName(latestTransfer.teams.out.id);
                return displayName.startsWith('팀 ') ? latestTransfer.teams.out.name : displayName;
              })();
              const inTeamName = (() => {
                const displayName = getTeamDisplayName(latestTransfer.teams.in.id);
                return displayName.startsWith('팀 ') ? latestTransfer.teams.in.name : displayName;
              })();
              const playerPhoto = normalizeDisplayImageUrl(playerPhotoUrls[transfer.player.id], {
                fallback: PLAYER_PLACEHOLDER,
                proxyExternal: true,
              });

              return (
                <div
                  key={`${transfer.player.id}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-2 p-3 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] md:grid-cols-[28%_38%_16%_18%] md:items-center md:gap-0 md:py-3"
                >
                  <div className="flex min-w-0 items-center space-x-2">
                    <div className="relative h-8 w-8 flex-shrink-0 md:h-9 md:w-9">
                      <Image
                        src={playerPhoto}
                        alt={`${transfer.player.name} 사진`}
                        width={36}
                        height={36}
                        unoptimized={shouldUnoptimizeImageUrl(playerPhoto)}
                        className="h-8 w-8 rounded-full border border-gray-200 bg-gray-50 object-cover md:h-9 md:w-9 md:border-2"
                      />
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={getPlayerHref(transfer.player)}
                        prefetch={false}
                        className={`${playerName.length > 15 ? 'text-xs' : 'text-[13px]'} block truncate font-semibold text-gray-900 transition-colors hover:underline dark:text-[#F0F0F0] md:font-medium`}
                      >
                        {playerName}
                      </Link>
                      {transfer.player.nationality && (
                        <span className="text-xs text-gray-700 dark:text-gray-300 md:hidden">
                          {transfer.player.nationality}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-700 dark:text-gray-300 md:order-4 md:px-3 md:text-[13px]">
                    <span className="md:hidden">{format(transferDate, 'MM/dd', { locale: ko })}</span>
                    <span className="hidden md:inline">{latestTransfer.date || 'N/A'}</span>
                  </div>

                  <div className="col-start-1 row-start-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 md:order-2 md:col-auto md:row-auto md:px-3">
                    <div className="flex min-w-0 items-center space-x-1">
                      <TeamLogo teamName={latestTransfer.teams.out.name} logoUrl={teamLogoUrls[latestTransfer.teams.out.id]} size={20} />
                      <Link
                        href={getTeamHref(latestTransfer.teams.out)}
                        className="truncate text-xs text-gray-700 transition-colors hover:underline dark:text-gray-300 md:text-[13px]"
                        title={latestTransfer.teams.out.name}
                      prefetch={false}
                      >
                        {outTeamName}
                      </Link>
                    </div>

                    <svg className="h-3 w-3 flex-shrink-0 text-gray-400 md:h-3.5 md:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    <div className="flex min-w-0 items-center space-x-1">
                      <TeamLogo teamName={latestTransfer.teams.in.name} logoUrl={teamLogoUrls[latestTransfer.teams.in.id]} size={20} />
                      <Link
                        href={getTeamHref(latestTransfer.teams.in)}
                        className="truncate text-xs text-gray-900 transition-colors hover:underline dark:text-[#F0F0F0] md:text-[13px] md:font-medium"
                        title={latestTransfer.teams.in.name}
                      prefetch={false}
                      >
                        {inTeamName}
                      </Link>
                    </div>
                  </div>

                  <div className="col-start-2 row-start-2 ml-2 flex w-16 justify-end md:order-3 md:col-auto md:row-auto md:ml-0 md:w-auto md:px-3 md:justify-start">
                    {latestTransfer.type && latestTransfer.type !== 'N/A' && (
                      <span className="inline-flex min-w-0 rounded-full bg-[#F5F5F5] px-1.5 py-0.5 text-center text-xs font-medium text-gray-900 dark:bg-[#262626] dark:text-[#F0F0F0] md:px-2 md:py-1">
                        <span className="md:hidden">{formatTransferTypeMobile(latestTransfer.type)}</span>
                        <span className="hidden md:inline">{formatTransferType(latestTransfer.type)}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          mode="url"
          withMargin={false}
        />
      )}
    </div>
  );
}
