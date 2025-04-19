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

export const revalidate = 60; // 1분마다 데이터 갱신
export const dynamic = 'force-dynamic'; // 항상 동적으로 렌더링

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
    const [initialMatches, youtubeVideos] = await Promise.all([
      fetchLiveScores(),
      fetchYouTubeVideos('kbs-sports')
    ]);
    
    return (
      <main>
        <div className="mb-4 hidden md:block">
          <NavBoardSelector />
        </div>
        <LiveScoreWidget initialMatches={initialMatches} />
        <AllPostsWidget />
        <NewsWidget />
        <YouTubeWidget initialVideos={youtubeVideos} boardSlug="kbs-sports" />
      </main>
    );
  } catch {
    // 오류 발생 시 폴백 UI 렌더링
    return (
      <main>
        <div className="mb-4 hidden md:block">
          <NavBoardSelector />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg mb-4 p-4">
          <p className="text-yellow-700">데이터를 불러오는 중 문제가 발생했습니다. 곧 해결될 예정입니다.</p>
        </div>
        <LiveScoreWidget initialMatches={[]} />
        <AllPostsWidget />
        <NewsWidget />
        <YouTubeWidget initialVideos={[]} boardSlug="kbs-sports" />
      </main>
    );
  }
}