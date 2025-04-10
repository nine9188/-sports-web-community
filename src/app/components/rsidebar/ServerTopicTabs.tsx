import { createClient } from '@/app/lib/supabase.server';
import ClientTopicTabs from './TopicTabs'; // 클라이언트 컴포넌트 임포트

// Post 인터페이스 정의 (ClientTopicTabs와 동일하게 유지)
interface Post {
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
  team_id?: string | number | null;
  league_id?: string | number | null;
  team_logo?: string | null;
  league_logo?: string | null;
  content?: string;
}

type TabType = '조회수' | '추천수' | '댓글수';

export const revalidate = 60; // 1분마다 데이터 갱신
export const dynamic = 'force-dynamic';

async function fetchTopicPosts(): Promise<Record<TabType, Post[]>> {
  const supabase = await createClient();
  const initialData: Record<TabType, Post[]> = {
    '조회수': [],
    '추천수': [],
    '댓글수': []
  };

  try {
    const { data: postsData, error } = await supabase
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
      
    if (error) throw error;

    const validPosts = postsData || [];
    const boardIds = [...new Set(validPosts.map(post => post.board_id).filter(id => id != null))];
    let boardsData: { id: string; name: string; slug: string; team_id?: number | null; league_id?: number | null }[] = [];
    if (boardIds.length > 0) {
        const { data, error: boardsError } = await supabase.from('boards').select('id, name, slug, team_id, league_id').in('id', boardIds);
        if (boardsError) throw boardsError;
        boardsData = data || [];
    }
    
    const boardMap: Record<string, { name: string; slug: string; team_id?: number | null; league_id?: number | null }> = {};
    boardsData.forEach(board => { if (board?.id) boardMap[board.id] = { name: board.name || '', slug: board.slug || board.id, team_id: board.team_id, league_id: board.league_id } });

    const teamIds = boardsData.map(b => b.team_id).filter(Boolean);
    const leagueIds = boardsData.map(b => b.league_id).filter(Boolean);
    const teamLogoMap: Record<string | number, string> = {};
    const leagueLogoMap: Record<string | number, string> = {};

    if (teamIds.length > 0) {
        const { data: teamsData } = await supabase.from('teams').select('id, logo').in('id', teamIds);
        (teamsData || []).forEach(t => { if (t.id) teamLogoMap[t.id] = t.logo || '' });
    }
    if (leagueIds.length > 0) {
        const { data: leaguesData } = await supabase.from('leagues').select('id, logo').in('id', leagueIds);
        (leaguesData || []).forEach(l => { if (l.id) leagueLogoMap[l.id] = l.logo || '' });
    }

    const postIds = validPosts.map(p => p.id).filter(Boolean);
    const commentCounts: Record<string, number> = {};
    if (postIds.length > 0) {
        const counts = await Promise.all(postIds.map(async postId => {
            const { count } = await supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', postId);
            return { postId, count: count || 0 };
        }));
        counts.forEach(({ postId, count }) => { commentCounts[postId] = count });
    }

    const processedPosts: Post[] = validPosts.map(post => {
      if (!post || !post.id) { 
        return {
          id: '', title: '', created_at: '', board_id: '', board_name: '', board_slug: '', post_number: 0,
          comment_count: 0, views: 0, likes: 0, content: ''
        } as Post;
      } 
      const boardInfo = post.board_id && boardMap[post.board_id] ? boardMap[post.board_id] : { name: '알 수 없음', slug: post.board_id || '', team_id: null, league_id: null };
      const teamId = boardInfo.team_id;
      const leagueId = boardInfo.league_id;
      
      return {
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
        team_logo: teamId ? teamLogoMap[teamId] : null,
        league_logo: leagueId ? leagueLogoMap[leagueId] : null,
        content: post.content
      };
    }).filter((post): post is Post => post.id !== '');

    initialData['조회수'] = [...processedPosts].sort((a, b) => b.views - a.views).slice(0, 20);
    initialData['추천수'] = [...processedPosts].sort((a, b) => b.likes - a.likes).slice(0, 20);
    initialData['댓글수'] = [...processedPosts].sort((a, b) => b.comment_count - a.comment_count).slice(0, 20);

  } catch (error) {
    console.error("인기글 데이터 로딩 오류:", error);
    // 오류 발생 시 빈 데이터를 반환하여 클라이언트에서 처리
  }

  return initialData;
}

export default async function ServerTopicTabs() {
  const initialData = await fetchTopicPosts();
  
  // 클라이언트 컴포넌트에 초기 데이터 전달
  return <ClientTopicTabs initialData={initialData} />;
} 