import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * cookies() API를 사용하지 않는 Supabase 클라이언트 생성 
 * 미들웨어나 클라이언트 컴포넌트에서 안전하게 사용 가능
 */
export const createClientWithoutCookies = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // 쿠키 접근이 없으므로 세션 유지는 하지 않음
      autoRefreshToken: false
    }
  });
}; 