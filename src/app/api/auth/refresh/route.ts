import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/app/lib/database.types';

/**
 * 토큰 갱신 API 라우트
 * 클라이언트에서 직접 갱신 대신 API 호출을 통해 쿠키 수정
 */
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { refresh_token } = requestData;
    
    if (!refresh_token) {
      return NextResponse.json(
        { error: '리프레시 토큰이 없습니다.' },
        { status: 400 }
      );
    }
    
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
    
    // 리프레시 토큰으로 세션 갱신
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });
    
    if (error) {
      console.error('세션 갱신 중 오류:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      session: {
        access_token: data.session?.access_token,
        expires_at: data.session?.expires_at,
        refresh_token: data.session?.refresh_token,
        user: data.session?.user
      }
    });
  } catch (error) {
    console.error('토큰 갱신 API 오류:', error);
    return NextResponse.json(
      { error: '세션 갱신 실패' },
      { status: 500 }
    );
  }
} 