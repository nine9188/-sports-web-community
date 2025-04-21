import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/app/lib/database.types';
import { User } from '@supabase/supabase-js';

/**
 * 서버 컴포넌트 전용 - API 라우트에서 현재 인증된 사용자를 가져오는 함수
 * 클라이언트 컴포넌트에서는 절대 직접 호출하지 마세요.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // 서버 컴포넌트에서 쿠키 설정 오류는 무시
              if (process.env.NODE_ENV === 'development') {
                console.debug('서버 컴포넌트에서 쿠키 설정 시도 무시:', name);
              }
            }
          },
          remove(name, options) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch {
              // 서버 컴포넌트에서 쿠키 삭제 오류는 무시
              if (process.env.NODE_ENV === 'development') {
                console.debug('서버 컴포넌트에서 쿠키 삭제 시도 무시:', name);
              }
            }
          },
        },
      }
    );
    
    // 세션 데이터 조회
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('사용자 인증 정보 확인 중 오류:', error);
    return null;
  }
} 