import { createClient } from './lib/supabase.server';
import AllPostsWidget from './components/widgets/all-posts-widget'
import LiveScoreWidget from './components/widgets/live-score-widget';
import NewsWidget from './components/widgets/news-widget';
import YouTubeWidget from './components/widgets/youtube-widget';
import NavBoardSelector from './components/navigation/NavBoardSelector';
import { fetchCachedMultiDayMatches, MatchData } from './actions/footballApi';

// API 응답 타입 정의
interface MultiDayMatchesResult {
  success: boolean;
  dates?: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
  meta?: {
    totalMatches: number;
  };
  data?: {
    yesterday: { matches: MatchData[] };
    today: { matches: MatchData[] };
    tomorrow: { matches: MatchData[] };
  };
  error?: string;
}

// CombinedPost 인터페이스 정의 (all-posts-widget.tsx와 동일하게 유지)
interface CombinedPost {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  author_nickname: string;
  author_id: string;
  views: number;
  likes: number;
  comment_count: number;
  content: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
}

// 안전한 fallback 게시물 데이터 생성 함수
function createFallbackPost(index: number): CombinedPost {
  return {
    id: `fallback-${index}`,
    title: '게시물을 불러오는 중입니다...',
    created_at: new Date().toISOString(),
    board_id: 'fallback',
    board_name: '로딩 중',
    board_slug: 'loading',
    post_number: index,
    author_nickname: '시스템',
    author_id: 'system',
    views: 0,
    likes: 0,
    comment_count: 0,
    content: '게시물 데이터를 불러오는 중 문제가 발생했습니다.',
    team_id: null,
    league_id: null,
    team_logo: null,
    league_logo: null
  };
}

export const revalidate = 60; // 1분마다 데이터 갱신
export const dynamic = 'force-dynamic'; // 항상 동적으로 렌더링

