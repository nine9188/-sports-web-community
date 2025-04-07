'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/lib/supabase-browser';
import { CardTitle } from '@/app/ui/card';
import PostList from '@/app/components/post/PostList';

// 결합된 게시글 타입 정의
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

export default function AllPostsWidget() {
  const [posts, setPosts] = useState<CombinedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    const fetchPosts = async () => {
      try {
        const supabase = createClient();
        
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
          
        if (postsError) throw postsError;
        
        // 게시판 정보 가져오기
        const validPosts = Array.isArray(postsData) ? postsData : [];
        const boardIds = [...new Set(validPosts.map(post => post.board_id || ''))];
        
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('id, name, team_id, league_id, slug')
          .in('id', boardIds);
          
        if (boardsError) throw boardsError;
        
        const validBoards = Array.isArray(boardsData) ? boardsData : [];
        
        const boardMap: Record<string, { name: string; team_id?: string | null; league_id?: string | null; slug: string }> = {};
        validBoards.forEach(board => {
          if (board && board.id) {
            boardMap[board.id] = {
              name: board.name || '',
              team_id: board.team_id,
              league_id: board.league_id,
              slug: board.slug || board.id
            };
          }
        });
        
        // 팀/리그 로고 가져오기
        const teamIds = validBoards
          .filter(board => board && board.team_id)
          .map(board => board.team_id!)
          .filter(Boolean);
          
        const leagueIds = validBoards
          .filter(board => board && board.league_id)
          .map(board => board.league_id!)
          .filter(Boolean);
        
        const teamLogoMap: Record<string, string> = {};
        const leagueLogoMap: Record<string, string> = {};
        
        if (teamIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, logo')
            .in('id', teamIds);
            
          const validTeams = Array.isArray(teamsData) ? teamsData : [];
          validTeams.forEach(team => {
            if (team && team.id) {
              teamLogoMap[team.id] = team.logo || '';
            }
          });
        }
        
        if (leagueIds.length > 0) {
          const { data: leaguesData } = await supabase
            .from('leagues')
            .select('id, logo')
            .in('id', leagueIds);
            
          const validLeagues = Array.isArray(leaguesData) ? leaguesData : [];
          validLeagues.forEach(league => {
            if (league && league.id) {
              leagueLogoMap[league.id] = league.logo || '';
            }
          });
        }
        
        // 댓글 수 가져오기
        const commentCounts: Record<string, number> = {};
        await Promise.all(
          validPosts.map(async (post) => {
            if (post && post.id) {
              const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);
              commentCounts[post.id] = count || 0;
            }
          })
        );
        
        // 최종 데이터 형성
        const combinedPosts = validPosts.map(post => {
          if (!post) return {} as CombinedPost;
          
          const boardInfo = post.board_id ? (boardMap[post.board_id] || { name: '알 수 없음', slug: post.board_id }) : { name: '알 수 없음', slug: '' };
          const teamId = boardInfo.team_id;
          const leagueId = boardInfo.league_id;
          
          // profiles 필드는 객체이거나 배열일 수 있음
          const profileData = post.profiles || {};
          const profileObj = Array.isArray(profileData) ? profileData[0] || {} : profileData;
          
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
            comment_count: post.id ? (commentCounts[post.id] || 0) : 0,
            content: post.content || '',
            team_id: teamId,
            league_id: leagueId,
            team_logo: teamId ? teamLogoMap[teamId] : null,
            league_logo: leagueId ? leagueLogoMap[leagueId] : null
          };
        }).filter(post => post.id);
        
        if (isMounted.current) {
          setPosts(combinedPosts);
          setLoading(false);
        }
      } catch (error) {
        console.error('전체 게시글 로딩 오류:', error);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchPosts();
    return () => { isMounted.current = false; };
  }, []);
  
  // 헤더 컨텐츠 렌더링
  const headerContent = (
    <CardTitle className="text-lg">최신 게시글</CardTitle>
  );
                  
  return (
    <div className="h-full">
      <PostList
        posts={posts}
        loading={loading}
        emptyMessage="게시글이 없습니다."
        headerContent={headerContent}
        showBoard={true}
        maxHeight="500px"
        currentBoardId="boards"
      />
    </div>
  );
} 