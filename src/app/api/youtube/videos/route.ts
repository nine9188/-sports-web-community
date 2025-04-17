import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase.server';

// 게시판 유튜브 데이터 가져오기
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardSlug = searchParams.get('boardSlug') || 'kbs-sports';
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    
    // Supabase 클라이언트 생성
    const supabase = await createClient();
    
    if (!supabase) {
      throw new Error("Supabase 클라이언트 생성 실패");
    }
    
    // 게시판 정보 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id, slug')
      .eq('slug', boardSlug)
      .single();
      
    if (boardError || !boardData) {
      // 게시판 정보를 가져오지 못하면 빈 배열 반환
      return NextResponse.json([]);
    }
    
    // 게시판 ID로 유튜브 영상 데이터 가져오기
    const query = supabase
      .from('posts')
      .select(`
        id, 
        title, 
        created_at, 
        content,
        profiles (
          id,
          nickname
        ),
        youtube_id,
        thumbnail_url
      `)
      .eq('board_id', boardData.id);
    
    // post_type 필드가 있는 경우에만 필터 적용
    try {
      // 먼저 post_type 필드 필터링을 시도
      const { data: postsData, error: postsError } = await query
        .eq('post_type', 'youtube')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // 결과가 있으면 사용
      if (!postsError && postsData && postsData.length > 0) {
        const formattedVideos = formatVideosData(postsData);
        return NextResponse.json(formattedVideos);
      }
      
      // 결과가 없으면 youtube_id가 있는 게시물 검색
      const { data: altData, error: altError } = await supabase
        .from('posts')
        .select(`
          id, 
          title, 
          created_at, 
          content,
          profiles (
            id,
            nickname
          ),
          youtube_id,
          thumbnail_url
        `)
        .eq('board_id', boardData.id)
        .not('youtube_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (altError || !altData || altData.length === 0) {
        return NextResponse.json([]);
      }
      
      const formattedAltVideos = formatVideosData(altData);
      return NextResponse.json(formattedAltVideos);
      
    } catch {
      return NextResponse.json([]);
    }
  } catch {
    // 오류 발생 시 빈 배열 반환
    return NextResponse.json([]);
  }
}

// 게시물 데이터 포맷팅 함수
interface PostData {
  id: string;
  title?: string;
  created_at?: string;
  youtube_id?: string;
  thumbnail_url?: string;
  profiles?: { id?: string; nickname?: string }[] | { id?: string; nickname?: string } | null;
}

function formatVideosData(postsData: PostData[]) {
  return postsData.map(post => {
    let thumbnailUrl = post.thumbnail_url;
    
    // 썸네일 URL이 없는 경우 YouTube ID가 있으면 YouTube 썸네일 URL 생성
    if (!thumbnailUrl && post.youtube_id) {
      thumbnailUrl = `https://img.youtube.com/vi/${post.youtube_id}/maxresdefault.jpg`;
    } else if (!thumbnailUrl) {
      // 기본 썸네일 사용
      thumbnailUrl = '/public/sample/youtube-placeholder.jpg';
    }
    
    // 프로필 정보 안전하게 추출
    const profileNickname = post.profiles && typeof post.profiles === 'object' 
      ? (Array.isArray(post.profiles) 
          ? (post.profiles[0]?.nickname || 'KBS 스포츠') 
          : (post.profiles as { nickname?: string }).nickname || 'KBS 스포츠')
      : 'KBS 스포츠';
    
    return {
      id: post.id,
      title: post.title || '제목 없음',
      thumbnailUrl: thumbnailUrl,
      channelTitle: profileNickname,
      publishedAt: post.created_at || new Date().toISOString(),
      videoId: post.youtube_id || ''
    };
  });
} 