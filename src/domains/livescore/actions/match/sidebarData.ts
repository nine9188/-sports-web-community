'use server';

import { cache } from 'react';
import { fetchCachedMatchData } from '@/domains/livescore/utils/matchDataApi';
import { getCachedUserPrediction, getCachedPredictionStats, type MatchPrediction, type PredictionStats } from './predictions';
import { getSupportComments, type SupportComment } from './supportComments';

// 사이드바 전체 데이터 타입
export interface SidebarData {
  matchData: Record<string, unknown>;
  userPrediction: MatchPrediction | null;
  predictionStats: PredictionStats | null;
  comments: SupportComment[];
}

// 사이드바 전체 데이터를 한 번에 가져오는 함수
export const getCachedSidebarData = cache(async (matchId: string): Promise<{
  success: boolean;
  data?: SidebarData;
  error?: string;
}> => {
  try {
    // 모든 데이터를 병렬로 가져오기
    const [
      matchDataResult,
      userPredictionResult,
      predictionStatsResult,
      commentsResult
    ] = await Promise.all([
      fetchCachedMatchData(matchId),
      getCachedUserPrediction(matchId),
      getCachedPredictionStats(matchId),
      getSupportComments(matchId)
    ]);

    // 매치 데이터가 없으면 실패
    if (!matchDataResult.success || !matchDataResult.data) {
      return {
        success: false,
        error: '경기 데이터를 찾을 수 없습니다.'
      };
    }

    return {
      success: true,
      data: {
        matchData: matchDataResult.data as unknown as Record<string, unknown>,
        userPrediction: userPredictionResult.success ? userPredictionResult.data as MatchPrediction : null,
        predictionStats: predictionStatsResult.success ? predictionStatsResult.data as PredictionStats : null,
        comments: commentsResult.success && Array.isArray(commentsResult.data) ? commentsResult.data as SupportComment[] : []
      }
    };
  } catch (error) {
    console.error('사이드바 데이터 로드 오류:', error);
    return {
      success: false,
      error: '데이터를 불러오는 중 오류가 발생했습니다.'
    };
  }
}); 