'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchCachedPlayerStats, PlayerStatsResponse } from '@/domains/livescore/actions/match/playerStats';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
  ContainerContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
} from '@/shared/components/ui';
import Spinner from '@/shared/components/Spinner';

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
  matchId: string;
  playerInfo: {
    name: string;
    number: string;
    pos: string;
    photo?: string;
    team: {
      id: number;
      name: string;
    };
  };
}

export default function PlayerStatsModal({
  isOpen,
  onClose,
  playerId,
  matchId,
  playerInfo
}: PlayerStatsModalProps) {
  // React Query로 클라이언트 캐시 적용 - 같은 선수는 재요청 안함
  const { data: playerStats, isLoading, error } = useQuery({
    queryKey: ['playerStats', matchId, playerId],
    queryFn: () => fetchCachedPlayerStats(matchId, playerId),
    enabled: isOpen && !!matchId && !!playerId,
    staleTime: 1000 * 60 * 10, // 10분간 캐시 유지
    gcTime: 1000 * 60 * 30, // 30분간 가비지 컬렉션 방지
    refetchOnWindowFocus: false,
  });

  const stats = playerStats?.response?.statistics?.[0] || {} as {
    team?: { id?: number; name?: string };
    games?: { minutes?: number; number?: number; position?: string; rating?: string; captain?: boolean };
    goals?: { total?: number; conceded?: number; assists?: number; saves?: number };
    shots?: { total?: number; on?: number };
    passes?: { total?: number; key?: number; accuracy?: string };
    dribbles?: { attempts?: number; success?: number };
    duels?: { total?: number; won?: number };
    fouls?: { drawn?: number; committed?: number };
    cards?: { yellow?: number; red?: number };
    penalty?: { saved?: number };
  };
  const showData = playerStats?.success && playerStats.response;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>선수 개인 통계</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          {/* 로딩 */}
          {isLoading && (
            <div className="py-16 text-center">
              <Spinner size="xl" className="mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300">선수 통계를 불러오는 중...</p>
            </div>
          )}

          {/* 에러 */}
          {!isLoading && error && (
            <div className="py-16 text-center px-4">
              <div className="text-red-500 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-[#F0F0F0] mb-4">
                {error instanceof Error ? error.message : '선수 통계를 가져오는 중 오류가 발생했습니다'}
              </p>
              <Button
                variant="secondary"
                onClick={onClose}
              >
                닫기
              </Button>
            </div>
          )}

          {/* 데이터 없음 */}
          {!isLoading && !error && !showData && (
            <div className="py-16 text-center px-4">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-[#F0F0F0] mb-2">선수 통계를 불러올 수 없습니다</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {playerStats?.message || '경기가 시작되지 않았거나 데이터가 아직 제공되지 않았습니다.'}
              </p>
              <Button
                variant="secondary"
                onClick={onClose}
              >
                닫기
              </Button>
            </div>
          )}

          {/* 데이터 표시 */}
          {!isLoading && !error && showData && (
            <>
              {/* 선수 기본 정보 */}
              <div className="px-4 pt-3">
                <Container className="mb-4 dark:border dark:border-white/10">
                  <ContainerContent className="text-center">
                    <div className="relative w-28 h-28 mx-auto mb-4">
                      <div className="relative w-28 h-28">
                        <div className="absolute inset-0 rounded-full border-4 border-white dark:border-[#1D1D1D] shadow-lg"></div>
                        <UnifiedSportsImage
                          imageId={playerId}
                          imageType={ImageType.Players}
                          alt={playerInfo.name}
                          size="xxl"
                          variant="circle"
                          className="w-full h-full"
                        />
                      </div>
                      {stats.team?.id && (
                        <div
                          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center"
                          style={{ backgroundColor: '#ffffff' }}
                        >
                          <UnifiedSportsImage
                            imageId={stats.team.id}
                            imageType={ImageType.Teams}
                            alt={stats.team?.name || '팀 로고'}
                            size="md"
                            variant="square"
                            fit="contain"
                            className="w-8 h-8"
                          />
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-[#F0F0F0]">{playerInfo.name}</h2>
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <span>#{playerInfo.number}</span>
                      <span>{playerInfo.pos}</span>
                      {stats.games?.captain && (
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                          주장
                        </span>
                      )}
                    </div>
                  </ContainerContent>
                </Container>
              </div>

              {/* 통계 */}
              <div className="px-4 pb-8">
                {/* 기본 정보 */}
                <Container className="mb-4 dark:border dark:border-white/10">
                  <ContainerHeader>
                    <ContainerTitle>기본 정보</ContainerTitle>
                  </ContainerHeader>
                  <ContainerContent className="p-0">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">평점</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.games?.rating || '-'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">출전시간</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.games?.minutes || 0}&apos;</td>
                        </tr>
                      </tbody>
                    </table>
                  </ContainerContent>
                </Container>

                {/* 필드 플레이어 전용 */}
                {playerInfo.pos !== 'G' && (
                  <>
                    <Container className="mb-4 dark:border dark:border-white/10">
                      <ContainerHeader>
                        <ContainerTitle>공격 스탯</ContainerTitle>
                      </ContainerHeader>
                      <ContainerContent className="p-0">
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr className="border-b border-black/5 dark:border-white/10">
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">득점</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.total || 0}</td>
                            </tr>
                            <tr className="border-b border-black/5 dark:border-white/10">
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">도움</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.assists || 0}</td>
                            </tr>
                            <tr className="border-b border-black/5 dark:border-white/10">
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">슈팅</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.shots?.total || 0}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">유효슈팅</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.shots?.on || 0}</td>
                            </tr>
                          </tbody>
                        </table>
                      </ContainerContent>
                    </Container>

                    <Container className="mb-4 dark:border dark:border-white/10">
                      <ContainerHeader>
                        <ContainerTitle>드리블 & 듀얼</ContainerTitle>
                      </ContainerHeader>
                      <ContainerContent className="p-0">
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr className="border-b border-black/5 dark:border-white/10">
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">드리블 시도</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.dribbles?.attempts || 0}</td>
                            </tr>
                            <tr className="border-b border-black/5 dark:border-white/10">
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">드리블 성공</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.dribbles?.success || 0}</td>
                            </tr>
                            <tr className="border-b border-black/5 dark:border-white/10">
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">듀얼 시도</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.duels?.total || 0}</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">듀얼 성공</td>
                              <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.duels?.won || 0}</td>
                            </tr>
                          </tbody>
                        </table>
                      </ContainerContent>
                    </Container>
                  </>
                )}

                {/* 패스 */}
                <Container className="mb-4 dark:border dark:border-white/10">
                  <ContainerHeader>
                    <ContainerTitle>패스</ContainerTitle>
                  </ContainerHeader>
                  <ContainerContent className="p-0">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">총 패스</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.passes?.total || 0}</td>
                        </tr>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">키패스</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.passes?.key || 0}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">패스 성공률</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.passes?.accuracy || 0}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </ContainerContent>
                </Container>

                {/* 파울 & 카드 */}
                <Container className="mb-4 dark:border dark:border-white/10">
                  <ContainerHeader>
                    <ContainerTitle>파울 & 카드</ContainerTitle>
                  </ContainerHeader>
                  <ContainerContent className="p-0">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">파울 얻음</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.fouls?.drawn || 0}</td>
                        </tr>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">파울 범함</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.fouls?.committed || 0}</td>
                        </tr>
                        <tr className="border-b border-black/5 dark:border-white/10">
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">옐로카드</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.cards?.yellow || 0}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">레드카드</td>
                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.cards?.red || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </ContainerContent>
                </Container>

                {/* 골키퍼 전용 */}
                {playerInfo.pos === 'G' && (
                  <Container className="mb-4 dark:border dark:border-white/10">
                    <ContainerHeader>
                      <ContainerTitle>골키퍼 스탯</ContainerTitle>
                    </ContainerHeader>
                    <ContainerContent className="p-0">
                      <table className="w-full border-collapse">
                        <tbody>
                          <tr className="border-b border-black/5 dark:border-white/10">
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">실점</td>
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.conceded || 0}</td>
                          </tr>
                          <tr className="border-b border-black/5 dark:border-white/10">
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">선방</td>
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.goals?.saves || 0}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">막아낸 PK</td>
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.penalty?.saved || 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </ContainerContent>
                  </Container>
                )}

                {/* 선수 상세 정보 링크 */}
                <div className="mt-4 mb-4">
                  <Link
                    href={`/livescore/football/player/${playerId}`}
                    className="block w-full py-3 px-3 bg-[#262626] dark:bg-[#3F3F3F] text-white font-medium rounded-lg shadow hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-colors text-lg text-center"
                  >
                    선수 정보 더보기
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
