import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database.types';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

// 서버 컴포넌트용 클라이언트 - 읽기 전용 (쿠키스토어 직접 전달)
export const createClientWithCookies = (cookieStore: ReadonlyRequestCookies): SupabaseClient<Database> => {
  try {
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
      throw new Error(`NEXT_PUBLIC_SUPABASE_URL이 유효하지 않습니다: ${supabaseUrl}`);
    }
    
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.warn('서버 컴포넌트에서 쿠키 설정 시도:', error);
              // 오류 발생 시 쿠키 설정 무시 (서버 액션에서 처리 예정)
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            } catch (error) {
              console.warn('서버 컴포넌트에서 쿠키 삭제 시도:', error);
              // 오류 발생 시 쿠키 삭제 무시 (서버 액션에서 처리 예정)
            }
          }
        },
        auth: {
          persistSession: true,
          autoRefreshToken: false
        }
      }
    );
  } catch (error) {
    console.error('Supabase client creation error:', error);
    throw error; // 원래 오류를 그대로 전달하여 더 구체적인 오류 메시지 제공
  }
};

// 서버 컴포넌트/액션에서 바로 사용할 수 있는 함수
export const createClient = async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = await cookies();
  return createClientWithCookies(cookieStore);
}; 