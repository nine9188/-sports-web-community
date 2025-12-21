import React from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import BoardCollectionWidgetClient from './BoardCollectionWidgetClient';
import { BoardCollectionData, BoardPost } from './types';
import { Json } from '@/shared/types/supabase';

interface BoardCollectionSetting {
  board_id: string;
  display_order: number;
}

interface PostWithContent {
  id: string;
  title: string;
  post_number: number;
  created_at: string;
  content: Json;
  views: number | null;
  likes: number | null;
  board_id: string | null;
  category: string | null;
}

// 여러 게시판에서 최신 게시글 가져오기
async function getBoardsData(): Promise<BoardCollectionData[]> {
  try {
    const supabase = await getSupabaseServer();

    // DB에서 설정된 게시판 목록 가져오기
    // board_collection_widget_settings 테이블이 타입 정의에 없어서 타입 단언 사용
    const { data: settings } = await supabase
      .from('board_collection_widget_settings' as never)
      .select('board_id, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    let boardIds: string[] = [];

    if (!settings || settings.length === 0) {
      // 기본 게시판 slug
      const { data: defaultBoards } = await supabase
        .from('boards')
        .select('id')
        .in('slug', ['sports-news', 'soccer']);

      boardIds = defaultBoards?.map(b => b.id) || [];
    } else {
      // 타입 안전성을 위해 unknown을 거쳐서 단언
      const typedSettings = settings as unknown as BoardCollectionSetting[];
      boardIds = typedSettings.map(s => s.board_id);
    }

    if (boardIds.length === 0) return [];

    // 게시판 정보 가져오기
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, slug, description')
      .in('id', boardIds);

    if (!boards || boards.length === 0) return [];

    // boardIds 순서대로 boards를 정렬 (display_order 유지)
    const orderedBoards = boardIds
      .map(id => boards.find(b => b.id === id))
      .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);

    // 각 게시판별로 데이터 가져오기
    const boardsData = await Promise.all(
      orderedBoards.map(async (board) => {
        // 1. 하위 게시판 ID 찾기 (계층 구조 지원)
        const { data: childBoards } = await supabase
          .from('boards')
          .select('id')
          .eq('parent_id', board.id);

        const boardIds = [board.id];
        if (childBoards && childBoards.length > 0) {
          boardIds.push(...childBoards.map(b => b.id));
        }

        // 2. 최신 게시글 20개 가져오기 (좌우 10개씩)
        const { data: recentPosts } = await supabase
          .from('posts')
          .select('id, title, post_number, created_at, content, views, likes, board_id, category')
          .in('board_id', boardIds)
          .order('created_at', { ascending: false })
          .limit(20);

        // 3. 인기 게시글 (사용 안 함 - 최신 게시글 20개로 통일)
        const { data: popularPosts } = await supabase
          .from('posts')
          .select('id, title, post_number, created_at, content, views, likes, board_id, category')
          .in('board_id', boardIds)
          .order('views', { ascending: false })
          .limit(0);

        const typedRecentPosts = (recentPosts || []) as PostWithContent[];
        const typedPopularPosts = (popularPosts || []) as PostWithContent[];

        // 게시글이 없는 경우에도 게시판 정보는 유지 (탭 표시를 위해)
        if (typedRecentPosts.length === 0 && typedPopularPosts.length === 0) {
          console.log(`게시판 "${board.name}" (${board.slug || 'N/A'})에 표시할 게시글이 없습니다.`);
          return {
            board: {
              ...board,
              slug: board.slug || ''
            },
            recentPosts: [],
            popularPosts: [],
            featuredImages: []
          };
        }

        // 4. 댓글 수 가져오기
        const allPostIds = [
          ...typedRecentPosts.map(p => p.id),
          ...typedPopularPosts.map(p => p.id)
        ];
        
        const commentCountMap: Record<string, number> = {};
        if (allPostIds.length > 0) {
          try {
            const { data: commentCounts, error: commentError } = await supabase
              .from('comments')
              .select('post_id')
              .in('post_id', allPostIds)
              .eq('is_hidden', false)
              .eq('is_deleted', false);
            
            if (commentError) {
              console.error(`게시판 "${board.name}" 댓글 수 조회 오류:`, commentError);
            }
            
            if (commentCounts && commentCounts.length > 0) {
              commentCounts.forEach((comment) => {
                if (comment.post_id) {
                  commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
                }
              });
            }
          } catch (error) {
            console.error(`게시판 "${board.name}" 댓글 수 조회 오류:`, error);
          }
        }

        // 5. board_id별 slug 및 이름 매핑 가져오기
        const uniqueBoardIds = Array.from(new Set([
          ...typedRecentPosts.map(p => p.board_id).filter((id): id is string => id !== null),
          ...typedPopularPosts.map(p => p.board_id).filter((id): id is string => id !== null)
        ]));

        const { data: boardInfos } = await supabase
          .from('boards')
          .select('id, slug, name, team_id, league_id')
          .in('id', uniqueBoardIds);

        const boardSlugMap = new Map<string, string>();
        const boardNameMap = new Map<string, string>();
        const boardTeamIdMap = new Map<string, number | null>();
        const boardLeagueIdMap = new Map<string, number | null>();
        
        boardInfos?.forEach(b => {
          boardSlugMap.set(b.id, b.slug || '');
          boardNameMap.set(b.id, b.name || '');
          boardTeamIdMap.set(b.id, b.team_id);
          boardLeagueIdMap.set(b.id, b.league_id);
        });

        // 팀 및 리그 로고 정보 가져오기
        const teamIds = Array.from(new Set(
          Array.from(boardTeamIdMap.values()).filter((id): id is number => id !== null)
        ));
        const leagueIds = Array.from(new Set(
          Array.from(boardLeagueIdMap.values()).filter((id): id is number => id !== null)
        ));

        const teamLogoMap = new Map<number, string>();
        const leagueLogoMap = new Map<number, string>();

        if (teamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, logo')
            .in('id', teamIds);
          
          teams?.forEach(team => {
            if (team.logo) {
              teamLogoMap.set(team.id, team.logo);
            }
          });
        }

        if (leagueIds.length > 0) {
          const { data: leagues } = await supabase
            .from('leagues')
            .select('id, logo')
            .in('id', leagueIds);
          
          leagues?.forEach(league => {
            if (league.logo) {
              leagueLogoMap.set(league.id, league.logo);
            }
          });
        }

        // 6. 포맷팅
        const formatPost = (post: PostWithContent): BoardPost => {
          const postBoardId = post.board_id || '';
          const postBoardSlug = boardSlugMap.get(postBoardId) || board.slug || '';
          const postBoardName = boardNameMap.get(postBoardId) || board.name;
          const teamId = boardTeamIdMap.get(postBoardId);
          const leagueId = boardLeagueIdMap.get(postBoardId);
          
          const teamLogo = teamId ? teamLogoMap.get(teamId) || null : null;
          const leagueLogo = leagueId ? leagueLogoMap.get(leagueId) || null : null;
          
          return {
            id: post.id,
            title: post.title,
            post_number: post.post_number,
            created_at: post.created_at,
            content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content),
            views: post.views || 0,
            likes: post.likes || 0,
            comment_count: commentCountMap[post.id] || 0,
            board_slug: postBoardSlug,
            board_name: postBoardName,
            author_nickname: '익명',
            category: post.category || null,
            team_logo: teamLogo,
            league_logo: leagueLogo
          };
        };

        const recentPostsFormatted = typedRecentPosts.map(formatPost);
        const popularPostsFormatted = typedPopularPosts.map(formatPost);

        return {
          board: {
            ...board,
            slug: board.slug || ''
          },
          recentPosts: recentPostsFormatted,
          popularPosts: popularPostsFormatted,
          featuredImages: []
        };
      })
    );

    // 모든 설정된 게시판을 표시 (게시글이 없어도 탭은 표시)
    return boardsData;
  } catch (error) {
    console.error('게시판 데이터 조회 오류:', error);
    return [];
  }
}

// 서버 컴포넌트
export default async function BoardCollectionWidget() {
  const boardsData = await getBoardsData();

  if (!boardsData || boardsData.length === 0) {
    return null;
  }

  return <BoardCollectionWidgetClient boardsData={boardsData} />;
}
