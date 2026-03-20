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
 * 이모티콘 코드 검증: 미구매 유료 팩 코드를 제거
 * - 무료 팩 코드 (shop_item_id = NULL) → 통과
 * - 유료 팩 코드 + 구매한 팩 → 통과
 * - 유료 팩 코드 + 미구매 팩 → 제거
 */
export async function sanitizeEmoticonCodes(
  content: string,
  userId: string,
  supabase: any // eslint-disable-line @typescript-eslint/no-explicit-any
): Promise<string> {
  // 이모티콘 코드 패턴 추출
  const codePattern = /~[a-z]+\d+/g;
  const codes = content.match(codePattern);
  if (!codes || codes.length === 0) return content;

  const uniqueCodes = Array.from(new Set(codes));

  // DB에서 유료 팩 코드만 조회
  const { data: paidEmoticons } = await supabase
    .from('emoticon_packs')
    .select('code, shop_item_id')
    .in('code', uniqueCodes)
    .not('shop_item_id', 'is', null);

  if (!paidEmoticons || paidEmoticons.length === 0) return content;

  // 유저 보유 shop_item_id 확인
  const shopItemIds = Array.from(new Set(
    paidEmoticons.map((e: { shop_item_id: number }) => e.shop_item_id)
  ));

  const { data: owned } = await supabase
    .from('user_items')
    .select('item_id')
    .eq('user_id', userId)
    .in('item_id', shopItemIds);

  const ownedSet = new Set(
    (owned || []).map((o: { item_id: number }) => o.item_id)
  );

  // 미보유 유료 코드 목록
  const blockedCodes = paidEmoticons
    .filter((e: { shop_item_id: number }) => !ownedSet.has(e.shop_item_id))
    .map((e: { code: string }) => e.code);

  if (blockedCodes.length === 0) return content;

  // 미보유 코드 제거
  let sanitized = content;
  for (const code of blockedCodes) {
    sanitized = sanitized.split(code).join('');
  }
  return sanitized.trim();
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