async function fetchInitialPosts(): Promise<CombinedPost[]> {
  try {
    const supabase = await createClient();
    
    // Supabase 서버 클라이언트 생성 확인
    if (!supabase) {
      return Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
    }
    
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id, 
        title, 
        created_at, 
        board_id,
        views,
        likes,
        post_number, 
        profiles (
          id,
          nickname
        ),
        content
      `)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (postsError) {
      return Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
    }

    // postsData가 null인 경우 빈 배열 반환
    const validPosts = postsData || [];
    if (validPosts.length === 0) {
      return Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
    }

    // 게시판 정보 가져오기 (null 체크 추가)
    const boardIds = [...new Set(validPosts.map(post => post.board_id).filter(id => id != null))];
    let boardsData: { id: string; name: string; team_id?: string | null; league_id?: string | null; slug: string }[] = [];
    
    if (boardIds.length > 0) {
      const { data, error: boardsError } = await supabase
        .from('boards')
        .select('id, name, team_id, league_id, slug')
        .in('id', boardIds);
        
      if (!boardsError) {
        boardsData = data || [];
      }
    }

    const boardMap: Record<string, { name: string; team_id?: string | null; league_id?: string | null; slug: string }> = {};
    boardsData.forEach(board => {
      if (board && board.id) {
        boardMap[board.id] = {
          name: board.name || '',
          team_id: board.team_id,
          league_id: board.league_id,
          slug: board.slug || board.id
        };
      }
    });

    // 팀/리그 로고 가져오기 - 오류 발생해도 계속 진행
    const teamIds = boardsData.map(b => b.team_id).filter(Boolean);
    const leagueIds = boardsData.map(b => b.league_id).filter(Boolean);
    const teamLogoMap: Record<string, string> = {};
    const leagueLogoMap: Record<string, string> = {};

    try {
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase.from('teams').select('id, logo').in('id', teamIds);
        (teamsData || []).forEach(t => { if (t.id) teamLogoMap[t.id] = t.logo || '' });
      }
    } catch {
      // 오류 무시하고 계속 진행
    }
    
    try {
      if (leagueIds.length > 0) {
        const { data: leaguesData } = await supabase.from('leagues').select('id, logo').in('id', leagueIds);
        (leaguesData || []).forEach(l => { if (l.id) leagueLogoMap[l.id] = l.logo || '' });
      }
    } catch {
      // 오류 무시하고 계속 진행
    }

    // 댓글 수 가져오기 - 오류 발생해도 계속 진행
    const postIds = validPosts.map(p => p.id).filter(Boolean);
    const commentCounts: Record<string, number> = {};
    
    try {
      if (postIds.length > 0) {
        const counts = await Promise.all(postIds.map(async postId => {
          try {
            const { count } = await supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', postId);
            return { postId, count: count || 0 };
          } catch {
            return { postId, count: 0 };
          }
        }));
        counts.forEach(({ postId, count }) => { commentCounts[postId] = count });
      }
    } catch {
      // 오류 무시하고 계속 진행
    }

    // 최종 데이터 형성
    return validPosts.map(post => {
      const boardInfo = post.board_id ? (boardMap[post.board_id] || { name: '알 수 없음', slug: post.board_id }) : { name: '알 수 없음', slug: '' };
      
      // profiles 필드 타입 처리 (배열 또는 객체 가능성 고려)
      let profileObj: { id?: string; nickname?: string } = {};
      if (Array.isArray(post.profiles) && post.profiles.length > 0) {
        profileObj = post.profiles[0] || {};
      } else if (post.profiles && typeof post.profiles === 'object' && !Array.isArray(post.profiles)) {
        profileObj = post.profiles;
      }

      return {
        id: post.id || '',
        title: post.title || '',
        created_at: post.created_at || '',
        board_id: post.board_id || '',
        board_name: boardInfo.name,
        board_slug: boardInfo.slug,
        post_number: post.post_number || 0,
        author_nickname: profileObj.nickname || '익명',
        author_id: profileObj.id || '',
        views: post.views || 0,
        likes: post.likes || 0,
        comment_count: commentCounts[post.id] || 0,
        content: post.content || '',
        team_id: boardInfo.team_id,
        league_id: boardInfo.league_id,
        team_logo: boardInfo.team_id ? teamLogoMap[boardInfo.team_id] : null,
        league_logo: boardInfo.league_id ? leagueLogoMap[boardInfo.league_id] : null
      };
    }).filter(p => p.id);

  } catch {
    // 오류 발생 시 더미 데이터 반환
    return Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
  }
}

// 서버 컴포넌트에서 경기 데이터 가져오기
async function fetchLiveScores(): Promise<MatchData[]> {
  try {
    // 서버 액션을 사용하여 경기 데이터 가져오기
    const result = await fetchCachedMultiDayMatches() as MultiDayMatchesResult;
    
    if (result.success && result.data) {
      // 어제, 오늘, 내일 경기 데이터 모두 합치기
      const allMatches = [
        ...((result.data.yesterday?.matches || []).map((match: MatchData) => ({
          ...match,
          displayDate: '어제'
        }))),
        ...((result.data.today?.matches || []).map((match: MatchData) => ({
          ...match,
          displayDate: '오늘'
        }))),
        ...((result.data.tomorrow?.matches || []).map((match: MatchData) => ({
          ...match,
          displayDate: '내일'
        })))
      ];
      
      return allMatches;
    }
    
    return [];
  } catch (error) {
    console.error('라이브스코어 데이터 가져오기 오류:', error);
    return [];
  }
}

interface YouTubeVideoData {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  videoId: string;
  post_number: number;
}

// 서버측에서 유튜브 데이터를 가져오는 함수
async function fetchYouTubeVideos(boardSlug: string): Promise<YouTubeVideoData[]> {
  try {
    // 1. 먼저 API 엔드포인트를 통해 유튜브 데이터 가져오기 시도
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/youtube/videos?boardSlug=${boardSlug}&limit=5`;
      
      const response = await fetch(apiUrl, { 
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error('API 엔드포인트에서 유튜브 데이터를 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // API 호출 중 오류 발생, 게시물 내용에서 URL 검색
    }
    
    // 2. API 엔드포인트에서 데이터를 가져오지 못한 경우, 기존 방식으로 게시물 내용에서 URL 검색
    const supabase = await createClient();
    
    if (!supabase) {
      return getSampleVideos();
    }
    
    // 게시판 정보 가져오기
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id, slug')
      .eq('slug', boardSlug)
      .single();
      
    if (boardError || !boardData) {
      return getSampleVideos();
    }
    
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
      .eq('board_id', boardData.id)
      .order('created_at', { ascending: false })
      .limit(20); // 최근 20개 게시물만 검색
    
    if (!allPosts || allPosts.length === 0) {
      return getSampleVideos();
    }
    
    // 게시물 내용에서 유튜브 URL을 검색하여 유튜브 비디오 데이터 생성
    const youtubeVideos: YouTubeVideoData[] = [];
    
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
    
    // 결과가 없으면 샘플 데이터 사용
    if (youtubeVideos.length === 0) {
      return getSampleVideos();
    }
    
    return youtubeVideos;
  } catch {
    return getSampleVideos();
  }
}

// 더 정확한 유튜브 URL 검색 함수
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

// 샘플 비디오 데이터 생성 함수
function getSampleVideos(): YouTubeVideoData[] {
  return [
    {
      id: 'sample-1',
      title: 'KBS 스포츠 주간 하이라이트',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      channelTitle: 'KBS 스포츠',
      publishedAt: new Date().toISOString(),
      videoId: 'dQw4w9WgXcQ',
      post_number: 0
    },
    {
      id: 'sample-2',
      title: '축구 국가대표 훈련 영상',
      thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      channelTitle: '대한축구협회',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      videoId: '9bZkp7q19f0',
      post_number: 0
    },
    {
      id: 'sample-3',
      title: '프로야구 명장면 모음',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      channelTitle: 'KBO',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      videoId: 'jNQXAC9IVRw',
      post_number: 0
    },
    {
      id: 'sample-4',
      title: '올림픽 스포츠 하이라이트',
      thumbnailUrl: 'https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg',
      channelTitle: '올림픽위원회',
      publishedAt: new Date(Date.now() - 259200000).toISOString(),
      videoId: 'LXb3EKWsInQ',
      post_number: 0
    },
    {
      id: 'sample-5',
      title: '스포츠 뉴스 하이라이트',
      thumbnailUrl: 'https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg',
      channelTitle: 'KBS 스포츠 뉴스',
      publishedAt: new Date(Date.now() - 345600000).toISOString(),
      videoId: 'M7lc1UVf-VE',
      post_number: 0
    }
  ];
}

export default async function HomePage() {
  try {
    // 병렬로 데이터 가져오기
    const [initialPosts, initialMatches, youtubeVideos] = await Promise.all([
      fetchInitialPosts(),
      fetchLiveScores(),
      fetchYouTubeVideos('kbs-sports')
    ]);
    
    return (
      <main>
        <div className="mb-4 hidden md:block">
          <NavBoardSelector />
        </div>
        <LiveScoreWidget initialMatches={initialMatches} />
        <AllPostsWidget initialPosts={initialPosts} />
        <NewsWidget />
        <YouTubeWidget initialVideos={youtubeVideos} boardSlug="kbs-sports" />
      </main>
    );
  } catch {
    // 오류 발생 시 폴백 UI 렌더링
    const fallbackPosts = Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
    
    return (
      <main>
        <div className="mb-4 hidden md:block">
          <NavBoardSelector />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg mb-4 p-4">
          <p className="text-yellow-700">데이터를 불러오는 중 문제가 발생했습니다. 곧 해결될 예정입니다.</p>
        </div>
        <LiveScoreWidget initialMatches={[]} />
        <AllPostsWidget initialPosts={fallbackPosts} />
        <NewsWidget />
        <YouTubeWidget initialVideos={[]} boardSlug="kbs-sports" />
      </main>
    );
  }
}