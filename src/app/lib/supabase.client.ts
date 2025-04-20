import { createBrowserClient } from '@supabase/ssr';
import { Database } from './database.types';
import { SupabaseClient } from '@supabase/supabase-js';

// 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트
export const createClient = (): SupabaseClient<Database> => {
  // 환경변수 검증
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    }
  );
}; 