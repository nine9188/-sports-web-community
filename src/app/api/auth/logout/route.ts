import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/app/lib/database.types';

/**
 * 로그아웃 API 라우트
 * 클라이언트에서 직접 쿠키를 삭제하지 않고 API를 통해 처리
 */
export async function POST() {
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
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    // 로그아웃 처리
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('로그아웃 중 오류:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그아웃 API 오류:', error);
    return NextResponse.json(
      { error: '로그아웃 실패' },
      { status: 500 }
    );
  }
} 