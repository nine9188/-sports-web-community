'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';

// 클라이언트 인스턴스를 캐싱
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  // 이미 생성된 클라이언트가 있으면 재사용
  if (supabaseClient) {
    return supabaseClient;
  }
  
  // 환경변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  }
  
  // URL 유효성 확인
  try {
    new URL(supabaseUrl);
  } catch {
    console.error(`유효하지 않은 Supabase URL: ${supabaseUrl}`);
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL이 유효하지 않습니다: ${supabaseUrl}`);
  }
  
  supabaseClient = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,        // 브라우저 세션 지속성 비활성화
        autoRefreshToken: false,      // 자동 토큰 갱신 비활성화
        detectSessionInUrl: false,    // URL에서 세션 감지 비활성화
        flowType: 'pkce',
        // localStorage를 사용하도록 명시적 설정
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null;
            return JSON.parse(localStorage.getItem(key) || 'null');
          },
          setItem: (key, value) => {
            if (typeof window === 'undefined') return;
            localStorage.setItem(key, JSON.stringify(value));
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(key);
          }
        }
      }
    }
  );
  
  return supabaseClient;
};