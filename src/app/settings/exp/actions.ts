'use server';

import { createClient } from '@/app/lib/supabase.server';

// 경험치 내역 아이템 타입 정의
export interface ExpHistoryItem {
  id: number;
  created_at: string;
  exp: number;        // points 대신 exp 필드 사용
  reason: string;
  user_id: string;
  admin_id?: string;
  type?: 'earn' | 'spend'; // 타입 필드는 없지만 UI를 위해 생성
}

// 응답 타입 정의
interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 사용자의 경험치 내역을 가져오는 함수
 * @param userId 사용자 ID
 * @param limit 최대 가져올 내역 수
 * @returns 경험치 내역 데이터와 함께 성공 여부를 담은 응답
 */
export async function getUserExpHistory(
  userId: string,
  limit: number = 10
): Promise<ActionResponse<ExpHistoryItem[]>> {
  try {
    console.log(`경험치 내역 조회 시도: 사용자 ID ${userId}, 한도 ${limit}`);
    
    const supabase = await createClient();
    
    // exp_history 테이블에서 사용자의 경험치 내역 조회
    const { data, error } = await supabase
      .from('exp_history')
      .select('id, created_at, exp, reason, user_id, admin_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('경험치 내역 DB 조회 오류:', error);
      throw new Error(error.message);
    }
    
    console.log(`경험치 내역 조회 결과: ${data?.length || 0}개 항목 발견`);
    
    // 경험치 내역이 없으면 빈 배열 반환 또는 테스트 데이터 생성
    if (!data || data.length === 0) {
      console.log('경험치 내역이 없습니다.');
      
      // 테스트 데이터 추가 (실제 프로덕션에서는 제거)
      const testData: ExpHistoryItem[] = [
        {
          id: 1,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
          exp: 25,
          reason: '로그인 보상',
          user_id: userId,
          type: 'earn'
        },
        {
          id: 2,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1일 전
          exp: 50,
          reason: '퀘스트 완료',
          user_id: userId,
          type: 'earn'
        },
        {
          id: 3,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3일 전
          exp: 100,
          reason: '첫 댓글 작성',
          user_id: userId,
          type: 'earn'
        }
      ];
      
      return { 
        success: true, 
        data: testData,
        error: '실제 데이터가 없어 테스트 데이터를 반환합니다.'
      };
    }
    
    // exp 값에 따라 type 필드 추가 (양수면 earn, 음수면 spend)
    const processedData = data.map(item => ({
      ...item,
      type: item.exp >= 0 ? 'earn' : 'spend'
    })) as ExpHistoryItem[];
    
    return { 
      success: true, 
      data: processedData
    };
  } catch (error) {
    console.error('경험치 내역 조회 처리 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '경험치 내역을 가져오는 중 오류가 발생했습니다.',
      data: [] // 실패해도 빈 배열 제공
    };
  }
} 