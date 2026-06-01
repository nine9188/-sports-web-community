import 'server-only';

import { cache } from 'react';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getRelatedPosts, type RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';

const NEWS_BOARD_SLUGS = ['foreign-news', 'domestic-news', 'official', 'premier', 'laliga', 'bundesliga', 'serie-a', 'ligue1'];

export type TeamNewsPost = {
  id: string;
  title: string;
  href: string;
  boardName: string;
  createdAt: string;
};

export type TeamDailyBriefingData = {
  newsPosts: TeamNewsPost[];
  relatedPosts: RelatedPost[];
};

async function fetchTeamNewsPosts(teamId: number, limit = 8): Promise<TeamNewsPost[]> {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from('post_card_links')
      .select(`
        posts!inner (
          id,
          title,
          post_number,
          created_at,
          boards!inner (
            slug,
            name
          )
        )
      `)
      .eq('team_id', teamId)
      .in('posts.boards.slug', NEWS_BOARD_SLUGS)
      .limit(50);

    if (error) {
      console.error('[team daily briefing] news posts query failed:', error.message);
      return [];
    }

    const postMap = new Map<string, TeamNewsPost>();
    for (const row of data || []) {
      const post = row.posts as unknown as {
        id?: string;
        title?: string;
        post_number?: number;
        created_at?: string;
        boards?: { slug?: string; name?: string };
      } | null;

      if (!post?.id || !post.title || !post.post_number || !post.boards?.slug) continue;
      if (postMap.has(post.id)) continue;

      postMap.set(post.id, {
        id: post.id,
        title: post.title,
        href: `/boards/${post.boards.slug}/${post.post_number}`,
        boardName: post.boards.name || '뉴스',
        createdAt: post.created_at || '',
      });
    }

    return [...postMap.values()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('[team daily briefing] news posts lookup failed:', error);
    return [];
  }
}

export const getTeamDailyBriefing = cache(async (teamId: number): Promise<TeamDailyBriefingData> => {
  if (!Number.isFinite(teamId) || teamId <= 0) {
    return { newsPosts: [], relatedPosts: [] };
  }

  const [newsPosts, relatedPosts] = await Promise.all([
    fetchTeamNewsPosts(teamId),
    getRelatedPosts({ teamIds: [teamId], limit: 30 }),
  ]);

  return {
    newsPosts,
    relatedPosts,
  };
});
