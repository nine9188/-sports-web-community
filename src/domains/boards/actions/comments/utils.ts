import { CommentType } from '../../types/post/comment';

// 댓글 액션 응답 타입
export interface CommentActionResponse {
  success: boolean;
  comment?: CommentType;
  error?: string;
}

// 댓글 목록 응답 타입
export interface CommentsListResponse {
  success: boolean;
  comments?: CommentType[];
  error?: string;
}

// 댓글 좋아요/싫어요 응답 타입
export interface CommentLikeResponse {
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
}

// 댓글 삭제 응답 타입
export interface CommentDeleteResponse {
  success: boolean;
  error?: string;
}

/**
 * 댓글에 아이콘 URL 정보를 추가하는 유틸리티 함수
 */
export async function addIconUrlToComments(
  comments: CommentType[], 
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<CommentType[]> {
  if (comments.length === 0) return comments;
  
  // 커스텀 아이콘을 사용하는 사용자들의 icon_id 수집
  const iconIds = comments
    .map(comment => comment.profiles?.icon_id)
    .filter(Boolean) as number[];
  
  if (iconIds.length === 0) return comments;
  
  // 아이콘 정보 조회
  const { data: iconsData } = await supabase
    .from('shop_items')
    .select('id, image_url')
    .in('id', iconIds);
  
  if (!iconsData) return comments;
  
  // 아이콘 ID별 URL 맵 생성
  const iconMap: Record<number, string> = {};
  iconsData.forEach((icon: { id?: number; image_url?: string }) => {
    if (icon.id && icon.image_url) {
      iconMap[icon.id] = icon.image_url;
    }
  });
  
  // 댓글에 아이콘 URL 추가
  comments.forEach(comment => {
    if (comment.profiles?.icon_id && iconMap[comment.profiles.icon_id]) {
      if (comment.profiles) {
        comment.profiles.icon_url = iconMap[comment.profiles.icon_id];
      }
    }
  });
  
  return comments;
}

/**
 * 댓글 상태를 판단하는 유틸리티 함수
 */
export function determineCommentStatus(comment: any): { // eslint-disable-line @typescript-eslint/no-explicit-any
  is_hidden: boolean;
  is_deleted: boolean;
} {
  // 댓글 내용을 기반으로 상태 판단
  if (comment.content === '신고에 의해 삭제되었습니다.') {
    return { is_deleted: true, is_hidden: false };
  } else if (comment.content === '신고에 의해 일시 숨김처리 되었습니다. 7일 후 다시 확인됩니다.') {
    return { is_hidden: true, is_deleted: false };
  } else {
    // 실제 데이터베이스 값이 있다면 사용, 없다면 기본값
    const dbHidden = comment.is_hidden as boolean;
    const dbDeleted = comment.is_deleted as boolean;
    return { 
      is_hidden: dbHidden || false, 
      is_deleted: dbDeleted || false 
    };
  }
} 