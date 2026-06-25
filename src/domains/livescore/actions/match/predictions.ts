'use server';

import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { getSupabaseAction, getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';

export type PredictionType = 'home' | 'draw' | 'away';

export interface MatchPrediction {
  id: string;
  user_id: string;
  match_id: string;
  prediction_type: PredictionType;
  created_at: string;
  updated_at: string;
}

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

export interface PredictionResponse {
  success: boolean;
  data?: MatchPrediction | PredictionStats | null;
  error?: string;
  message?: string;
}

export async function savePrediction(
  matchId: string,
  predictionType: PredictionType,
  currentPath?: string
) {
  return createOrUpdatePrediction(matchId, predictionType, currentPath);
}

export async function createOrUpdatePrediction(
  matchId: string,
  predictionType: PredictionType,
  currentPath?: string
) {
  try {
    const supabase = await getSupabaseAction();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const { data: existingPrediction, error: selectError } = await supabase
      .from('match_predictions')
      .select('id, prediction_type')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      return { success: false, error: `예측 조회 실패: ${selectError.message}` };
    }

    if (existingPrediction) {
      if (existingPrediction.prediction_type === predictionType) {
        const { error: deleteError } = await supabase
          .from('match_predictions')
          .delete()
          .eq('id', existingPrediction.id);

        if (deleteError) {
          return { success: false, error: `예측 취소 실패: ${deleteError.message}` };
        }

        revalidatePath(currentPath || `/livescore/football/match/${matchId}`);
        return {
          success: true,
          message: '예측이 취소되었습니다.',
          action: 'removed',
          prediction: null,
          needsStatsUpdate: true,
        };
      }

      const { data, error: updateError } = await supabase
        .from('match_predictions')
        .update({
          prediction_type: predictionType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPrediction.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: `예측 변경 실패: ${updateError.message}` };
      }

      revalidatePath(currentPath || `/livescore/football/match/${matchId}`);
      return {
        success: true,
        message: '예측이 변경되었습니다.',
        action: 'updated',
        prediction: data,
        needsStatsUpdate: true,
      };
    }

    const { data, error: insertError } = await supabase
      .from('match_predictions')
      .insert({
        match_id: matchId,
        user_id: user.id,
        prediction_type: predictionType,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: `예측 저장 실패: ${insertError.message}` };
    }

    revalidatePath(currentPath || `/livescore/football/match/${matchId}`);
    return {
      success: true,
      message: '예측이 저장되었습니다.',
      action: 'created',
      prediction: data,
      needsStatsUpdate: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `예측 처리 중 오류가 발생했습니다: ${errorMessage}` };
  }
}

export async function updatePredictionStatsManually(matchId: string) {
  try {
    const supabase = getSupabaseAdmin();

    const { data: predictions, error: selectError } = await supabase
      .from('match_predictions')
      .select('prediction_type')
      .eq('match_id', matchId);

    if (selectError) {
      return { success: false, error: `예측 데이터 조회 실패: ${selectError.message}` };
    }

    const homeVotes = predictions?.filter((p) => p.prediction_type === 'home').length ?? 0;
    const drawVotes = predictions?.filter((p) => p.prediction_type === 'draw').length ?? 0;
    const awayVotes = predictions?.filter((p) => p.prediction_type === 'away').length ?? 0;
    const totalVotes = predictions?.length ?? 0;

    const { error: upsertError } = await supabase
      .from('match_prediction_stats')
      .upsert({
        match_id: matchId,
        home_votes: homeVotes,
        draw_votes: drawVotes,
        away_votes: awayVotes,
        total_votes: totalVotes,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      return { success: false, error: `예측 통계 갱신 실패: ${upsertError.message}` };
    }

    return { success: true, message: '예측 통계가 갱신되었습니다.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `예측 통계 갱신 중 오류: ${errorMessage}` };
  }
}

export const getPredictionStats = cache(async (matchId: string) => {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('match_prediction_stats')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, data: null, error: `DB 오류: ${error.message}` };
    }

    const stats = data || {
      match_id: matchId,
      home_votes: 0,
      draw_votes: 0,
      away_votes: 0,
      total_votes: 0,
      updated_at: new Date().toISOString(),
    };

    const totalVotes = stats.total_votes || 0;
    const homePercentage = totalVotes > 0 ? Math.round(((stats.home_votes || 0) / totalVotes) * 100) : 0;
    const drawPercentage = totalVotes > 0 ? Math.round(((stats.draw_votes || 0) / totalVotes) * 100) : 0;
    const awayPercentage = totalVotes > 0 ? Math.round(((stats.away_votes || 0) / totalVotes) * 100) : 0;

    return {
      success: true,
      data: {
        ...stats,
        home_percentage: homePercentage,
        draw_percentage: drawPercentage,
        away_percentage: awayPercentage,
      },
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, data: null, error: `예측 통계를 불러오는 중 오류가 발생했습니다: ${errorMessage}` };
  }
});

export const getUserPrediction = cache(async (matchId: string) => {
  try {
    const supabase = await getSupabaseServer();
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

    if (error && error.code !== 'PGRST116') {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch {
    return { success: false, data: null, error: '예측 정보를 불러오는 중 오류가 발생했습니다.' };
  }
});

export async function deletePrediction(matchId: string, currentPath?: string) {
  try {
    const supabase = await getSupabaseAction();
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

    await updatePredictionStatsManually(matchId);
    revalidatePath(currentPath || `/livescore/football/match/${matchId}`);

    return { success: true };
  } catch {
    return { success: false, error: '예측 삭제 중 오류가 발생했습니다.' };
  }
}
