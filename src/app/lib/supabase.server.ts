import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// 서버 컴포넌트용 클라이언트 - 읽기 전용
export const createClient = async (): Promise<SupabaseClient<Database>> => {
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
    
    // Next.js 15에서 cookies()는 비동기 함수가 되었으므로 await 사용
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          }
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );
  } catch (error) {
    console.error('Supabase client creation error:', error);
    throw error; // 원래 오류를 그대로 전달하여 더 구체적인 오류 메시지 제공
  }
}; 