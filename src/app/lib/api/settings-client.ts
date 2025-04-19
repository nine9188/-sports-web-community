'use client';

import { createClient } from '../supabase-browser';
import { getCurrentUserClient } from '../session-client';

/**
 * 클라이언트 컴포넌트 전용 - 사용자의 아이콘 정보를 가져오는 함수
 */
export async function getUserIconsClient() {
  try {
    const user = await getCurrentUserClient();
    if (!user) {
      return { icons: [], error: '로그인이 필요합니다.' };
    }

    const supabase = createClient();
    
    // 사용자 아이콘 목록 가져오기
    const { data, error } = await supabase
      .from('user_icons')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('아이콘 목록 조회 오류:', error);
      return { icons: [], error: '아이콘 목록을 불러올 수 없습니다.' };
    }
    
    return { icons: data || [], error: null };
  } catch (error) {
    console.error('아이콘 데이터 로딩 오류:', error);
    return { icons: [], error: '아이콘 정보를 불러오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 클라이언트 컴포넌트 전용 - 사용자의 포인트 정보를 가져오는 함수
 */
export async function getUserPointsDataClient() {
  try {
    const user = await getCurrentUserClient();
    if (!user) {
      return { points: 0, pointHistory: [], error: '로그인이 필요합니다.' };
    }

    const supabase = createClient();
    
    // 프로필에서 포인트 정보 가져오기
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('프로필 데이터 조회 오류 상세:', profileError.message, profileError.details);
      if (profileError.code === 'PGRST116') {
        // 프로필이 없는 경우 생성 시도
        try {
          await supabase.from('profiles').insert({
            id: user.id,
            exp: 0,
            level: 1,
            points: 0
          });
        } catch (insertError) {
          console.error('프로필 생성 실패:', insertError);
        }
      }
      
      // 기본값 설정
      return { points: 0, pointHistory: [], error: null };
    }
    
    const currentPoints = profileData?.points || 0;
    
    // 포인트 내역 조회
    let pointHistory = [];
    try {
      // 먼저 RPC 함수로 조회 시도
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_point_history', { 
          user_id: user.id 
        });
        
      if (!rpcError && rpcData) {
        pointHistory = rpcData;
      } else {
        // RPC 함수가 없으면 일반 쿼리로 시도
        const { data, error: historyError } = await supabase
          .from('point_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (historyError) {
          console.error('포인트 내역 조회 오류 상세:', historyError.message, historyError.details);
          return { points: currentPoints, pointHistory: [], error: '포인트 내역을 불러올 수 없습니다.' };
        }
        
        pointHistory = data || [];
      }
    } catch (historyQueryError) {
      console.error('포인트 내역 조회 중 예외 발생:', historyQueryError);
      return { points: currentPoints, pointHistory: [], error: '포인트 내역 조회 중 오류가 발생했습니다.' };
    }
    
    return { points: currentPoints, pointHistory, error: null };
  } catch (error) {
    console.error('포인트 데이터 로딩 오류 상세:', error);
    return { points: 0, pointHistory: [], error: '포인트 정보를 불러오는 중 오류가 발생했습니다.' };
  }
} 