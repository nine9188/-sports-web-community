'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import {
  savePrediction,
  getUserPrediction,
  getPredictionStats,
  updatePredictionStatsManually,
  type PredictionType,
  type MatchPrediction
} from '@/domains/livescore/actions/match/predictions';

// 로컬 인터페이스 정의
interface PredictionStats {
  home_percentage: number;
  draw_percentage: number;
  away_percentage: number;
  total_votes: number;
}

interface PredictionButtonProps {
  type: PredictionType;
  isActive: boolean;
  isLoading: boolean;
  canPredict: boolean;
  teamId?: number;
  teamName?: string;
  percentage?: number;
  onClick: () => void;
}

const PredictionButton: React.FC<PredictionButtonProps> = ({
  type,
  isActive,
  isLoading,
  canPredict,
  teamId,
  teamName,
  percentage,
  onClick
}) => {
  return (
    <Button
      variant={isActive ? 'secondary' : 'outline'}
      onClick={onClick}
      disabled={isLoading || !canPredict}
      className={`p-4 h-auto rounded-lg border-2 flex flex-col items-center justify-center relative ${
        isActive
          ? 'border-gray-800 dark:border-[#F0F0F0]'
          : 'border-black/7 dark:border-white/10'
      }`}
    >
      <div className="relative w-8 h-8 mb-1">
        {type === 'draw' ? (
          <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg flex items-center justify-center">
            <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">D</span>
          </div>
        ) : teamId ? (
          <UnifiedSportsImage
            imageId={teamId}
            imageType={ImageType.Teams}
            alt={teamName || 'Team'}
            width={32}
            height={32}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-8 h-8 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-xs">로고</span>
          </div>
        )}
      </div>
      {percentage !== undefined && (
        <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
          {percentage}%
        </div>
      )}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#262626] dark:bg-[#F0F0F0] rounded-full flex items-center justify-center">
          <span className="text-white dark:text-[#1D1D1D] text-xs">✓</span>
        </div>
      )}
    </Button>
  );
};

// 매치 데이터 타입 정의
interface MatchDataType {
  fixture?: {
    date?: string;
    timezone?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
    referee?: string;
    periods?: {
      first?: number;
      second?: number;
    };
  };
  league?: {
    id?: number;
    name?: string;
    name_ko?: string;
    country?: string;
    season?: number;
    round?: string;
    logo?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
}

// 승무패 예측 섹션 컴포넌트
export default function MatchPredictionClient({
  matchData,
  initialPrediction,
  initialStats
}: {
  matchData: MatchDataType;
  initialPrediction?: MatchPrediction | null;
  initialStats?: PredictionStats | null;
}) {
  const pathname = usePathname();
  const matchId = pathname?.split('/').pop() || '';
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);

  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;
  const fixture = matchData.fixture;

