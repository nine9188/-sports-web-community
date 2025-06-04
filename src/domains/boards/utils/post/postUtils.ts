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
  
  // 이전 게시글 (더 작은 번호)
  const { data: prevPost } = await supabase
    .from('posts')
    .select('id, post_number, title')
    .eq('board_id', boardId)
    .lt('post_number', postNumber)
    .order('post_number', { ascending: false })
    .limit(1)
    .single();

  // 다음 게시글 (더 큰 번호)
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
  
  // 현재 조회수를 가져와서 1 증가
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

  // 첫 번째 패스: 모든 댓글을 맵에 추가
  comments.forEach(comment => {
    commentMap[comment.id] = {
      ...comment,
      children: []
    };
  });

  // 두 번째 패스: 부모-자식 관계 구성
  comments.forEach(comment => {
    if (comment.parent_id) {
      // 부모 댓글이 존재하면 자식으로 추가
      const parent = commentMap[comment.parent_id];
      if (parent && parent.children) {
        parent.children.push(commentMap[comment.id]);
      } else {
        // 부모가 없는 경우 루트로 처리
        rootComments.push(commentMap[comment.id]);
      }
    } else {
      // 부모가 없는 댓글은 루트 댓글
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

/**
 * 게시글 데이터를 표시 형식으로 변환합니다.
 * @param posts 원본 게시글 배열
 * @param commentCounts 댓글 수 맵
 * @param boardsData 게시판 데이터 맵
 * @param boardNameMap 게시판 이름 맵
 * @param teamsMap 팀 정보 맵
 * @param leaguesMap 리그 정보 맵
 * @param iconsMap 아이콘 정보 맵 (선택적)
 * @returns 포맷팅된 게시글 배열
 */
export async function formatPosts(
  posts: Post[],
  commentCounts: Record<string, number>,
  boardsData: Record<string, BoardData>,
  boardNameMap: Record<string, string>,
  teamsMap: Record<string, TeamInfo>,
  leaguesMap: Record<string, LeagueInfo>,
  iconsMap?: Record<number, string>
): Promise<FormattedPost[]> {
  // 아이콘 정보가 제공되지 않은 경우 직접 가져오기
  let finalIconsMap = iconsMap || {};
  
  if (!iconsMap) {
    // 커스텀 아이콘을 사용하는 사용자들의 icon_id 수집
    const iconIds = posts
      .map(post => post.profiles?.icon_id)
      .filter(Boolean) as number[];
    
    if (iconIds.length > 0) {
      try {
        const { createClient } = await import('@/shared/api/supabaseServer');
        const supabase = await createClient();
        
        // 아이콘 정보 조회
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
    
    // 아이콘 URL 결정
    let authorIconUrl = null;
    if (post.profiles?.icon_id && finalIconsMap[post.profiles.icon_id]) {
      authorIconUrl = finalIconsMap[post.profiles.icon_id];
    } else {
      // 커스텀 아이콘이 없는 경우 레벨 아이콘 사용
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

// 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수
export const checkContentType = (content: string) => {
  if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
  
  // 이미지 및 비디오 감지
  const hasImage = content.includes('<img') || content.includes('![');
  const hasVideo = content.includes('<video') || content.includes('mp4');
  
  // 모든 URL 찾기
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  const urls = content.match(urlPattern) || [];
  
  // 각 URL 유형을 확인하기 위한 플래그
  let hasYoutube = false;
  let hasLink = false;
  
  // 각 URL을 검사하여 유튜브 URL과 일반 URL 구분
  for (const url of urls) {
    if (/youtube\.com|youtu\.be/i.test(url)) {
      // 유튜브 URL 발견
      hasYoutube = true;
    } else {
      // 일반 URL 발견
      hasLink = true;
    }
    
    // 둘 다 찾았으면 더 이상 검사할 필요 없음
    if (hasYoutube && hasLink) break;
  }
  
  // 직접 체크할 패턴들
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
    
    // 🔧 Hydration 불일치 방지 - 서버 환경에서는 간단한 포맷만 사용
    if (typeof window === 'undefined') {
      // 서버 환경에서는 연-월-일 형식으로 고정
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // 오늘 작성된 글이면 시간만 표시
    if (postDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // 1년 이내면 월-일 표시
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (date > oneYearAgo) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    }
    
    // 1년 이상이면 연-월-일 표시
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
  } catch (error) {
    console.warn('날짜 포맷팅 오류:', error);
    return '-';
  }
};

// 게시판 ID에서 slug로 변환하는 함수
export const getBoardSlug = (boardId: string, boardsData: Record<string, { slug?: string }>) => {
  return boardsData[boardId]?.slug || boardId;
};

// 아이콘 URL 가져오는 함수
export const getIconUrl = (iconId: number | null | undefined, iconsData: Record<number, { image_url: string }> = {}) => {
  if (!iconId) return null;
  return iconsData[iconId]?.image_url || null;
}; 