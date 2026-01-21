'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUpcomingMatches,
  generateAllPredictions,
  generateSingleLeaguePrediction,
  getPredictionAutomationLogs,
  togglePredictionAutomation,
  testPredictionGeneration,
  fetchPredictionPreview,
} from '@/domains/prediction/actions';
import { adminKeys } from '@/shared/constants/queryKeys';

interface UpcomingMatch {
  id: number;
  date: string;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  status: string;
}

interface PredictionLog {
  id: string;
  trigger_type: string;
  status: string;
  matches_processed: number;
  posts_created: number;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
  details?: string;
}

/**
 * 예정 경기 목록 조회 훅
 */
export function useUpcomingMatches(date: string) {
  return useQuery<UpcomingMatch[]>({
    queryKey: [...adminKeys.predictions(), 'matches', date],
    queryFn: async () => {
      const result = await getUpcomingMatches(date);
      if (!result.success) {
        throw new Error(result.error || '경기 목록 조회에 실패했습니다.');
      }
      return result.matches || [];
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 예측 자동화 로그 조회 훅
 */
export function usePredictionAutomationLogs() {
  return useQuery<PredictionLog[]>({
    queryKey: [...adminKeys.predictions(), 'logs'],
    queryFn: async () => {
      const result = await getPredictionAutomationLogs();
      if (!result.success) {
        throw new Error(result.error || '로그 조회에 실패했습니다.');
      }
      return result.logs || [];
    },
    staleTime: 1000 * 60 * 2, // 2분
  });
}

/**
 * 전체 예측 생성 mutation
 */
export function useGenerateAllPredictionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      const result = await generateAllPredictions(date);
      if (!result.success) {
        throw new Error(result.error || '예측 생성에 실패했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.predictions() });
    },
  });
}

/**
 * 리그별 예측 생성 mutation
 */
export function useGenerateLeaguePredictionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leagueId,
      leagueName,
      date,
      matchIds,
    }: {
      leagueId: number;
      leagueName: string;
      date: string;
      matchIds?: number[];
    }) => {
      const result = await generateSingleLeaguePrediction(leagueId, leagueName, date, matchIds);
      if (!result.success) {
        throw new Error(result.error || '예측 생성에 실패했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.predictions() });
    },
  });
}

/**
 * 예측 자동화 토글 mutation
 */
export function useTogglePredictionAutomationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const result = await togglePredictionAutomation(enabled);
      if (!result.success) {
        throw new Error(result.error || '자동화 설정에 실패했습니다.');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.predictions() });
    },
  });
}

/**
 * 테스트 예측 생성 mutation
 */
export function useTestPredictionMutation() {
  return useMutation({
    mutationFn: async (matchId: number) => {
      const result = await testPredictionGeneration(matchId);
      if (!result.success) {
        throw new Error(result.error || '테스트 예측 생성에 실패했습니다.');
      }
      return result;
    },
  });
}

/**
 * 예측 미리보기 조회
 */
export function usePredictionPreview(matchId: number | null) {
  return useQuery({
    queryKey: [...adminKeys.predictions(), 'preview', matchId],
    queryFn: async () => {
      if (!matchId) return null;
      const result = await fetchPredictionPreview(matchId);
      if (!result.success) {
        throw new Error(result.error || '미리보기 조회에 실패했습니다.');
      }
      return result.data;
    },
    enabled: !!matchId,
    staleTime: 1000 * 60 * 10, // 10분
  });
}
