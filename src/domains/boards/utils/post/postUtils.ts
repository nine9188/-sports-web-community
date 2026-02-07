// 게시글 관련 유틸리티 함수
import { Post, AdjacentPosts } from '../../types/post';
import { FormattedPost } from '../../types/post/formatted';
import { LayoutPost, ApiPost } from '../../types/post/layout';
import { CommentType } from '../../types/post/comment';
import { BoardData } from '../../types/board/data';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { formatDate } from '@/shared/utils/dateUtils';

/**
 * API 응답 게시글을 레이아웃용 게시글로 변환합니다.
 *
 * @param apiPosts API에서 받은 게시글 배열
 * @returns 레이아웃에서 사용할 수 있는 게시글 배열
 */
export function convertApiPostsToLayoutPosts(apiPosts: ApiPost[]): LayoutPost[] {
  return apiPosts.map(post => ({
    id: post.id,
    title: post.title,
    board_id: post.board_id,
    board_name: post.board_name,
    board_slug: post.board_slug,
    post_number: post.post_number,
    created_at: post.created_at,
    formattedDate: post.formattedDate,
    views: post.views || 0,
    likes: post.likes || 0,
    author_nickname: post.author_nickname || '익명',
    author_id: post.author_id,
    author_public_id: post.author_public_id || null,
    author_icon_id: post.author_icon_id,
    author_icon_url: post.author_icon_url,
    author_level: post.author_level || 1,
    author_exp: post.author_exp,
    comment_count: post.comment_count || 0,
    content: post.content,
    team_id: typeof post.team_id === 'string' ? parseInt(post.team_id, 10) : post.team_id as number | null,
    team_name: post.team_name,
    team_logo: post.team_logo,
    league_id: typeof post.league_id === 'string' ? parseInt(post.league_id, 10) : post.league_id as number | null,
    league_name: post.league_name,
    league_logo: post.league_logo,
    league_logo_dark: post.league_logo_dark,  // 다크모드 리그 로고
    deal_info: post.deal_info || null
  }));
}

/**
 * 이전 및 다음 게시글을 가져옵니다.
 * @param boardId 게시판 ID
 * @param postNumber 게시글 번호
 * @returns 이전/다음 게시글 정보
 */
export async function getAdjacentPosts(boardId: string, postNumber: number): Promise<AdjacentPosts> {
  const supabase = await getSupabaseServer();

  const { data: prevPost } = await supabase
    .from('posts')
    .select('id, post_number, title')
    .eq('board_id', boardId)
    .lt('post_number', postNumber)
    .order('post_number', { ascending: false })
    .limit(1)
    .single();

  const { data: nextPost } = await supabase
    .from('posts')
    .select('id, post_number, title')
    .eq('board_id', boardId)
    .gt('post_number', postNumber)
    .order('post_number', { ascending: true })
    .limit(1)
    .single();

  return {
    prevPost,
    nextPost
  };
}

/**
 * 게시글 조회수를 증가시킵니다.
 * @param postId 게시글 ID
 */
export async function incrementPostViews(postId: string) {
  const supabase = await getSupabaseServer();

  const { data: currentPost } = await supabase
    .from('posts')
    .select('views')
    .eq('id', postId)
    .single();

  if (currentPost) {
    const { error } = await supabase
      .from('posts')
      .update({ views: (currentPost.views || 0) + 1 })
      .eq('id', postId);

    if (error) {
      console.error('조회수 증가 오류:', error);
    }
  }
}

/**
 * 댓글 계층 구조를 구성합니다.
 * @param comments 모든 댓글 배열
 * @returns 계층화된 댓글 배열
 */
export function buildCommentTree(comments: CommentType[]): CommentType[] {
  const commentMap: Record<string, CommentType> = {};
  const rootComments: CommentType[] = [];

  comments.forEach(comment => {
    commentMap[comment.id] = {
      ...comment,
      children: []
    };
  });

  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = commentMap[comment.parent_id];
      if (parent && parent.children) {
        parent.children.push(commentMap[comment.id]);
      } else {
        rootComments.push(commentMap[comment.id]);
      }
    } else {
      rootComments.push(commentMap[comment.id]);
    }
  });

  return rootComments;
}

