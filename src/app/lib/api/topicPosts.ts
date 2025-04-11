import { createClientWithoutCookies } from '@/app/lib/supabase-middleware';
import { getCachedData } from '@/app/lib/caching';

// 인기글 타입 정의
export interface TopicPost {
  id: string;
  title: string;
  created_at: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  comment_count: number;
  views: number;
  likes: number;
  team_id: number | null;
  league_id: number | null;
  team_logo: string | null;
  league_logo: string | null;
  content?: string;
}

// 처리되지 않은 게시글 타입 (데이터베이스에서 가져온 원시 데이터)
interface RawPost {
  id: string;
  title?: string;
  created_at?: string;
  board_id?: string;
  views?: number;
  likes?: number;
  post_number?: number;
  content?: string;
}

// 캐싱된 인기글 데이터 가져오기
export async function getCachedTopicPosts(type: 'views' | 'likes' | 'comments'): Promise<TopicPost[]> {
  // 캐시 키 생성 (타입별로 다른 캐시)
  const cacheKey = `topic_posts:${type}`;
  
  return getCachedData(
    cacheKey,
    async () => {
      console.time('인기글 가져오기');
      const supabase = await createClientWithoutCookies();
      
      // 1. 글 목록 가져오기 (정렬 기준에 따라)
      let query = supabase
        .from('posts')
        .select(`
          id, 
          title, 
          created_at, 
          board_id,
          views,
          likes,
          post_number, 
          content
        `)
        .limit(200);
        
      // 정렬 기준 적용
      if (type === 'views') {
        query = query.order('views', { ascending: false });
      } else if (type === 'likes') {
        query = query.order('likes', { ascending: false });
      }
      
      const { data: postsData, error } = await query;
      
      if (error) throw error;
      
      const validPosts = (postsData || []) as RawPost[];
      
      // 빈 배열인 경우 빠르게 반환
      if (validPosts.length === 0) {
        console.timeEnd('인기글 가져오기');
        return [];
      }
      
      // 2. 게시판 정보 가져오기
      const boardIds = [...new Set(validPosts.map(post => post.board_id).filter(Boolean))];
      
      const { data: boardsData, error: boardsError } = await supabase
        .from('boards')
        .select('id, name, slug, team_id, league_id')
        .in('id', boardIds);
        
      if (boardsError) throw boardsError;
      
      const validBoards = boardsData || [];
      
      // 3. 게시판 매핑 구성
      const boardMap: Record<string, { 
        name: string, 
        slug: string, 
        team_id: number | null, 
        league_id: number | null 
      }> = {};
      
      validBoards.forEach(board => {
        if (board && board.id) {
          boardMap[board.id] = { 
            name: board.name || '', 
            slug: board.slug || board.id, 
            team_id: board.team_id || null, 
            league_id: board.league_id || null 
          };
        }
      });
      
      // 4. 팀 및 리그 정보 가져오기
      const teamIds = validBoards
        .filter(b => b.team_id)
        .map(b => b.team_id)
        .filter(Boolean);
        
      const leagueIds = validBoards
        .filter(b => b.league_id)
        .map(b => b.league_id)
        .filter(Boolean);
        
      // 모든 필요한 정보를 병렬로 가져오기
      const [teamsResult, leaguesResult, commentsResults] = await Promise.all([
        // 팀 로고 가져오기
        teamIds.length > 0
          ? supabase.from('teams').select('id, logo').in('id', teamIds)
          : Promise.resolve({ data: [] }),
          
        // 리그 로고 가져오기
        leagueIds.length > 0
          ? supabase.from('leagues').select('id, logo').in('id', leagueIds)
          : Promise.resolve({ data: [] }),
          
        // 댓글 수 가져오기 (type이 'comments'인 경우만)
        type === 'comments'
          ? Promise.all(validPosts.map(post => 
              supabase
                .from('comments')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', post.id)
            ))
          : Promise.resolve([])
      ]);
      
      // 5. 로고 맵핑 구성
      const teamLogoMap: Record<number, string> = {};
      (teamsResult.data || []).forEach(team => { 
        if (team.id) teamLogoMap[team.id] = team.logo || '';
      });
      
      const leagueLogoMap: Record<number, string> = {};
      (leaguesResult.data || []).forEach(league => { 
        if (league.id) leagueLogoMap[league.id] = league.logo || '';
      });
      
      // 6. 댓글 수 맵핑 구성
      let commentCounts: Record<string, number> = {};
      
      if (type === 'comments') {
        // commentsResults에서 댓글 수 추출
        validPosts.forEach((post, index) => {
          const result = commentsResults[index];
          commentCounts[post.id] = result?.count || 0;
        });
      } else {
        // 댓글 수는 필요 없는 경우 빈 객체
        commentCounts = {};
      }
      
      // 7. 처리된 데이터 생성
      const processedPosts: TopicPost[] = [];
      
      for (const post of validPosts) {
        if (!post || !post.id) continue;
        
        const boardInfo = post.board_id && boardMap[post.board_id]
          ? boardMap[post.board_id]
          : { name: '알 수 없음', slug: post.board_id || '', team_id: null, league_id: null };
          
        const teamId = boardInfo.team_id;
        const leagueId = boardInfo.league_id;
        
        const teamLogo = teamId !== null ? teamLogoMap[teamId] || null : null;
        const leagueLogo = leagueId !== null ? leagueLogoMap[leagueId] || null : null;
        
        processedPosts.push({
          id: post.id,
          title: post.title || '',
          created_at: post.created_at || '',
          board_id: post.board_id || '',
          board_name: boardInfo.name,
          board_slug: boardInfo.slug,
          post_number: post.post_number || 0,
          comment_count: commentCounts[post.id] || 0,
          views: post.views || 0,
          likes: post.likes || 0,
          team_id: teamId,
          league_id: leagueId,
          team_logo: teamLogo,
          league_logo: leagueLogo,
          content: post.content
        });
      }
      
      // 8. 결과 정렬 및 상위 20개만 반환
      let result: TopicPost[];
      
      if (type === 'views') {
        result = [...processedPosts].sort((a, b) => b.views - a.views).slice(0, 20);
      } else if (type === 'likes') {
        result = [...processedPosts].sort((a, b) => b.likes - a.likes).slice(0, 20);
      } else { // comments
        result = [...processedPosts].sort((a, b) => b.comment_count - a.comment_count).slice(0, 20);
      }
      
      console.timeEnd('인기글 가져오기');
      return result;
    },
    5 * 60 // 5분 캐싱
  );
} 