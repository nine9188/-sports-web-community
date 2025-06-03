'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

// 예측 타입 정의
export type PredictionType = 'home' | 'draw' | 'away';

// 예측 데이터 인터페이스
export interface MatchPrediction {
  id: string;
  user_id: string;
  match_id: string;
  prediction_type: PredictionType;
  created_at: string;
  updated_at: string;
}

// 예측 통계 인터페이스
export interface PredictionStats {
  match_id: string;
  home_votes: number;
  draw_votes: number;
  away_votes: number;
  total_votes: number;
  home_percentage: number;
  draw_percentage: number;
  away_percentage: number;
  updated_at: string;
}

// 응답 인터페이스
export interface PredictionResponse {
  success: boolean;
  data?: MatchPrediction | PredictionStats | null;
  error?: string;
  message?: string;
}

// 매치 예측 생성/업데이트 (별칭 함수)
export async function savePrediction(
  matchId: string,
  predictionType: PredictionType
) {
  return await createOrUpdatePrediction(matchId, predictionType);
}

// 매치 예측 생성/업데이트
export async function createOrUpdatePrediction(
  matchId: string,
  predictionType: PredictionType
) {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 기존 예측 확인
    const { data: existingPrediction } = await supabase
      .from('match_predictions')
      .select('id, prediction_type')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single();

    if (existingPrediction) {
      // 같은 예측이면 삭제 (토글 기능)
      if (existingPrediction.prediction_type === predictionType) {
        const { error: deleteError } = await supabase
          .from('match_predictions')
          .delete()
          .eq('id', existingPrediction.id);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }

        // 통계 업데이트
        await updatePredictionStats(matchId);
        
        return { success: true, message: '예측이 취소되었습니다.', action: 'removed', prediction: null };
      } else {
        // 다른 예측으로 업데이트
        const { data, error: updateError } = await supabase
          .from('match_predictions')
          .update({ 
            prediction_type: predictionType,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrediction.id)
          .select()
          .single();

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        // 통계 업데이트
        await updatePredictionStats(matchId);
        
        return { success: true, message: '예측이 변경되었습니다.', action: 'updated', prediction: data };
      }
    } else {
      // 새 예측 생성
      const { data, error: insertError } = await supabase
        .from('match_predictions')
        .insert({
          match_id: matchId,
          user_id: user.id,
          prediction_type: predictionType
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // 통계 업데이트
      await updatePredictionStats(matchId);
      
      return { success: true, message: '예측이 저장되었습니다.', action: 'created', prediction: data };
    }
  } catch (error) {
    console.error('예측 생성/업데이트 중 예외 발생:', error);
    return { success: false, error: '예측 처리 중 오류가 발생했습니다.' };
  }
}

// 예측 통계 업데이트
async function updatePredictionStats(matchId: string) {
  try {
    const supabase = await createClient();
    
    // 각 예측 타입별 투표 수 계산
    const { data: predictions } = await supabase
      .from('match_predictions')
      .select('prediction_type')
      .eq('match_id', matchId);

    if (!predictions) return;

    const homeVotes = predictions.filter(p => p.prediction_type === 'home').length;
    const drawVotes = predictions.filter(p => p.prediction_type === 'draw').length;
    const awayVotes = predictions.filter(p => p.prediction_type === 'away').length;
    const totalVotes = predictions.length;

    // 통계 테이블 업데이트 (upsert)
    const { error } = await supabase
      .from('match_prediction_stats')
      .upsert({
        match_id: matchId,
        home_votes: homeVotes,
        draw_votes: drawVotes,
        away_votes: awayVotes,
        total_votes: totalVotes,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('예측 통계 업데이트 오류:', error);
    }
  } catch (error) {
    console.error('예측 통계 업데이트 중 예외 발생:', error);
  }
}

// 매치 예측 통계 조회 (캐시 적용) - 별칭 함수
export const getCachedPredictionStats = cache(async (matchId: string) => {
  return await getPredictionStats(matchId);
});

// 매치 예측 통계 조회 (캐시 적용)
export const getPredictionStats = cache(async (matchId: string) => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('match_prediction_stats')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 "not found" 에러
      console.error('예측 통계 조회 오류:', error);
      return { success: false, data: null, error: error.message };
    }

    // 백분율 계산
    const stats = data || {
      match_id: matchId,
      home_votes: 0,
      draw_votes: 0,
      away_votes: 0,
      total_votes: 0,
      updated_at: new Date().toISOString()
    };

    const totalVotes = stats.total_votes || 0;
    const homePercentage = totalVotes > 0 ? Math.round(((stats.home_votes || 0) / totalVotes) * 100) : 0;
    const drawPercentage = totalVotes > 0 ? Math.round(((stats.draw_votes || 0) / totalVotes) * 100) : 0;
    const awayPercentage = totalVotes > 0 ? Math.round(((stats.away_votes || 0) / totalVotes) * 100) : 0;

    const statsWithPercentage = {
      ...stats,
      home_percentage: homePercentage,
      draw_percentage: drawPercentage,
      away_percentage: awayPercentage
    };

    return { success: true, data: statsWithPercentage, error: null };
  } catch (error) {
    console.error('예측 통계 조회 중 예외 발생:', error);
    return { success: false, data: null, error: '예측 통계를 불러오는 중 오류가 발생했습니다.' };
  }
});

// 사용자의 현재 예측 조회 (캐시 적용) - 별칭 함수
export const getCachedUserPrediction = cache(async (matchId: string) => {
  return await getUserPrediction(matchId);
});

// 사용자의 현재 예측 조회 (캐시 적용)
export const getUserPrediction = cache(async (matchId: string) => {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: true, data: null, error: null };
    }

    const { data, error } = await supabase
      .from('match_predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 "not found" 에러
      console.error('사용자 예측 조회 오류:', error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data, error: null };
  } catch (error) {
    console.error('사용자 예측 조회 중 예외 발생:', error);
    return { success: false, data: null, error: '예측 정보를 불러오는 중 오류가 발생했습니다.' };
  }
});

// 예측 삭제
export async function deletePrediction(matchId: string) {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { error } = await supabase
      .from('match_predictions')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // 통계 업데이트
    await updatePredictionStats(matchId);
    
    // 캐시 무효화
    revalidatePath(`/livescore/football/match/${matchId}`);
    
    return { success: true };
  } catch (error) {
    console.error('예측 삭제 중 예외 발생:', error);
    return { success: false, error: '예측 삭제 중 오류가 발생했습니다.' };
  }
} 