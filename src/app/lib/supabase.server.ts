import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { CookieOptions } from '@supabase/ssr';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

// Supabase 공통 설정 유효성 검사 함수
const validateSupabaseConfig = () => {
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
  
  return { supabaseUrl, supabaseAnonKey };
};

// 1. 읽기 전용 클라이언트: 서버 컴포넌트에서 사용 (쿠키 설정 시도 차단)
export const createReadOnlyClient = async (): Promise<SupabaseClient<Database>> => {
  try {
    const { supabaseUrl, supabaseAnonKey } = validateSupabaseConfig();
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            const cookieList = cookieStore.getAll();
            return cookieList.map((cookie: ResponseCookie) => ({
              name: cookie.name,
              value: cookie.value
            }));
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookies: { name: string; value: string; options?: CookieOptions }[]) {
            // 서버 컴포넌트에서는 쿠키 설정을 시도하지 않음 (무시)
          }
        },
        auth: {
          persistSession: false, // 세션 유지 시도 없음
          autoRefreshToken: false
        }
      }
    );
  } catch (error) {
    console.error('Supabase 읽기 전용 클라이언트 생성 오류:', error);
    throw error;
  }
};

// 2. 쓰기 가능 클라이언트: 서버 액션/라우트 핸들러에서 사용 (쿠키 설정 가능)
export const createMutableClient = async (): Promise<SupabaseClient<Database>> => {
  try {
    const { supabaseUrl, supabaseAnonKey } = validateSupabaseConfig();
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            const cookieList = cookieStore.getAll();
            return cookieList.map((cookie: ResponseCookie) => ({
              name: cookie.name,
              value: cookie.value
            }));
          },
          setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
            cookies.forEach(({ name, value, options }) => {
              try {
                cookieStore.set({ name, value, ...options });
              } catch {
                // 에러 무시 (필요한 경우에만 로깅)
              }
            });
          }
        },
        auth: {
          persistSession: true, // 세션 유지 허용
          autoRefreshToken: true
        }
      }
    );
  } catch (error) {
    console.error('Supabase 변경 가능 클라이언트 생성 오류:', error);
    throw error;
  }
};

// 서버 컴포넌트 또는 서버 액션에서 컨텍스트에 따라 적절한 클라이언트 생성
export const createSafeClient = (isServerAction = false): Promise<SupabaseClient<Database>> => {
  return isServerAction ? createMutableClient() : createReadOnlyClient();
};

// 하위 호환성을 위한 기본 클라이언트 (읽기 전용으로 설정)
export const createClient = async (): Promise<SupabaseClient<Database>> => {
  return createReadOnlyClient();
};

// 기존 cookieStore 버전 - 하위 호환성 유지
export const createClientWithCookies = (cookieStore: ReadonlyRequestCookies): SupabaseClient<Database> => {
  try {
    const { supabaseUrl, supabaseAnonKey } = validateSupabaseConfig();
    
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            const cookieList = cookieStore.getAll();
            return cookieList.map((cookie: ResponseCookie) => ({
              name: cookie.name,
              value: cookie.value
            }));
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookies: { name: string; value: string; options?: CookieOptions }[]) {
            // 서버 컴포넌트에서는 쿠키 설정을 시도하지 않음 (무시)
          }
        },
        auth: {
          persistSession: false, // 세션 유지 시도 없음
          autoRefreshToken: false
        }
      }
    );
  } catch (error) {
    console.error('Supabase 클라이언트 생성 오류:', error);
    throw error;
  }
}; 