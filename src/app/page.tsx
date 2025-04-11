import { createClient } from './lib/supabase.server';
import AllPostsWidget from './components/widgets/all-posts-widget'

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
      console.error("Supabase client creation failed");
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
      console.error("Error fetching posts:", postsError);
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
        
      if (boardsError) {
        console.error("Error fetching boards:", boardsError);
      } else {
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
    } catch (error) {
      console.error("Error fetching team logos:", error);
    }
    
    try {
      if (leagueIds.length > 0) {
        const { data: leaguesData } = await supabase.from('leagues').select('id, logo').in('id', leagueIds);
        (leaguesData || []).forEach(l => { if (l.id) leagueLogoMap[l.id] = l.logo || '' });
      }
    } catch (error) {
      console.error("Error fetching league logos:", error);
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
    } catch (error) {
      console.error("Error fetching comment counts:", error);
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

  } catch (error) {
    console.error("Failed to fetch initial posts:", error);
    // 오류 발생 시 더미 데이터 반환
    return Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
  }
}

export default async function HomePage() {
  try {
    const initialPosts = await fetchInitialPosts();
    
    return (
      <main>
        <AllPostsWidget initialPosts={initialPosts} />
      </main>
    );
  } catch (error) {
    console.error("Error in HomePage render:", error);
    
    // 오류 발생 시 폴백 UI 렌더링
    const fallbackPosts = Array(5).fill(null).map((_, i) => createFallbackPost(i+1));
    
    return (
      <main>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
          <p className="text-yellow-700">데이터를 불러오는 중 문제가 발생했습니다. 곧 해결될 예정입니다.</p>
        </div>
        <AllPostsWidget initialPosts={fallbackPosts} />
      </main>
    );
  }
}