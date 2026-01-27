'use server';

import { cache } from 'react';
import { fetchCachedMatchData } from '@/domains/livescore/utils/matchDataApi';
import { getUserPrediction, getPredictionStats, type MatchPrediction, type PredictionStats } from './predictions';
import { getSupportComments, type SupportComment } from './supportComments';
import { getRelatedPosts, type RelatedPost } from './relatedPosts';

// 사이드바 전체 데이터 타입
export interface SidebarData {
  matchData: Record<string, unknown>;
  userPrediction: MatchPrediction | null;
  predictionStats: PredictionStats | null;
  comments: SupportComment[];
  relatedPosts: RelatedPost[];
}

// 사이드바 전체 데이터를 한 번에 가져오는 함수
export const getCachedSidebarData = cache(async (matchId: string): Promise<{
  success: boolean;
  data?: SidebarData;
  error?: string;
}> => {
  try {
    // 매치 데이터 먼저 가져오기 (팀 ID 필요)
    const matchDataResult = await fetchCachedMatchData(matchId);

    if (!matchDataResult.success || !matchDataResult.data) {
      return {
        success: false,
        error: '경기 데이터를 찾을 수 없습니다.'
      };
    }

    const matchData = matchDataResult.data as unknown as Record<string, unknown>;
    const teams = matchData.teams as { home?: { id?: number }; away?: { id?: number } } | undefined;
    const homeTeamId = teams?.home?.id;
    const awayTeamId = teams?.away?.id;

    // 나머지 데이터를 병렬로 가져오기
    const [
      userPredictionResult,
      predictionStatsResult,
      commentsResult,
      relatedPostsResult
    ] = await Promise.all([
      getUserPrediction(matchId),
      getPredictionStats(matchId),
      getSupportComments(matchId),
      getRelatedPosts(matchId, homeTeamId, awayTeamId, 10)
    ]);

    return {
      success: true,
      data: {
        matchData,
        userPrediction: userPredictionResult.success ? userPredictionResult.data as MatchPrediction : null,
        predictionStats: predictionStatsResult.success ? predictionStatsResult.data as PredictionStats : null,
        comments: commentsResult.success && Array.isArray(commentsResult.data) ? commentsResult.data as SupportComment[] : [],
        relatedPosts: relatedPostsResult ?? []
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