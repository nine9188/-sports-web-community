'use server';

import { revalidateTag } from 'next/cache';
import { after } from 'next/server';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { CommentType } from '../../types/post/comment';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { CommentActionResponse, sanitizeEmoticonCodes } from './utils';
import { runCommentCreateSideEffects } from './sideEffects';
import { incrementUserEmoticonUsage } from '../emoticonUsage';

/**
 * 댓글 작성 (대댓글 지원)
 */
export async function createComment({
  postId,
  content,
  parentId
}: {
  postId: string;
  content: string;
  parentId?: string | null;
}): Promise<CommentActionResponse> {
  const supabase = await getSupabaseServer();
  
  try {
    // 1. 현재 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    // 2. 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(user.id);
    if (suspensionCheck.isSuspended) {
      return { 
        success: false, 
        error: suspensionCheck.message || '계정이 정지되어 댓글을 작성할 수 없습니다.' 
      };
    }
    
    // 3. 부모 댓글 존재 여부 확인 (대댓글인 경우)
    let parentCommentOwnerId: string | null = null;
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id, post_id, user_id')
        .eq('id', parentId)
        .single();
      
      if (parentError || !parentComment) {
        return { success: false, error: '원본 댓글을 찾을 수 없습니다.' };
      }
      
      // 부모 댓글이 같은 게시글에 속하는지 확인
      if (parentComment.post_id !== postId) {
        return { success: false, error: '잘못된 요청입니다.' };
      }
      
      parentCommentOwnerId = parentComment.user_id;
    }
    
    // 4. 이모티콘 코드 검증 (미구매 유료 팩 코드 제거)
    const sanitizedContent = await sanitizeEmoticonCodes(content, user.id, supabase);

    if (!sanitizedContent) {
      return { success: false, error: '댓글 내용을 입력해주세요.' };
    }

    // 5. 댓글 작성 (트리거 미사용에 대응하는 순번 할당 및 동시성 재시도 로직)
    let data = null;
    let error = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      // 기존 가장 높은 순번을 조회
      const { data: maxRow, error: maxError } = await supabase
        .from('comments')
        .select('comment_number')
        .eq('post_id', postId)
        .order('comment_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxError) {
        return { success: false, error: maxError.message };
      }

      const nextCommentNumber = (maxRow?.comment_number ?? 0) + 1;

      // 직접 comment_number를 밀어넣어 삽입 시도
      const { data: insertData, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: sanitizedContent,
          parent_id: parentId || null,
          comment_number: nextCommentNumber
        } as never)
        .select('*, profiles(nickname, icon_id, level, exp, public_id)')
        .single();

      if (insertError) {
        // Unique Constraint 위배 (PostgreSQL 23505 에러)인 경우 재시도
        if (insertError.code === '23505') {
          attempts++;
          continue;
        }
        error = insertError;
        break;
      }

      data = insertData;
      break;
    }

    if (attempts >= maxAttempts) {
      return { success: false, error: '동시 요청이 많아 댓글 순번 할당에 실패했습니다. 다시 시도해 주세요.' };
    }
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    // 새로 작성된 댓글에 아이콘 URL 정보 추가
    const newComment = data as CommentType;
    if (newComment.profiles?.icon_id) {
      // 커스텀 아이콘 정보 조회
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('image_url')
        .eq('id', newComment.profiles.icon_id)
        .single();
      
      if (iconData?.image_url && newComment.profiles) {
        newComment.profiles.icon_url = iconData.image_url;
      }
    }
    
    after(() => {
      void Promise.all([
        runCommentCreateSideEffects({
          supabase,
          postId,
          commentId: data.id,
          actorId: user.id,
          actorNickname: newComment.profiles?.nickname || '알 수 없음',
          parentId: parentId || null,
          parentCommentOwnerId,
          content
        }),
        incrementUserEmoticonUsage(supabase, sanitizedContent),
      ]).catch(err => console.error('댓글 작성 후처리 실패 (무시됨):', err));
    });

    // 유저 통계 캐시 무효화 (댓글 수 변경)
    revalidateTag(`user-stats-${user.id}`, 'default');

    return { success: true, comment: newComment };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.' 
    };
  }
} 
