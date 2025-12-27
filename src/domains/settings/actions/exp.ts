'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { ActionResponse, ExpHistoryItem, ExpLevelInfo } from '../types';

/**
 * 사용자의 경험치 내역을 조회하는 함수
 * @param userId 사용자 ID
 * @param limit 조회할 항목 수 (기본값: 10)
 * @returns 경험치 내역 데이터
 */
export async function getUserExpHistory(
  userId: string,
  limit = 10
): Promise<ActionResponse<ExpHistoryItem[]>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: '사용자 ID가 필요합니다.',
        data: []
      };
    }
    
    const supabase = await getSupabaseServer();
    
    // 실제 exp_history 테이블 구조를 기반으로 쿼리 수정
    const { data, error } = await supabase
      .from('exp_history')
      .select('id, exp, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('경험치 내역 조회 오류:', error);
      return { 
        success: false, 
        error: error.message || '경험치 내역을 불러오는데 실패했습니다.',
        data: []
      };
    }
    
    // 데이터 변환 - 실제 컬럼명(exp)을 amount로 매핑
    const historyItems: ExpHistoryItem[] = data.map(item => ({
      id: item.id,
      created_at: item.created_at,
      reason: item.reason || '경험치 획득',
      amount: item.exp // exp를 amount로 매핑
    }));
    
    return {
      success: true,
      data: historyItems
    };
  } catch (error) {
    console.error('경험치 내역 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '경험치 내역을 불러오는데 실패했습니다.',
      data: []
    };
  }
}

/**
 * 사용자의 경험치 및 레벨 정보를 조회하는 함수
 * @param userId 사용자 ID
 * @returns 경험치 및 레벨 정보
 */
export async function getUserExpLevel(
  userId: string
): Promise<ActionResponse<ExpLevelInfo>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: '사용자 ID가 필요합니다.',
        data: { exp: 0, level: 1 }
      };
    }
    
    const supabase = await getSupabaseServer();
    
    // 프로필에서 경험치 정보 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('exp, level')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('경험치 레벨 조회 오류:', error);
      return { 
        success: false, 
        error: error.message || '경험치 정보를 불러오는데 실패했습니다.',
        data: { exp: 0, level: 1 }
      };
    }
    
    return {
      success: true,
      data: {
        exp: data?.exp || 0,
        level: data?.level || 1
      }
    };
  } catch (error) {
    console.error('경험치 레벨 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '경험치 정보를 불러오는데 실패했습니다.',
      data: { exp: 0, level: 1 }
    };
  }
}
