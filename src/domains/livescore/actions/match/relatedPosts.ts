'use server';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';

export interface RelatedPost {
  id: string;
  title: string;
  post_number: number;
  created_at: string;
  view_count: number;
  comment_count: number;
  content: string;
  board_slug: string;
  board_name: string;
  board_team_id: number | null;
  board_league_id: number | null;
  card_type: 'match' | 'team' | 'player' | 'board';
}

/**
 * 매치 관련 게시글 조회
 * 1순위: 해당 매치 카드가 삽입된 글
 * 2순위: 해당 팀 관련 글 (팀카드, 선수카드, 매치카드에 포함된 팀)
 * 3순위: 해당 팀 게시판의 게시글 (boards.team_id 매칭)
 */
export const getRelatedPosts = cache(async (
  matchId: string,
  homeTeamId?: number,
  awayTeamId?: number,
  limit: number = 10
): Promise<RelatedPost[]> => {
  try {
    const supabase = await getSupabaseServer();

    const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as number[];

    // 카드 링크 기반 조회 + 팀 게시판 게시글 조회를 병렬 실행
    const [cardResult, boardResult] = await Promise.all([
      // 1) 카드 링크 기반 (매치/팀/선수 카드가 삽입된 게시글)
      supabase
        .from('post_card_links')
        .select(`
          card_type,
          match_id,
          team_id,
          posts!inner (
            id,
            title,
            content,
            post_number,
            created_at,
            views,
            boards!inner (
              slug,
              name,
              team_id,
              league_id
            ),
            comments(count)
          )
        `)
        .or(
          [
            `match_id.eq.${matchId}`,
            ...(teamIds.length > 0 ? [`team_id.in.(${teamIds.join(',')})`] : [])
          ].join(',')
        )
        .limit(50),

      // 2) 팀 게시판 게시글 (boards.team_id가 매치 팀과 일치)
      teamIds.length > 0
        ? supabase
            .from('posts')
            .select(`
              id,
              title,
              content,
              post_number,
              created_at,
              views,
              boards!inner (
                slug,
                name,
                team_id,
                league_id
              ),
              comments(count)
            `)
            .in('boards.team_id', teamIds)
            .order('created_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: null, error: null }),
    ]);

    // 중복 게시글 제거 + 우선순위 정렬
    const postMap = new Map<string, RelatedPost & { priority: number }>();

    // 카드 링크 결과 처리
    if (cardResult.error) {
      console.error('카드 링크 조회 오류:', cardResult.error.message, cardResult.error.code, cardResult.error.details);
    } else if (cardResult.data) {
      for (const row of cardResult.data) {
        const post = row.posts as unknown as {
          id: string;
          title: string;
          content: string;
          post_number: number;
          created_at: string;
          views: number;
          boards: { slug: string; name: string; team_id: number | null; league_id: number | null };
          comments: { count: number }[];
        };

        if (!post?.id) continue;

        const priority = row.match_id === matchId && row.card_type === 'match' ? 0 : 1;
        const contentStr = typeof post.content === 'object' ? JSON.stringify(post.content) : String(post.content || '');

        const existing = postMap.get(post.id);
        if (!existing || priority < existing.priority) {
          postMap.set(post.id, {
            id: post.id,
            title: post.title,
            content: contentStr,
            post_number: post.post_number,
            created_at: post.created_at,
            view_count: post.views || 0,
            comment_count: post.comments?.[0]?.count || 0,
            board_slug: post.boards.slug,
            board_name: post.boards.name,
            board_team_id: post.boards.team_id,
            board_league_id: post.boards.league_id,
            card_type: row.card_type as 'match' | 'team' | 'player',
            priority,
          });
        }
      }
    }

    // 팀 게시판 결과 처리
    if (boardResult.error) {
      console.error('팀 게시판 조회 오류:', boardResult.error.message, boardResult.error.code, boardResult.error.details);
    } else if (boardResult.data) {
      for (const post of boardResult.data) {
        const p = post as unknown as {
          id: string;
          title: string;
          content: string;
          post_number: number;
          created_at: string;
          views: number;
          boards: { slug: string; name: string; team_id: number | null; league_id: number | null };
          comments: { count: number }[];
        };

        if (!p?.id) continue;

        const priority = 2;
        const contentStr = typeof p.content === 'object' ? JSON.stringify(p.content) : String(p.content || '');

        const existing = postMap.get(p.id);
        if (!existing || priority < existing.priority) {
          postMap.set(p.id, {
            id: p.id,
            title: p.title,
            content: contentStr,
            post_number: p.post_number,
            created_at: p.created_at,
            view_count: p.views || 0,
            comment_count: p.comments?.[0]?.count || 0,
            board_slug: p.boards.slug,
            board_name: p.boards.name,
            board_team_id: p.boards.team_id,
            board_league_id: p.boards.league_id,
            card_type: 'board',
            priority,
          });
        }
      }
    }

    if (postMap.size === 0) return [];

    // 최신순 정렬
    return Array.from(postMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(({ priority: _, ...rest }) => rest);
  } catch (error) {
    console.error('관련 게시글 조회 실패:', error);
    return [];
  }
});
