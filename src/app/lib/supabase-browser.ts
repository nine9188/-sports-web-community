'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';
import { validateSupabaseConfig } from './supabase-helper';

// 클라이언트 인스턴스를 캐싱
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  // 이미 생성된 클라이언트가 있으면 재사용
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    // 환경변수 검증
    const { supabaseUrl, supabaseAnonKey } = validateSupabaseConfig();
    
    supabaseClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,         // 브라우저 세션 지속성 활성화
          autoRefreshToken: true,       // 자동 토큰 갱신 활성화
          detectSessionInUrl: true,     // URL에서 세션 감지 활성화
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
  } catch (error) {
    console.error('Supabase 클라이언트 생성 오류:', error);
    throw error;
  }
};