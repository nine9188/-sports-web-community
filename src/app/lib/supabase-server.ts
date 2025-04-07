import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Database 타입 import 제거하고 대신 로컬에서 타입 정의
import { SupabaseClient } from '@supabase/supabase-js';

// 기본 Database 인터페이스 정의
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      posts: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      comments: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      // 기타 테이블들...
    };
    Functions: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  };
}

// 서버 컴포넌트용 클라이언트 - 읽기 전용
export const createClient = async (): Promise<SupabaseClient<Database>> => {
  try {
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          }
        }
      }
    );
  } catch (error) {
    console.error('Supabase client creation error:', error);
    throw new Error('Supabase client creation failed');
  }
};
