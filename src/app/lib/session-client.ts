'use client';

import { User } from '@supabase/supabase-js';
import { createClient } from './supabase-browser';

/**
 * 클라이언트 컴포넌트 전용 - 현재 인증된 사용자를 가져오는 함수
 * 서버 컴포넌트에서는 session.ts의 getCurrentUser()를 사용하세요.
 */
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    const supabase = createClient();
    
    // 세션 데이터 조회
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('클라이언트: 사용자 인증 정보 확인 중 오류:', error);
    return null;
  }
} 