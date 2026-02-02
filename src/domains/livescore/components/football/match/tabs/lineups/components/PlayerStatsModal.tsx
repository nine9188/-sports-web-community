'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { PlayerStatsData } from '@/domains/livescore/types/lineup';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
  ContainerContent,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogCloseButton,
  DialogBody,
} from '@/shared/components/ui';

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number;
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
  // 서버에서 프리로드된 전체 선수 데이터
  allPlayersData: PlayerStatsData[];
  // 선수 네비게이션
  onPrevPlayer?: () => void;
  onNextPlayer?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function PlayerStatsModal({
  isOpen,
  onClose,
  playerId,
  playerInfo,
  allPlayersData,
  onPrevPlayer,
  onNextPlayer,
  hasPrev = false,
  hasNext = false,
}: PlayerStatsModalProps) {
  // 전달받은 데이터에서 현재 선수 찾기 (API 호출 없음)
  const playerStats = useMemo(() => {
    return allPlayersData.find(p => p.player.id === playerId) ?? null;
  }, [allPlayersData, playerId]);

  const stats = playerStats?.statistics?.[0] || {} as {
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
  const showData = !!playerStats;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        {/* 접근성을 위한 숨겨진 타이틀 */}
        <DialogTitle className="sr-only">{playerInfo.name} 선수 통계</DialogTitle>

        {/* 선수 기본 정보 헤더 */}
        <div className="relative text-center pt-4 pb-3 px-4 border-b border-black/5 dark:border-white/10">
          {/* 닫기 버튼 - 우측 상단 고정 */}
          <div className="absolute top-2 right-2">
            <DialogCloseButton />
          </div>

          {/* 선수 이미지 + 좌우 네비게이션 */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {/* 이전 선수 버튼 */}
            <button
              onClick={onPrevPlayer}
              disabled={!hasPrev}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                hasPrev
                  ? 'bg-gray-100 dark:bg-[#2D2D2D] hover:bg-gray-200 dark:hover:bg-[#3D3D3D] text-gray-700 dark:text-gray-300'
                  : 'bg-gray-50 dark:bg-[#252525] text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
              aria-label="이전 선수"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 선수 이미지 */}
            <div className="relative w-20 h-20">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-white dark:border-[#1D1D1D] shadow-lg"></div>
                <UnifiedSportsImage
                  imageId={playerId}
                  imageType={ImageType.Players}
                  alt={playerInfo.name}
                  size="xxl"
                  variant="circle"
                  className="!w-20 !h-20"
                />
              </div>
              {playerInfo.team?.id && (
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full shadow flex items-center justify-center"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <UnifiedSportsImage
                    imageId={playerInfo.team.id}
                    imageType={ImageType.Teams}
                    alt={playerInfo.team?.name || '팀 로고'}
                    size="sm"
                    variant="square"
                    fit="contain"
                    className="w-5 h-5"
                  />
                </div>
              )}
            </div>

            {/* 다음 선수 버튼 */}
            <button
              onClick={onNextPlayer}
              disabled={!hasNext}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                hasNext
                  ? 'bg-gray-100 dark:bg-[#2D2D2D] hover:bg-gray-200 dark:hover:bg-[#3D3D3D] text-gray-700 dark:text-gray-300'
                  : 'bg-gray-50 dark:bg-[#252525] text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
              aria-label="다음 선수"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <h2 className="text-base font-bold mb-1 text-gray-900 dark:text-[#F0F0F0]">{playerInfo.name}</h2>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-700 dark:text-gray-300">
            <span>#{playerInfo.number}</span>
            <span>{playerInfo.pos}</span>
            {stats.games?.captain && (
              <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                주장
              </span>
            )}
          </div>
        </div>

        <DialogBody className="flex-1 overflow-y-auto">
          {/* 데이터 없음 */}
          {!showData && (
            <div className="py-16 text-center px-4">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-[#F0F0F0] mb-2">선수 통계를 불러올 수 없습니다</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                경기가 시작되지 않았거나 데이터가 아직 제공되지 않았습니다.
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
          {showData && (
            <div className="px-4 py-4">
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
                <div className="mt-4">
                  <Link
                    href={`/livescore/football/player/${playerId}`}
                    className="block w-full py-2.5 px-3 bg-[#262626] dark:bg-[#3F3F3F] text-white font-medium rounded-lg shadow hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] transition-colors text-sm text-center"
                  >
                    선수 정보 더보기
                  </Link>
                </div>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
