'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import {
  savePrediction,
  updatePredictionStatsManually,
  type MatchPrediction,
  type PredictionStats,
  type PredictionType,
} from '@/domains/livescore/actions/match/predictions';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

interface MatchDataType {
  fixture?: {
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
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

interface PredictionButtonProps {
  type: PredictionType;
  isActive: boolean;
  isLoading: boolean;
  canPredict: boolean;
  teamLogoUrl?: string;
  teamName?: string;
  percentage?: number;
  onClick: () => void;
}

function getPredictionLabel(type: PredictionType, homeName?: string, awayName?: string) {
  if (type === 'home') return `${homeName || '홈팀'} 승`;
  if (type === 'away') return `${awayName || '원정팀'} 승`;
  return '무승부';
}

function hasPredictionPayload(result: unknown): result is {
  action?: 'created' | 'updated' | 'removed';
  prediction?: MatchPrediction | null;
  needsStatsUpdate?: boolean;
  error?: unknown;
  message?: string;
} {
  return typeof result === 'object' && result !== null;
}

function PredictionButton({
  type,
  isActive,
  isLoading,
  canPredict,
  teamLogoUrl,
  teamName,
  percentage,
  onClick,
}: PredictionButtonProps) {
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
        ) : teamLogoUrl ? (
          <UnifiedSportsImageClient
            src={teamLogoUrl}
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
}

export default function MatchPredictionClient({
  matchId,
  matchData,
  initialPrediction,
  initialStats,
  teamLogoUrls = {},
}: {
  matchId: string;
  matchData: MatchDataType;
  initialPrediction?: MatchPrediction | null;
  initialStats?: PredictionStats | null;
  teamLogoUrls?: Record<number, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [isLoading, setIsLoading] = useState(false);
  const [userPrediction, setUserPrediction] = useState<MatchPrediction | null>(initialPrediction ?? null);
  const [stats, setStats] = useState<PredictionStats | null>(initialStats ?? null);

  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;
  const fixture = matchData.fixture;
  const prediction = userPrediction?.prediction_type ?? null;

  useEffect(() => {
    setUserPrediction(initialPrediction ?? null);
  }, [initialPrediction]);

  useEffect(() => {
    setStats(initialStats ?? null);
  }, [initialStats]);

  const getTeamLogo = (id: number) => {
    const apiLogo = id === homeTeam?.id ? homeTeam.logo : id === awayTeam?.id ? awayTeam.logo : undefined;
    return teamLogoUrls[id] || apiLogo || TEAM_PLACEHOLDER;
  };

  const isMatchFinished = () => {
    const status = fixture?.status?.short;
    return ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'SUSP'].includes(status || '');
  };

  const isMatchStarted = () => {
    const status = fixture?.status?.short;
    return !['NS', 'TBD', 'PST'].includes(status || '');
  };

  const isMatchInProgress = () => isMatchStarted() && !isMatchFinished();

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
  const canPredict = !isMatchFinished() && !isMatchStarted();
  const finished = isMatchFinished();
  const inProgress = isMatchInProgress();
  const homeName = homeTeam?.name_ko || homeTeam?.name || '홈팀';
  const awayName = awayTeam?.name_ko || awayTeam?.name || '원정팀';
  const predictionEmptyMessage = finished
    ? ['종료된 경기입니다. 예측 참여가 없습니다.']
    : inProgress
      ? ['경기가 진행 중입니다.', '시작 전까지만 예측할 수 있습니다.']
      : ['아직 예측 참여가 없습니다.'];

  const handlePrediction = async (type: PredictionType) => {
    if (!matchId) return;

    if (isMatchFinished() || isMatchStarted()) {
      toast.error(isMatchFinished() ? '경기가 종료되어 예측할 수 없습니다.' : '경기가 진행 중이라 예측할 수 없습니다.');
      return;
    }

    if (prediction === type) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await savePrediction(matchId, type, pathname);

      if (result.success) {
        if (hasPredictionPayload(result)) {
          setUserPrediction(result.prediction ?? null);

          if (result.needsStatsUpdate) {
            const statsUpdateResult = await updatePredictionStatsManually(matchId);
            if (!statsUpdateResult.success) {
              console.error('[MatchPredictionClient] stats update failed:', statsUpdateResult.error);
            }
          }
        }

        toast.success(result.message || '예측이 저장되었습니다.');
        startTransition(() => {
          router.refresh();
        });
        return;
      }

      const errorMessage = hasPredictionPayload(result) && result.error
        ? String(result.error)
        : '예측 저장에 실패했습니다.';
      toast.error(errorMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예측 저장 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
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

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          <PredictionButton
            type="home"
            isActive={prediction === 'home'}
            isLoading={isLoading}
            canPredict={canPredict}
            teamLogoUrl={getTeamLogo(homeTeam?.id || 0)}
            teamName={homeTeam?.name}
            percentage={stats?.home_percentage}
            onClick={() => handlePrediction('home')}
          />

          <PredictionButton
            type="draw"
            isActive={prediction === 'draw'}
            isLoading={isLoading}
            canPredict={canPredict}
            percentage={stats?.draw_percentage}
            onClick={() => handlePrediction('draw')}
          />

          <PredictionButton
            type="away"
            isActive={prediction === 'away'}
            isLoading={isLoading}
            canPredict={canPredict}
            teamLogoUrl={getTeamLogo(awayTeam?.id || 0)}
            teamName={awayTeam?.name}
            percentage={stats?.away_percentage}
            onClick={() => handlePrediction('away')}
          />
        </div>

        {finished && prediction && isPredictionCorrect !== null && (
          <div className={`mt-3 p-3 rounded-lg text-center ${
            isPredictionCorrect
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <div className={`text-[13px] font-medium mb-1 ${
              isPredictionCorrect
                ? 'text-green-800 dark:text-green-400'
                : 'text-red-800 dark:text-red-400'
            }`}>
              {isPredictionCorrect ? '예측 적중!' : '아쉽게 빗나갔습니다'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              내 예측: {getPredictionLabel(prediction, homeName, awayName)}
              {' / '}
              결과: {matchData.goals?.home ?? 0} - {matchData.goals?.away ?? 0}
            </div>
          </div>
        )}

        {finished && !prediction && (
          <div className="mt-3 p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              이 경기는 예측에 참여하지 않았습니다.
            </div>
          </div>
        )}

        {!finished && prediction && (
          <div className="mt-3 p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="text-xs text-center text-gray-700 dark:text-gray-300">
              내 예측:{' '}
              <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">
                {getPredictionLabel(prediction, homeName, awayName)}
              </span>
            </div>
          </div>
        )}

        {!stats || stats.total_votes === 0 ? (
          <div className="mt-3 p-3 text-center text-[13px] text-gray-500 dark:text-gray-400">
            {predictionEmptyMessage.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : (
          <div className="mt-3 p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
            <div className="text-xs text-gray-700 dark:text-gray-300 mb-2 text-center">
              총 {stats.total_votes}명이 예측했습니다
            </div>

            <div className="space-y-2">
              <PredictionBar
                logoUrl={homeTeam?.id ? getTeamLogo(homeTeam.id) : undefined}
                label={homeName}
                percentage={stats.home_percentage}
              />
              <PredictionBar
                label="무승부"
                marker="D"
                percentage={stats.draw_percentage}
              />
              <PredictionBar
                logoUrl={awayTeam?.id ? getTeamLogo(awayTeam.id) : undefined}
                label={awayName}
                percentage={stats.away_percentage}
              />
            </div>
          </div>
        )}

        {finished && (
          <Link
            href="/livescore/football"
            className="mt-3 block w-full py-2.5 text-xs text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-lg transition-colors"
            prefetch={false}
          >
            다른 경기 예측하러 가기
          </Link>
        )}
      </div>
    </Container>
  );
}

function PredictionBar({
  logoUrl,
  label,
  marker,
  percentage,
}: {
  logoUrl?: string;
  label: string;
  marker?: string;
  percentage: number;
}) {
  return (
    <div className="flex items-center text-xs">
      <div className="w-8 h-4 relative mr-2 flex items-center justify-center">
        {logoUrl ? (
          <UnifiedSportsImageClient
            src={logoUrl}
            alt={label}
            width={32}
            height={16}
            className="object-contain w-full h-full"
          />
        ) : (
          <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">{marker}</span>
        )}
      </div>
      <div className="flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2 mr-2">
        <div
          className="bg-[#262626] dark:bg-[#F0F0F0] h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="font-medium text-gray-900 dark:text-[#F0F0F0] w-8 text-right">
        {percentage}%
      </span>
    </div>
  );
}
