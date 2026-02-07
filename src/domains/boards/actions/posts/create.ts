'use server';

import { revalidatePath } from 'next/cache';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkReferralMilestone } from '@/shared/actions/referral-actions';
import { checkSuspensionGuard } from '@/shared/utils/suspension-guard';
import { logUserAction, logError } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { extractCardLinks } from '@/domains/boards/utils/post/extractCardLinks';
import type { PostActionResponse } from './utils';

// 생성된 게시글 타입
interface CreatedPost {
  id: string;
  post_number: number;
  title: string;
  content: unknown;
  board_id: string | null;
  user_id: string | null;
  board?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  [key: string]: unknown;
}

type CreatePostResult = {
  success: true;
  post: CreatedPost;
} | {
  success: false;
  error: string;
}

/**
 * 게시글 생성 공통 로직
 */
async function createPostInternal(params: {
  title: string;
  content: string;
  boardId: string;
  userId: string;
  isNotice?: boolean;
  noticeType?: 'global' | 'board' | null;
  noticeBoards?: string[] | null;
  noticeOrder?: number;
  dealInfo?: Record<string, unknown> | null;
}): Promise<CreatePostResult> {
  const { title, content, boardId, userId, isNotice, noticeType, noticeBoards, noticeOrder, dealInfo } = params;

  try {
    // 계정 정지 상태 확인
    const suspensionCheck = await checkSuspensionGuard(userId);
    if (suspensionCheck.isSuspended) {
      return { success: false, error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.' };
    }

    const supabase = await getSupabaseAction();
    if (!supabase) {
      return { success: false, error: 'Supabase 클라이언트 초기화 오류' };
    }

    // 게시판 정보 조회
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .select('id, name, slug')
      .eq('id', boardId)
      .single();

    if (boardError || !boardData) {
      return { success: false, error: '게시판 정보를 찾을 수 없습니다.' };
    }

    // 게시글 데이터 준비
    const insertData: Record<string, unknown> = {
      title: title.trim(),
      content: typeof content === 'string' && content.startsWith('{') ? JSON.parse(content) : content,
      user_id: userId,
      board_id: boardId
    };

    // 핫딜 정보 추가
    if (dealInfo) {
      insertData.deal_info = dealInfo;
    }

    // 공지 정보 추가
    if (isNotice) {
      insertData.is_notice = true;
      insertData.notice_type = noticeType || 'global';
      insertData.notice_order = noticeOrder || 0;
      insertData.notice_created_at = new Date().toISOString();
      if (noticeType === 'board' && noticeBoards) {
        insertData.notice_boards = noticeBoards;
      }
    }

    // 게시글 생성
    const { data, error } = await supabase
      .from('posts')
      // @ts-expect-error - insertData는 동적으로 구성되어 타입 추론이 어려움
      .insert(insertData)
      .select('*, board:boards(id, name, slug)')
      .single();

    if (error) {
      await logError('POST_CREATE_ERROR', new Error(error.message), userId, { boardId, title });
      return { success: false, error: `게시글 작성 실패: ${error.message}` };
    }

    if (!data) {
      return { success: false, error: '게시글 생성은 되었으나 데이터를 받아오지 못했습니다.' };
    }

    // 카드 링크 저장 (실패해도 게시글 생성은 성공)
    // post_card_links 테이블은 Supabase 타입 생성 후 추가되어 타입 미포함
    try {
      const cardLinks = extractCardLinks(data.content);
      if (cardLinks.length > 0) {
        const cardLinksData = cardLinks.map(link => ({ ...link, post_id: data.id }));
        // 타입 정의에 없는 테이블 접근을 위한 우회
        const supabaseAny = supabase as unknown as { from: (table: string) => { insert: (data: unknown) => Promise<unknown> } };
        await supabaseAny.from('post_card_links').insert(cardLinksData);
      }
    } catch (cardErr) {
      console.error('카드 링크 저장 실패:', cardErr);
    }

    // 캐시 갱신 (즉시 실행 - 사용자 경험에 중요)
    const boardSlug = boardData.slug || boardId;
    revalidatePath(`/boards/${boardSlug}`);
    revalidatePath('/boards');

    // 로그 및 보상 처리 (병렬 실행 - 응답 차단하지 않음)
    // 실패해도 게시글 생성은 이미 성공했으므로 무시
    Promise.all([
      // 로그 기록
      logUserAction('POST_CREATE', `게시글 생성: ${title} (게시판: ${boardData.name})`, userId, {
        postId: data.id,
        postNumber: data.post_number,
        boardId,
        boardName: boardData.name,
        boardSlug: boardData.slug,
        title
      }),
      // 보상 처리
      getActivityTypeValues().then(activityTypes =>
        rewardUserActivity(userId, activityTypes.POST_CREATION, data.id)
      ),
      // 첫 게시글 마일스톤 체크
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then(({ count: postCount }) => {
          if (postCount === 1) {
            return checkReferralMilestone(userId, 'first_post');
          }
        })
    ]).catch(err => {
      console.error('게시글 생성 후처리 실패 (무시됨):', err);
    });

    return { success: true, post: data as CreatedPost };
  } catch (error) {
    console.error('[createPost] 예외 발생:', error);
    await logError('POST_CREATE_ERROR', error instanceof Error ? error : new Error(String(error)), userId, { boardId, title });
    return { success: false, error: error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다' };
  }
}

/**
 * 게시글 생성 (매개변수 사용)
 */
export async function createPostWithParams(
  title: string,
  content: string,
  boardId: string,
  userId: string
): Promise<PostActionResponse> {
  if (!title || !content || !boardId || !userId) {
    return { success: false, error: '필수 입력값이 누락되었습니다.' };
  }

  const result = await createPostInternal({ title, content, boardId, userId });

  if (result.success) {
    const post = result.post as { id: string; post_number: number; board?: { slug: string } };
    return {
      success: true,
      postId: post.id,
      postNumber: post.post_number,
      boardSlug: post.board?.slug
    };
  }

  return result;
}

/**
 * 게시글 생성 (FormData 사용)
 */
export async function createPost(formData: FormData): Promise<CreatePostResult> {
  try {
    const supabase = await getSupabaseAction();
    if (!supabase) {
      return { success: false, error: 'Supabase 클라이언트 초기화 오류' };
    }

    // 폼 데이터 추출
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const boardId = formData.get('boardId') as string;

    if (!title || !content || !boardId) {
      return { success: false, error: '필수 입력값이 누락되었습니다' };
    }

    // 사용자 인증 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: userError ? '인증 오류가 발생했습니다' : '로그인이 필요합니다' };
    }

    // 공지 정보 추출
    const isNotice = formData.get('isNotice') === 'true';
    const noticeType = formData.get('noticeType') as 'global' | 'board' | null;
    const noticeBoardsStr = formData.get('noticeBoards') as string | null;
    const noticeOrderStr = formData.get('noticeOrder') as string | null;

    let noticeBoards: string[] | null = null;
    if (noticeType === 'board' && noticeBoardsStr) {
      try {
        noticeBoards = JSON.parse(noticeBoardsStr);
      } catch {
        // 파싱 실패 시 무시
      }
    }

    // 핫딜 정보 추출
    const dealInfoStr = formData.get('deal_info') as string | null;
    let dealInfo: Record<string, unknown> | null = null;
    if (dealInfoStr) {
      try {
        dealInfo = JSON.parse(dealInfoStr);
      } catch (e) {
        console.error('deal_info 파싱 실패:', e);
      }
    }

    // 매치카드는 TipTap JSON 그대로 저장 (HTML 변환 없음)
    // PostContent.tsx에서 matchCard 노드 감지하여 렌더링

    return createPostInternal({
      title,
      content,
      boardId,
      userId: user.id,
      isNotice,
      noticeType,
      noticeBoards,
      noticeOrder: noticeOrderStr ? parseInt(noticeOrderStr, 10) : 0,
      dealInfo
    });
  } catch (error) {
    console.error('[createPost] 예외 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다' };
  }
}
