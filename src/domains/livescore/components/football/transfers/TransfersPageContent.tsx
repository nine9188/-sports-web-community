import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TransfersFullDataResponse, TransferFilters } from '@/domains/livescore/actions/transfers';
import { formatTransferType } from '@/domains/livescore/types/transfers';
import { Container, ContainerHeader, ContainerTitle, Pagination } from '@/shared/components/ui';
import { TransferFilters as TransferFiltersComponent } from '@/domains/livescore/components/football/transfers';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';

// 4590 표준: Placeholder URL
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

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
  const src = logoUrl || TEAM_PLACEHOLDER;

  return (
    <div className={`${sizeClass} flex-shrink-0 relative transform-gpu`}>
      <Image
        src={src}
        alt={teamName || '팀'}
        width={size}
        height={size}
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
}

export default function TransfersPageContent({
  initialData,
  playerKoreanNames,
  playerPhotoUrls,
  teamLogoUrls,
  currentFilters
}: TransfersPageContentProps) {
  const { transfers, totalCount, currentPage, totalPages, success } = initialData;

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
      <TransferFiltersComponent currentFilters={currentFilters} />

      {/* 이적 목록 */}
      {transfers.length === 0 ? (
        <Container>
          <ContainerHeader>
            <div className="flex items-center justify-between w-full">
              <ContainerTitle>이적 목록</ContainerTitle>
              <span className="text-xs text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">
                0건
              </span>
            </div>
          </ContainerHeader>
          <div className="text-center py-12 bg-white dark:bg-[#1D1D1D]">
            <div className="text-gray-700 dark:text-gray-300 text-lg mb-2">
              이적 정보를 찾을 수 없습니다
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              필터를 조정하여 다시 시도해보세요
            </div>
          </div>
        </Container>
      ) : (
        <Container>
          {/* 헤더 */}
          <ContainerHeader>
            <div className="flex items-center justify-between w-full">
              <ContainerTitle>이적 목록</ContainerTitle>
              <span className="text-xs text-gray-700 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] px-2 py-1 rounded">
                총 {totalCount}건
              </span>
            </div>
          </ContainerHeader>

          {/* 데스크탑 테이블 */}
          <div className="hidden md:block bg-white dark:bg-[#1D1D1D]">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[38%]" />
                <col className="w-[16%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">선수</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">이적 경로</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">이적료/타입</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">날짜</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/5 dark:divide-white/10">
                {transfers.map((transfer, index) => (
                  <tr key={`${transfer.player.id}-${index}`} className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                    {/* 선수 정보 - 4590 표준: 서버에서 전달받은 Storage URL 사용 */}
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 w-9 h-9 relative">
                          <Image
                            src={playerPhotoUrls[transfer.player.id] || PLAYER_PLACEHOLDER}
                            alt={`${transfer.player.name} 사진`}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover border-2 border-gray-200 bg-gray-50"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/livescore/football/player/${transfer.player.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] hover:underline transition-colors truncate block"
                          >
                            {playerKoreanNames[transfer.player.id] || transfer.player.name}
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* 이적 경로 */}
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center space-x-1 min-w-0 flex-1">
                          <TeamLogo
                            teamName={transfer.transfers[0]?.teams?.out?.name || 'Unknown'}
                            logoUrl={teamLogoUrls[transfer.transfers[0]?.teams?.out?.id || 0]}
                            size={20}
                          />
                          <Link
                            href={`/livescore/football/team/${transfer.transfers[0]?.teams?.out?.id}`}
                            className="text-sm text-gray-700 dark:text-gray-300 hover:underline transition-colors truncate"
                          >
                            {(() => {
                              const teamId = transfer.transfers[0]?.teams?.out?.id || 0;
                              const displayName = getTeamDisplayName(teamId);
                              return displayName.startsWith('팀 ') ? transfer.transfers[0]?.teams?.out?.name || 'Unknown' : displayName;
                            })()}
                          </Link>
                        </div>

                        <div className="flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>

                        <div className="flex items-center space-x-1 min-w-0 flex-1">
                          <TeamLogo
                            teamName={transfer.transfers[0]?.teams?.in?.name || 'Unknown'}
                            logoUrl={teamLogoUrls[transfer.transfers[0]?.teams?.in?.id || 0]}
                            size={20}
                          />
                          <Link
                            href={`/livescore/football/team/${transfer.transfers[0]?.teams?.in?.id}`}
                            className="text-sm text-gray-900 dark:text-[#F0F0F0] hover:underline transition-colors truncate font-medium"
                          >
                            {(() => {
                              const teamId = transfer.transfers[0]?.teams?.in?.id || 0;
                              const displayName = getTeamDisplayName(teamId);
                              return displayName.startsWith('팀 ') ? transfer.transfers[0]?.teams?.in?.name || 'Unknown' : displayName;
                            })()}
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* 이적료/타입 */}
                    <td className="px-3 py-3">
                      {transfer.transfers[0]?.type && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">
                          {formatTransferType(transfer.transfers[0].type)}
                        </span>
                      )}
                    </td>

                    {/* 날짜 */}
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {transfer.transfers[0]?.date || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 레이아웃 */}
          <div className="block md:hidden divide-y divide-black/5 dark:divide-white/10 bg-white dark:bg-[#1D1D1D]">
            {transfers.map((transfer, index) => {
              const latestTransfer = transfer.transfers[0];
              const transferDate = new Date(latestTransfer.date);

              return (
                <div key={`${transfer.player.id}-${index}`} className="p-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                  {/* 첫 번째 줄 - 4590 표준: 서버에서 전달받은 Storage URL 사용 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 relative">
                        <Image
                          src={playerPhotoUrls[transfer.player.id] || PLAYER_PLACEHOLDER}
                          alt={`${transfer.player.name} 사진`}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 bg-gray-50"
                        />
                      </div>

                      <Link
                        href={`/livescore/football/player/${transfer.player.id}`}
                        className={`${(playerKoreanNames[transfer.player.id] || transfer.player.name).length > 15 ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-[#F0F0F0] hover:underline transition-colors truncate`}
                      >
                        {playerKoreanNames[transfer.player.id] || transfer.player.name}
                      </Link>

                      {transfer.player.nationality && (
                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-shrink-0">
                          {transfer.player.nationality}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-700 dark:text-gray-300 flex-shrink-0">
                      {format(transferDate, 'MM/dd', { locale: ko })}
                    </div>
                  </div>

                  {/* 두 번째 줄 */}
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-7 gap-1 items-center flex-1">
                      <div className="col-span-3 flex items-center space-x-1 min-w-0">
                        <TeamLogo teamName={latestTransfer.teams.out.name} logoUrl={teamLogoUrls[latestTransfer.teams.out.id]} size={16} />
                        <Link
                          href={`/livescore/football/team/${latestTransfer.teams.out.id}`}
                          className="text-xs text-gray-700 dark:text-gray-300 hover:underline transition-colors truncate"
                          title={latestTransfer.teams.out.name}
                        >
                          {(() => {
                            const displayName = getTeamDisplayName(latestTransfer.teams.out.id);
                            return displayName.startsWith('팀 ') ? latestTransfer.teams.out.name : displayName;
                          })()}
                        </Link>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <div className="col-span-3 flex items-center space-x-1 min-w-0">
                        <TeamLogo teamName={latestTransfer.teams.in.name} logoUrl={teamLogoUrls[latestTransfer.teams.in.id]} size={16} />
                        <Link
                          href={`/livescore/football/team/${latestTransfer.teams.in.id}`}
                          className="text-xs text-gray-900 dark:text-[#F0F0F0] hover:underline transition-colors truncate"
                          title={latestTransfer.teams.in.name}
                        >
                          {(() => {
                            const displayName = getTeamDisplayName(latestTransfer.teams.in.id);
                            return displayName.startsWith('팀 ') ? latestTransfer.teams.in.name : displayName;
                          })()}
                        </Link>
                      </div>
                    </div>

                    <div className="text-xs flex-shrink-0 ml-2 w-16 flex justify-end">
                      {latestTransfer.type && latestTransfer.type !== 'N/A' && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-medium text-center min-w-0 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">
                          {formatTransferTypeMobile(latestTransfer.type)}
                        </span>
                      )}
                    </div>
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
