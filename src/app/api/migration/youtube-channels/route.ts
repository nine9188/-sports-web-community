import { createClient } from '@/app/lib/supabase.server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/app/lib/database.types';

// 현재 인증된 사용자를 가져오는 함수
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            return cookieStore.get(name)?.value;
          },
          async set(name, value, options) {
            await cookieStore.set(name, value, options);
          },
          async remove(name, options) {
            await cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch {
    return null;
  }
}

/**
 * youtube_channels 테이블 생성 마이그레이션
 */
export async function GET() {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 확인
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // 마이그레이션 쿼리
    const { error: migrationError } = await supabase.rpc('create_youtube_channels_table');
    
    if (migrationError) {
      // 테이블이 이미 존재하는 경우
      if (migrationError.message.includes('already exists')) {
        return NextResponse.json({
          message: 'youtube_channels 테이블이 이미 존재합니다.'
        });
      }
      
      throw migrationError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'youtube_channels 테이블이 생성되었습니다.'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: '마이그레이션 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 