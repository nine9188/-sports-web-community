import { createClient } from '@/app/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
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

// YouTube API를 사용하여 재생목록 정보를 확인하는 함수
async function verifyYoutubePlaylist(apiKey: string, playlistId: string) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || '유튜브 API 요청 실패');
    }
    
    if (!data.items || data.items.length === 0) {
      throw new Error('재생목록을 찾을 수 없습니다. 재생목록 ID를 확인해주세요.');
    }
    
    // 재생목록 정보 반환
    const playlist = data.items[0];
    return {
      id: playlist.id,
      title: playlist.snippet.title,
      description: playlist.snippet.description,
      thumbnails: playlist.snippet.thumbnails,
      channelId: playlist.snippet.channelId,
      channelTitle: playlist.snippet.channelTitle,
    };
  } catch (error) {
    console.error('유튜브 재생목록 확인 오류:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
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
    
    // 쿼리 파라미터 확인
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    const playlistId = searchParams.get('playlistId');
    
    if (!apiKey || !playlistId) {
      return NextResponse.json(
        { error: 'API 키와 재생목록 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 유튜브 재생목록 확인
    const playlistInfo = await verifyYoutubePlaylist(apiKey, playlistId);
    
    return NextResponse.json({ success: true, playlist: playlistInfo });
  } catch (error) {
    console.error('재생목록 확인 API 오류:', error);
    return NextResponse.json(
      { 
        error: '재생목록 확인 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 