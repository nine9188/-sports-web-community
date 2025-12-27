'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

// 포인트 내역 아이템 타입 정의
export interface PointHistoryItem {
  id: string;
  created_at: string;
  points: number;
  reason: string;
  user_id: string;
  admin_id?: string;
  type?: 'earn' | 'spend';
}

// 응답 타입 정의
interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 사용자의 포인트 정보를 가져오는 함수
 * @param userId 사용자 ID
 * @returns 사용자의 포인트 및 레벨 정보
 */
export async function getUserPointInfo(userId: string): Promise<ActionResponse<{ points: number; level: number }>> {
  try {
    const supabase = await getSupabaseServer();
    
    // 사용자 프로필에서 포인트 및 레벨 정보 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('points, level')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('포인트 정보 조회 오류:', error);
      throw new Error(error.message);
    }
    
    return {
      success: true,
      data: {
        points: data?.points || 0,
        level: data?.level || 1
      }
    };
  } catch (error) {
    console.error('포인트 정보 조회 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '포인트 정보를 가져오는 중 오류가 발생했습니다.',
      data: { points: 0, level: 1 }
    };
  }
}

/**
 * 사용자의 포인트 내역을 가져오는 함수
 * @param userId 사용자 ID
 * @param limit 최대 가져올 내역 수
 * @returns 포인트 내역 데이터와 함께 성공 여부를 담은 응답
 */
export async function getUserPointHistory(
  userId: string,
  limit: number = 10
): Promise<ActionResponse<PointHistoryItem[]>> {
  try {
    const supabase = await getSupabaseServer();
    
    // point_history 테이블에서 사용자의 포인트 내역 조회
    const { data, error } = await supabase
      .from('point_history')
      .select('id, created_at, points, reason, user_id, admin_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('포인트 내역 DB 조회 오류:', error);
      throw new Error(error.message);
    }
    
    // 포인트 내역이 없으면 빈 배열 반환 또는 테스트 데이터 생성
    if (!data || data.length === 0) {
      
      // 테스트 데이터 추가 (실제 프로덕션에서는 제거)
      const testData: PointHistoryItem[] = [
        {
          id: "1",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
          points: 100,
          reason: '로그인 보상',
          user_id: userId,
          type: 'earn'
        },
        {
          id: "2",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2일 전
          points: 50,
          reason: '댓글 작성 보상',
          user_id: userId,
          type: 'earn'
        },
        {
          id: "3",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5일 전
          points: -200, // 음수는 차감
          reason: '아이콘 구매',
          user_id: userId,
          type: 'spend'
        }
      ];
      
      return { 
        success: true, 
        data: testData,
        error: '실제 데이터가 없어 테스트 데이터를 반환합니다.'
      };
    }
    
    // points 값에 따라 type 필드 추가 (양수면 earn, 음수면 spend)
    const processedData = data.map(item => ({
      ...item,
      type: item.points >= 0 ? 'earn' : 'spend'
    })) as PointHistoryItem[];
    
    return { 
      success: true, 
      data: processedData
    };
  } catch (error) {
    console.error('포인트 내역 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '포인트 내역을 가져오는 중 오류가 발생했습니다.',
      data: [] // 실패해도 빈 배열 제공
    };
  }
} 