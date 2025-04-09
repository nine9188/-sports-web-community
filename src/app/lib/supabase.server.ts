import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// 서버 컴포넌트용 클라이언트 - 읽기 전용
export const createClient = async (): Promise<SupabaseClient<Database>> => {
  try {
    // Next.js 15에서 cookies()는 비동기 함수가 되었으므로 await 사용
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    throw new Error('Supabase client creation failed');
  }
}; 