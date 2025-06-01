'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

// Supabase 서버 클라이언트 생성
async function createServerComponentClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        }
      }
    }
  );
}

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

/**
 * 사용자의 예측 저장/업데이트
 */
export async function savePrediction(
  matchId: string, 
  predictionType: PredictionType
): Promise<PredictionResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    // 경기 시작 시간 검증 (추후 구현 가능)
    // const isValidTime = await validatePredictionTime(matchId);
    // if (!isValidTime) {
    //   return {
    //     success: false,
    //     error: '경기 시작 후에는 예측할 수 없습니다.'
    //   };
    // }

    // 기존 예측이 있는지 확인
    const { data: existingPrediction } = await supabase
      .from('match_predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .single();

    let result;
    
    if (existingPrediction) {
      // 기존 예측 업데이트
      result = await supabase
        .from('match_predictions')
        .update({
          prediction_type: predictionType,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('match_id', matchId)
        .select()
        .single();
    } else {
      // 새 예측 생성
      result = await supabase
        .from('match_predictions')
        .insert({
          user_id: user.id,
          match_id: matchId,
          prediction_type: predictionType
        })
        .select()
        .single();

      // 첫 예측시 포인트 적립
      await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          match_id: matchId,
          points: 10,
          transaction_type: 'prediction',
          description: '경기 예측 참여'
        });

      // 사용자 포인트 업데이트 (기존 point_history 테이블 활용)
      await supabase
        .from('point_history')
        .insert({
          user_id: user.id,
          points: 10,
          reason: '경기 예측 참여'
        });
    }

    if (result.error) {
      return {
        success: false,
        error: result.error.message
      };
    }

    // 캐시 무효화
    revalidatePath(`/livescore/football/match/${matchId}`);

    return {
      success: true,
      data: result.data,
      message: existingPrediction ? '예측이 수정되었습니다.' : '예측이 저장되었습니다.'
    };

  } catch (error) {
    console.error('예측 저장 오류:', error);
    return {
      success: false,
      error: '예측 저장 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 사용자의 예측 조회
 */
export async function getUserPrediction(matchId: string): Promise<PredictionResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: true,
        data: null // 로그인하지 않은 경우 null 반환
      };
    }

    const { data, error } = await supabase
      .from('match_predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 "not found" 에러
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data || null
    };

  } catch (error) {
    console.error('사용자 예측 조회 오류:', error);
    return {
      success: false,
      error: '예측 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 매치 예측 통계 조회
 */
export async function getPredictionStats(matchId: string): Promise<PredictionResponse> {
  try {
    const supabase = await createServerComponentClient();

    const { data, error } = await supabase
      .from('match_prediction_stats')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: error.message
      };
    }

    // 데이터가 없으면 기본값 반환
    if (!data) {
      return {
        success: true,
        data: {
          match_id: matchId,
          home_votes: 0,
          draw_votes: 0,
          away_votes: 0,
          total_votes: 0,
          home_percentage: 0,
          draw_percentage: 0,
          away_percentage: 0,
          updated_at: new Date().toISOString()
        }
      };
    }

    // 퍼센티지 계산
    const total = data.total_votes || 0;
    const stats: PredictionStats = {
      ...data,
      home_percentage: total > 0 ? Math.round((data.home_votes / total) * 100) : 0,
      draw_percentage: total > 0 ? Math.round((data.draw_votes / total) * 100) : 0,
      away_percentage: total > 0 ? Math.round((data.away_votes / total) * 100) : 0,
    };

    return {
      success: true,
      data: stats
    };

  } catch (error) {
    console.error('예측 통계 조회 오류:', error);
    return {
      success: false,
      error: '통계 조회 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 예측 삭제
 */
export async function deletePrediction(matchId: string): Promise<PredictionResponse> {
  try {
    const supabase = await createServerComponentClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    const { error } = await supabase
      .from('match_predictions')
      .delete()
      .eq('user_id', user.id)
      .eq('match_id', matchId);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // 캐시 무효화
    revalidatePath(`/livescore/football/match/${matchId}`);

    return {
      success: true,
      message: '예측이 삭제되었습니다.'
    };

  } catch (error) {
    console.error('예측 삭제 오류:', error);
    return {
      success: false,
      error: '예측 삭제 중 오류가 발생했습니다.'
    };
  }
}

// 캐싱된 함수들
export const getCachedUserPrediction = cache(getUserPrediction);
export const getCachedPredictionStats = cache(getPredictionStats); 