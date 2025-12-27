import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// 유튜브 비디오 데이터 인터페이스
export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  videoId: string;
  post_number: number;
}

// 서버측에서 유튜브 데이터를 가져오는 함수
export async function fetchYouTubeVideos(boardSlug: string): Promise<YouTubeVideo[]> {
  try {
    // 타임아웃 Promise 생성 (8초)
    const timeoutPromise = new Promise<YouTubeVideo[]>((resolve) => {
      setTimeout(() => {
        resolve([]); // 빈 배열 반환
      }, 8000);
    });
    
    // 데이터 가져오기 Promise
    const fetchPromise = (async () => {
      const supabase = await getSupabaseServer();
      
      if (!supabase) {
        return [];
      }
      
      // 게시판 정보 가져오기
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('id, slug')
        .eq('slug', boardSlug)
        .single();
        
      if (boardError || !boardData) {
        return [];
      }
      
      // 게시판 ID로 유튜브 영상 데이터 가져오기 (post_type이 youtube인 게시물)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, 
          title, 
          created_at, 
          content,
          post_number,
          profiles (
            id,
            nickname
          ),
          meta
        `)
        .eq('board_id', boardData.id)
        .eq('post_type', 'youtube')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // post_type이 youtube인 게시물이 있으면 사용
      if (!postsError && postsData && postsData.length > 0) {
        return formatVideosData(postsData);
      }
      
      // youtube_id가 있는 게시물 검색 (meta 필드 사용)
      const { data: altData, error: altError } = await supabase
        .from('posts')
        .select(`
          id, 
          title, 
          created_at, 
          content,
          post_number,
          profiles (
            id,
            nickname
          ),
          meta
        `)
        .eq('board_id', boardData.id)
        .not('meta', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (altError || !altData || altData.length === 0) {
        // 게시물 내용에서 유튜브 URL을 검색
        return await searchYoutubeUrlsInPosts(supabase, boardData.id);
      }
      
      // meta 필드에서 youtube_id가 있는 게시물 필터링
      const youtubePostsFromMeta = altData.filter(post => 
        post.meta && 
        typeof post.meta === 'object' && 
        (post.meta as Record<string, unknown>).youtube_id
      );
      
      if (youtubePostsFromMeta.length > 0) {
        return formatVideosData(youtubePostsFromMeta);
      }
      
      // meta에서 찾지 못하면 content에서 검색
      return await searchYoutubeUrlsInPosts(supabase, boardData.id);
    })();
    
    // 두 Promise 중 먼저 완료되는 것을 반환
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('유튜브 데이터 가져오기 오류:', error);
    return [];
  }
}

// 게시물 내용에서 유튜브 URL을 검색하여 유튜브 비디오 데이터 생성
async function searchYoutubeUrlsInPosts(supabase: SupabaseClient, boardId: string): Promise<YouTubeVideo[]> {
  try {
    // 게시판의 모든 게시물 가져오기 (제한된 수량)
    const { data: allPosts } = await supabase
      .from('posts')
      .select(`
        id, 
        title, 
        created_at,
        content,
        post_number,
        profiles (
          id,
          nickname
        ),
        meta
      `)
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
      .limit(20); // 최근 20개 게시물만 검색
    
    if (!allPosts || allPosts.length === 0) {
      return [];
    }
    
    // 게시물 내용에서 유튜브 URL을 검색하여 유튜브 비디오 데이터 생성
    const youtubeVideos: YouTubeVideo[] = [];
    
    // 각 게시물 검사
    for (const post of allPosts) {
      // 1. 먼저 meta 필드에서 youtube_id 확인
      if (post.meta && typeof post.meta === 'object' && post.meta.youtube_id) {
        const videoId = post.meta.youtube_id;
        const thumbnailUrl = post.meta.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        const profileNickname = post.profiles && typeof post.profiles === 'object' 
          ? (Array.isArray(post.profiles) 
              ? (post.profiles[0]?.nickname || 'KBS 스포츠') 
              : (post.profiles as { nickname?: string }).nickname || 'KBS 스포츠')
          : 'KBS 스포츠';
        
        youtubeVideos.push({
          id: post.id,
          title: post.title || '제목 없음',
          thumbnailUrl: thumbnailUrl,
          channelTitle: profileNickname,
          publishedAt: post.created_at || new Date().toISOString(),
          videoId: videoId,
          post_number: post.post_number || 0
        });
        
        // 5개 찾으면 중단
        if (youtubeVideos.length >= 5) {
          break;
        }
        continue;
      }
      
      // 2. 내용에서 유튜브 URL 검색
      if (!post.content) continue;
      
      // HTML 형식의 내용인 경우 (JSON 문자열로 저장되어 있을 수 있음)
      let contentToSearch = post.content;
      
      try {
        // JSON 형식으로 저장된 경우 파싱 시도
        if (post.content.startsWith('{') || post.content.startsWith('[')) {
          const parsedContent = JSON.parse(post.content);
          
          // JSON 객체가 content 필드를 가지고 있는지 확인
          if (parsedContent.content) {
            contentToSearch = parsedContent.content;
          } else if (typeof parsedContent === 'object') {
            // 객체를 문자열로 변환
            contentToSearch = JSON.stringify(parsedContent);
          }
        }
      } catch {
        // JSON 파싱 실패는 무시하고 원본 content 사용
      }
      
      // 유튜브 URL 패턴 찾기 (다양한 패턴 지원)
      const youtubeUrls = findYoutubeUrls(contentToSearch);
      
      if (youtubeUrls.length > 0) {
        // 첫 번째 유튜브 URL만 사용
        const url = youtubeUrls[0];
        const videoId = extractVideoId(url);
        
        if (videoId) {
          const profileNickname = post.profiles && typeof post.profiles === 'object' 
            ? (Array.isArray(post.profiles) 
                ? (post.profiles[0]?.nickname || 'KBS 스포츠') 
                : (post.profiles as { nickname?: string }).nickname || 'KBS 스포츠')
            : 'KBS 스포츠';
          
          youtubeVideos.push({
            id: post.id,
            title: post.title || '제목 없음',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            channelTitle: profileNickname,
            publishedAt: post.created_at || new Date().toISOString(),
            videoId: videoId,
            post_number: post.post_number || 0
          });
          
          // 5개 찾으면 중단
          if (youtubeVideos.length >= 5) {
            break;
          }
        }
      }
    }
    
    return youtubeVideos;
  } catch (error) {
    console.error('유튜브 URL 검색 오류:', error);
    return [];
  }
}

// 유튜브 URL 검색 함수
function findYoutubeUrls(content: string): string[] {
  if (!content) return [];
  
  // HTML 태그 제거
  const textContent = content.replace(/<[^>]*>/g, ' ');
  
  // 다양한 유튜브 URL 패턴 찾기
  const patterns = [
    /https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/g,  // youtube.com/watch?v=
    /https?:\/\/(www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}/g,              // youtu.be/
    /https?:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/g,    // youtube.com/embed/
    /youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/g,                     // without http(s)
    /youtu\.be\/[a-zA-Z0-9_-]{11}/g                                 // without http(s)
  ];
  
  let matches: string[] = [];
  
  // 각 패턴으로 검색
  for (const pattern of patterns) {
    const found = textContent.match(pattern);
    if (found) {
      matches = [...matches, ...found];
    }
  }
  
  // 중복 제거
  return [...new Set(matches)];
}

// 유튜브 URL에서 비디오 ID 추출
function extractVideoId(url: string): string | null {
  // youtu.be/videoId 형식
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  
  // youtube.com/watch?v=videoId 형식
  if (url.includes('youtube.com/watch')) {
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  
  // youtube.com/embed/videoId 형식
  if (url.includes('/embed/')) {
    const match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  
  return null;
}

// 게시물 데이터 포맷팅 함수
interface PostData {
  id: string;
  title?: string;
  created_at?: string | null;
  post_number?: number;
  profiles?: { id: string; nickname: string | null } | null;
  meta?: unknown | null;
}

function formatVideosData(postsData: PostData[]): YouTubeVideo[] {
  return postsData.map(post => {
    // meta 필드에서 youtube_id와 thumbnail_url 추출
    const meta = post.meta as Record<string, unknown> | null;
    const youtubeId = meta?.youtube_id as string || '';
    let thumbnailUrl = meta?.thumbnail_url as string;
    
    // 썸네일 URL이 없는 경우 YouTube ID가 있으면 YouTube 썸네일 URL 생성
    if (!thumbnailUrl && youtubeId) {
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    } else if (!thumbnailUrl) {
      // 기본 썸네일 사용
      thumbnailUrl = '/public/sample/youtube-placeholder.jpg';
    }
    
    // 프로필 정보 안전하게 추출
    const profileNickname = post.profiles?.nickname || 'KBS 스포츠';
    
    return {
      id: post.id,
      title: post.title || '제목 없음',
      thumbnailUrl: thumbnailUrl,
      channelTitle: profileNickname,
      publishedAt: post.created_at || new Date().toISOString(),
      videoId: youtubeId,
      post_number: post.post_number || 0
    };
  });
} 