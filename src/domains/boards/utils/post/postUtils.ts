// 게시글 관련 유틸리티 함수
import { Post, AdjacentPosts } from '../../types/post';
import { FormattedPost } from '../../types/post/formatted';
import { CommentType } from '../../types/post/comment';
import { BoardData } from '../../types/board/data';
import { createClient } from '@/shared/api/supabaseServer';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';

/**
 * 이전 및 다음 게시글을 가져옵니다.
 * @param boardId 게시판 ID
 * @param postNumber 게시글 번호
 * @returns 이전/다음 게시글 정보
 */
export async function getAdjacentPosts(boardId: string, postNumber: number): Promise<AdjacentPosts> {
  const supabase = await createClient();

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
  const supabase = await createClient();

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
        const { createClient } = await import('@/shared/api/supabaseServer');
        const supabase = await createClient();

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
      author_level: post.profiles?.level || 1,
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
        logo: league.logo
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

// 날짜 포맷팅 함수
export const formatDate = (dateString: string) => {
  // 빈 문자열이나 undefined 체크
  if (!dateString || typeof dateString !== 'string') {
    return '-';
  }
  
  try {
    const date = new Date(dateString);
    
    // 유효하지 않은 날짜 체크
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const now = new Date();
    
    // 오늘 00:00:00 기준으로 비교
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // 오늘 글이면 시간만 표시 (HH:mm)
    if (postDate.getTime() === todayStart.getTime()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // 어제 이전 글이면 날짜 표시 (YYYY.MM.DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (error) {
    console.warn('날짜 포맷팅 오류:', error);
    return '-';
  }
};

export const getBoardSlug = (boardId: string, boardsData: Record<string, { slug?: string }>) => {
  return boardsData[boardId]?.slug || boardId;
};

export const getIconUrl = (iconId: number | null | undefined, iconsData: Record<number, { image_url: string }> = {}) => {
  if (!iconId) return null;
  return iconsData[iconId]?.image_url || null;
};
