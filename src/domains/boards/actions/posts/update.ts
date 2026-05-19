'use server';

import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { extractCardLinks } from '@/domains/boards/utils/post/extractCardLinks';
import { extractAutoTagsFromContent } from '@/domains/boards/utils/post/extractAutoTagsFromContent';
import { extractFirstImageUrl } from '@/domains/boards/utils/post/extractFirstImageUrl';
import { extractSummary } from '@/domains/boards/utils/post/extractSummary';
import { submitIndexNowUrl } from '@/shared/seo/indexnow';
import { revalidateTag } from 'next/cache';
import type { PostActionResponse } from './utils';
import type { DealInfo } from '../../types/hotdeal';

/**
 * 게시글 수정 서버 액션
 * 보안: userId는 서버에서 세션을 통해 직접 확인 (클라이언트 전달값 사용 안함)
 */
export async function updatePost(
  postId: string,
  title: string,
  content: string,
  dealInfo?: DealInfo | null,
  _clientTags?: string[]
): Promise<PostActionResponse> {
  if (!postId || !title || !content) {
    return {
      success: false,
      error: '필수 입력값이 누락되었습니다.'
    };
  }

  try {
    const supabase = await getSupabaseAction();

    if (!supabase) {
      return {
        success: false,
        error: 'Supabase 클라이언트 초기화 오류'
      };
    }

    // 서버에서 직접 세션 확인 (보안: 클라이언트 전달값 신뢰하지 않음)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    const userId = user.id;

    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return {
        success: false,
        error: suspensionCheck.message || '계정이 정지되어 게시글을 수정할 수 없습니다.'
      };
    }

    // 게시글이 존재하는지 확인 & 작성자 일치 확인
    const { data: existingPost, error: existingPostError } = await supabase
      .from('posts')
      .select('user_id, board_id')
      .eq('id', postId)
      .single();
      
    if (existingPostError) {
      return {
        success: false,
        error: `게시글을 찾을 수 없습니다: ${existingPostError.message}`
      };
    }
    
    if (!existingPost) {
      return {
        success: false,
        error: '해당 게시글이 존재하지 않습니다.'
      };
    }
    
    if (existingPost.user_id !== userId) {
      return {
        success: false,
        error: '본인이 작성한 게시글만 수정할 수 있습니다.'
      };
    }
    
    // 매치카드는 TipTap JSON 그대로 저장 (HTML 변환 없음)
    // PostContent.tsx에서 matchCard 노드 감지하여 렌더링

    // 게시글 업데이트 쿼리 (content는 posts_content 테이블에 분리 저장)
    const parsedContentForTags = typeof content === 'string' && content.startsWith('{')
      ? JSON.parse(content)
      : content;
    const autoTags = extractAutoTagsFromContent(parsedContentForTags);

    const updateData: {
      title: string;
      updated_at: string;
      thumbnail_url: string | null;
      summary: string;
      tags: string[];
      deal_info?: DealInfo | null;
    } = {
      title: title.trim(),
      updated_at: new Date().toISOString(),
      thumbnail_url: extractFirstImageUrl(content),
      summary: extractSummary(content),
      tags: autoTags,
    };

    // 핫딜 정보가 제공된 경우 추가
    if (dealInfo !== undefined) {
      updateData.deal_info = dealInfo;
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData as Record<string, unknown>)
      .eq('id', postId);

    if (updateError) {
      return {
        success: false,
        error: `게시글 수정 실패: ${updateError.message}`
      };
    }

    // posts_content 도 UPSERT (이중 저장, 롤백 안전망)
    try {
      const parsedContent = typeof content === 'string' && content.startsWith('{')
        ? JSON.parse(content)
        : content;
      const contentText = extractSummary(content, 10000);
      const supabaseAny = supabase as unknown as {
        from: (table: string) => {
          upsert: (data: unknown, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
        };
      };
      const { error: contentError } = await supabaseAny
        .from('posts_content')
        .upsert({
          post_id: postId,
          content: parsedContent,
          content_text: contentText,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'post_id' });
      if (contentError) {
        console.error('[posts_content UPSERT 실패]', contentError.message, 'post_id:', postId);
      }
    } catch (contentErr) {
      console.error('[posts_content UPSERT 예외]', contentErr);
    }

    // 수정된 게시글 정보 가져오기
    const { data: postData, error: postDataError } = await supabase
      .from('posts')
      .select('post_number, board_id, boards(slug)')
      .eq('id', postId)
      .single();
    
    if (postDataError) {
      return {
        success: false,
        error: `게시글 정보 가져오기 실패: ${postDataError.message}`
      };
    }
    
    const boardSlug = (postData.boards as { slug: string } | null)?.slug;

    // 메타데이터 캐시 무효화 (generateMetadata용 per-post 캐시)
    if (postData.board_id && postData.post_number) {
      revalidateTag(`post-${postData.board_id}-${postData.post_number}`, 'default');
    }

    // 후처리 작업 (병렬 실행 - 응답 차단하지 않음)
    Promise.all([
      // 카드 링크 갱신
      (async () => {
        try {
          const parsedContent = typeof content === 'string' && content.startsWith('{')
            ? JSON.parse(content)
            : content;
          const cardLinks = extractCardLinks(parsedContent);
          const supabaseAny = supabase as unknown as { from: (table: string) => { delete: () => { eq: (col: string, val: string) => Promise<unknown> }; insert: (data: unknown) => Promise<unknown> } };
          await supabaseAny.from('post_card_links').delete().eq('post_id', postId);
          if (cardLinks.length > 0) {
            await supabaseAny.from('post_card_links').insert(cardLinks.map(link => ({ ...link, post_id: postId })));
          }
        } catch (cardErr) {
          console.error('카드 링크 갱신 실패:', cardErr);
        }
      })(),
      // 로그 기록
      logUserAction(
        'POST_UPDATE',
        `게시글 수정: ${title}`,
        userId,
        {
          postId,
          postNumber: postData.post_number,
          boardId: postData.board_id,
          boardSlug,
          title
        }
      ),
      boardSlug && postData.post_number
        ? submitIndexNowUrl(`/boards/${boardSlug}/${postData.post_number}`).then((result) => {
            if (!result.ok) console.error('[IndexNow] post update submit failed:', result);
          })
        : Promise.resolve()
    ]).catch(err => {
      console.error('게시글 수정 후처리 실패 (무시됨):', err);
    });

    return {
      success: true,
      postId,
      postNumber: postData.post_number,
      boardSlug
    };
  } catch (error) {
    console.error('[서버] 게시글 수정 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '게시글 수정 중 오류가 발생했습니다.'
    };
  }
} 