interface TeamInfo {
  id: number;
  name: string;
  logo: string;
  [key: string]: unknown;
}

interface LeagueInfo {
  id: number;
  name: string;
  logo: string;
  logo_dark?: string;  // 다크모드 로고
  [key: string]: unknown;
}

export async function formatPosts(
  posts: Post[],
  commentCounts: Record<string, number>,
  boardsData: Record<string, BoardData>,
  boardNameMap: Record<string, string>,
  teamsMap: Record<string, TeamInfo>,
  leaguesMap: Record<string, LeagueInfo>,
  iconsMap?: Record<number, string>
): Promise<FormattedPost[]> {
  let finalIconsMap = iconsMap || {};

  if (!iconsMap) {
    const iconIds = posts
      .map(post => post.profiles?.icon_id)
      .filter(Boolean) as number[];

    if (iconIds.length > 0) {
      try {
        const supabase = await getSupabaseServer();

        const { data: iconsData } = await supabase
          .from('shop_items')
          .select('id, image_url')
          .in('id', iconIds);

        if (iconsData) {
          finalIconsMap = {};
          iconsData.forEach(icon => {
            if (icon.id && icon.image_url) {
              finalIconsMap[icon.id] = icon.image_url;
            }
          });
        }
      } catch (error) {
        console.error('아이콘 정보 가져오기 오류:', error);
      }
    }
  }

  return posts.map(post => {
    const boardId = post.board_id || '';
    const boardData = boardsData[boardId];
    const team = boardData?.team_id ? teamsMap[boardData.team_id] || null : null;
    const league = boardData?.league_id ? leaguesMap[boardData.league_id] || null : null;

    let authorIconUrl = null;
    if (post.profiles?.icon_id && finalIconsMap[post.profiles.icon_id]) {
      authorIconUrl = finalIconsMap[post.profiles.icon_id];
    } else {
      authorIconUrl = getLevelIconUrl(post.profiles?.level || 1);
    }

    return {
      id: post.id,
      title: post.title,
      author: post.profiles?.nickname || '알 수 없음',
      author_id: post.profiles?.id || post.user_id || '',
      author_public_id: post.profiles?.public_id || null,
      author_level: post.profiles?.level || 1,
      author_exp: post.profiles?.exp || 0,
      author_icon_id: post.profiles?.icon_id || null,
      author_icon_url: authorIconUrl,
      created_at: post.created_at || '',
      formattedDate: formatDate(post.created_at || ''),
      views: post.views || 0,
      likes: post.likes || 0,
      commentCount: commentCounts[post.id] || 0,
      content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content || ''),
      boardId: boardId,
      boardName: boardNameMap[boardId] || '알 수 없는 게시판',
      boardSlug: boardData?.slug || boardId,
      postNumber: post.post_number,
      team: team ? {
        id: team.id,
        name: team.name,
        logo: team.logo
      } : null,
      league: league ? {
        id: league.id,
        name: league.name,
        logo: league.logo,
        logo_dark: league.logo_dark || ''  // 다크모드 로고
      } : null
    };
  });
}

export const checkContentType = (content: string) => {
  if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };

  const hasImage = content.includes('<img') || content.includes('![');
  const hasVideo = content.includes('<video') || content.includes('mp4');
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  const urls = content.match(urlPattern) || [];

  let hasYoutube = false;
  let hasLink = false;

  for (const url of urls) {
    if (/youtube\.com|youtu\.be/i.test(url)) {
      hasYoutube = true;
    } else {
      hasLink = true;
    }
    if (hasYoutube && hasLink) break;
  }

  if (!hasYoutube) {
    hasYoutube = content.includes('youtube.com') || content.includes('youtu.be');
  }

  if (!hasLink) {
    hasLink = content.includes('http://') || content.includes('https://');
  }

  return { hasImage, hasVideo, hasYoutube, hasLink };
};

export const getBoardSlug = (boardId: string, boardsData: Record<string, { slug?: string }>) => {
  return boardsData[boardId]?.slug || boardId;
};

export const getIconUrl = (iconId: number | null | undefined, iconsData: Record<number, { image_url: string }> = {}) => {
  if (!iconId) return null;
  return iconsData[iconId]?.image_url || null;
};