  // React Query로 사용자 예측 로드
  const { data: userPredictionData } = useQuery({
    queryKey: ['userPrediction', matchId],
    queryFn: async () => {
      const result = await getUserPrediction(matchId);
      return result.success && result.data ? result.data : null;
    },
    enabled: !!matchId,
    initialData: initialPrediction,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // React Query로 예측 통계 로드
  const { data: statsData } = useQuery({
    queryKey: ['predictionStats', matchId],
    queryFn: async () => {
      const result = await getPredictionStats(matchId);
      if (result.success && result.data) {
        return {
          home_percentage: result.data.home_percentage,
          draw_percentage: result.data.draw_percentage,
          away_percentage: result.data.away_percentage,
          total_votes: result.data.total_votes || 0
        };
      }
      return null;
    },
    enabled: !!matchId,
    initialData: initialStats,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
  });

  const prediction = userPredictionData?.prediction_type as PredictionType | null;
  const stats = statsData;

  // 경기 상태 확인 함수
  const isMatchFinished = () => {
    const status = fixture?.status?.short;
    return ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'SUSP'].includes(status || '');
  };

  const isMatchStarted = () => {
    const status = fixture?.status?.short;
    return !['NS', 'TBD', 'PST'].includes(status || '');
  };

  const isMatchInProgress = () => {
    return isMatchStarted() && !isMatchFinished();
  };

  // 경기 결과로 실제 승무패 판별
  const getMatchResult = (): PredictionType | null => {
    if (!isMatchFinished()) return null;
    const homeGoals = matchData.goals?.home;
    const awayGoals = matchData.goals?.away;
    if (homeGoals == null || awayGoals == null) return null;
    if (homeGoals > awayGoals) return 'home';
    if (homeGoals < awayGoals) return 'away';
    return 'draw';
  };

  const matchResult = getMatchResult();
  const isPredictionCorrect = prediction && matchResult ? prediction === matchResult : null;

  // 예측 처리
  const handlePrediction = async (type: PredictionType) => {
    if (!matchId) return;

    // 경기가 끝났거나 시작된 경우 예측 불가
    if (isMatchFinished() || isMatchStarted()) {
      toast.error(isMatchFinished() ? '경기가 종료되어 예측할 수 없습니다' : '경기가 진행 중이라 예측할 수 없습니다');
      return;
    }

    // 같은 예측을 다시 클릭하면 취소
    if (prediction === type) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await savePrediction(matchId, type);

      if (result.success) {
        // React Query 캐시 업데이트 - 사용자 예측
        queryClient.setQueryData(['userPrediction', matchId], { prediction_type: type });
        toast.success(result.message || '예측이 저장되었습니다!');

        // 통계 업데이트가 필요한 경우 별도로 호출
        const hasStatsUpdate = (obj: unknown): obj is { needsStatsUpdate: boolean } => {
          return typeof obj === 'object' && obj !== null && 'needsStatsUpdate' in obj;
        };

        if (hasStatsUpdate(result) && result.needsStatsUpdate) {
          try {
            const statsUpdateResult = await updatePredictionStatsManually(matchId);

            if (!statsUpdateResult.success) {
              console.error('통계 업데이트 실패:', statsUpdateResult.error);
            }
          } catch (statsError) {
            console.error('통계 업데이트 예외:', statsError);
          }
        }

        // 통계 캐시 무효화 및 새로고침
        queryClient.invalidateQueries({ queryKey: ['predictionStats', matchId] });
      } else {
        // 에러 타입에 따라 다른 메시지 표시
        const hasError = (obj: unknown): obj is { error: unknown } => {
          return typeof obj === 'object' && obj !== null && 'error' in obj;
        };

        const errorFromResult = hasError(result) ? result.error : undefined;

        let errorMessage = '예측 저장에 실패했습니다.';

        if (!errorFromResult || errorFromResult === '' || (typeof errorFromResult === 'object' && Object.keys(errorFromResult).length === 0)) {
          errorMessage = '서버에서 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.';
        } else if (typeof errorFromResult === 'string') {
          if (errorFromResult.includes('relation') && errorFromResult.includes('does not exist')) {
            errorMessage = '데이터베이스 연결 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
          } else if (errorFromResult.includes('로그인')) {
            errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
          } else if (errorFromResult.includes('권한')) {
            errorMessage = '예측할 권한이 없습니다.';
          } else {
            errorMessage = errorFromResult;
          }
        } else {
          errorMessage = String(errorFromResult || '알 수 없는 오류가 발생했습니다.');
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      let errorMessage = '예측 저장 중 오류가 발생했습니다.';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error instanceof Error) {
        errorMessage = `오류: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const canPredict = !isMatchFinished() && !isMatchStarted();
  const finished = isMatchFinished();
  const inProgress = isMatchInProgress();

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      {/* 헤더 */}
      <ContainerHeader>
        <ContainerTitle className="flex items-center gap-2">
          승부 예측
          {finished && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              경기 종료
            </span>
          )}
          {inProgress && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              진행 중
            </span>
          )}
        </ContainerTitle>
      </ContainerHeader>

      {/* 예측 버튼들 */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {/* 홈팀 승리 */}
          <PredictionButton
            type="home"
            isActive={prediction === 'home'}
            isLoading={isLoading}
            canPredict={canPredict}
            teamId={homeTeam?.id}
            teamName={homeTeam?.name}
            percentage={stats?.home_percentage}
            onClick={() => handlePrediction('home')}
          />

          {/* 무승부 */}
          <Button
            variant={prediction === 'draw' ? 'secondary' : 'outline'}
            onClick={() => handlePrediction('draw')}
            disabled={isLoading || !canPredict}
            className={`p-3 h-auto rounded-lg border-2 relative ${
              prediction === 'draw'
                ? 'border-gray-800 dark:border-[#F0F0F0]'
                : 'border-black/7 dark:border-white/10'
            }`}
          >
            <div className="text-center">
              <div className="text-xs font-medium mb-1">무승부</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">DRAW</div>
              {stats && stats.total_votes > 0 && (
                <div className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
                  {stats.draw_percentage}%
                </div>
              )}
            </div>
            {prediction === 'draw' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#262626] dark:bg-[#F0F0F0] rounded-full flex items-center justify-center">
                <span className="text-white dark:text-[#1D1D1D] text-xs">✓</span>
              </div>
            )}
          </Button>

          {/* 원정팀 승리 */}
          <PredictionButton
            type="away"
            isActive={prediction === 'away'}
            isLoading={isLoading}
            canPredict={canPredict}
            teamId={awayTeam?.id}
            teamName={awayTeam?.name}
            percentage={stats?.away_percentage}
            onClick={() => handlePrediction('away')}
          />
        </div>

        {/* 경기 종료 + 예측 결과 */}
        {finished && prediction && isPredictionCorrect !== null && (
          <div className={`mt-3 p-3 rounded-lg text-center ${
            isPredictionCorrect
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <div className={`text-sm font-medium mb-1 ${
              isPredictionCorrect
                ? 'text-green-800 dark:text-green-400'
                : 'text-red-800 dark:text-red-400'
            }`}>
              {isPredictionCorrect ? '예측 적중!' : '아쉽게 빗나갔습니다'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              내 예측: {prediction === 'home' && `${homeTeam?.name_ko || homeTeam?.name || '홈팀'} 승`}
              {prediction === 'draw' && '무승부'}
              {prediction === 'away' && `${awayTeam?.name_ko || awayTeam?.name || '원정팀'} 승`}
              {' / '}
              결과: {matchData.goals?.home ?? 0} - {matchData.goals?.away ?? 0}
            </div>
          </div>
        )}

        {/* 경기 종료인데 예측 안한 경우 */}
        {finished && !prediction && (
          <div className="mt-3 p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              이 경기는 예측에 참여하지 않았습니다
            </div>
          </div>
        )}

        {/* 진행 전 예측 표시 (경기 시작 전 or 진행 중) */}
        {!finished && prediction && (
          <div className="mt-3 p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="text-xs text-center text-gray-700 dark:text-gray-300">
              내 예측: <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">
                {prediction === 'home' && `${homeTeam?.name_ko || homeTeam?.name || '홈팀'} 승리`}
                {prediction === 'draw' && '무승부'}
                {prediction === 'away' && `${awayTeam?.name_ko || awayTeam?.name || '원정팀'} 승리`}
              </span>
            </div>
          </div>
        )}

        {/* 전체 통계 표시 */}
        {stats && stats.total_votes > 0 && (
          <div className="mt-3 p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="text-xs text-gray-700 dark:text-gray-300 mb-2 text-center">
              총 {stats.total_votes}명이 예측했습니다
            </div>

            {/* 통계 바 */}
            <div className="space-y-2">
              {/* 홈팀 */}
              <div className="flex items-center text-xs">
                <div className="w-8 h-4 relative mr-2">
                  {homeTeam?.id && (
                    <UnifiedSportsImage
                      imageId={homeTeam.id}
                      imageType={ImageType.Teams}
                      alt={homeTeam?.name || 'Home'}
                      width={32}
                      height={16}
                      className="object-contain w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2 mr-2">
                  <div
                    className="bg-[#262626] dark:bg-[#F0F0F0] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.home_percentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] w-8 text-right">
                  {stats.home_percentage}%
                </span>
              </div>

              {/* 무승부 */}
              <div className="flex items-center text-xs">
                <div className="w-8 h-4 mr-2 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">D</span>
                </div>
                <div className="flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2 mr-2">
                  <div
                    className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.draw_percentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] w-8 text-right">
                  {stats.draw_percentage}%
                </span>
              </div>

              {/* 원정팀 */}
              <div className="flex items-center text-xs">
                <div className="w-8 h-4 relative mr-2">
                  {awayTeam?.id && (
                    <UnifiedSportsImage
                      imageId={awayTeam.id}
                      imageType={ImageType.Teams}
                      alt={awayTeam?.name || 'Away'}
                      width={32}
                      height={16}
                      className="object-contain w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2 mr-2">
                  <div
                    className="bg-[#262626] dark:bg-[#F0F0F0] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.away_percentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0] w-8 text-right">
                  {stats.away_percentage}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 경기 종료 시 다른 경기 예측하기 링크 */}
        {finished && (
          <Link
            href="/livescore/football"
            className="mt-3 block w-full py-2.5 text-xs text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-lg transition-colors"
          >
            다른 경기 예측하기 →
          </Link>
        )}
      </div>
    </Container>
  );
}