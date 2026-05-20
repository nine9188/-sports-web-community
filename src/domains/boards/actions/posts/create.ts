'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { rewardUserActivity, getActivityTypeValues } from '@/shared/actions/activity-actions';
import { checkReferralMilestone } from '@/shared/actions/referral-actions';
import { logUserAction, logError } from '@/shared/actions/log-actions';
import { getSupabaseAction } from '@/shared/lib/supabase/server';
import { extractCardLinks } from '@/domains/boards/utils/post/extractCardLinks';
import { extractAutoTagsFromContent } from '@/domains/boards/utils/post/extractAutoTagsFromContent';
import { extractFirstImageUrl } from '@/domains/boards/utils/post/extractFirstImageUrl';
import { extractSummary } from '@/domains/boards/utils/post/extractSummary';
import { pingWebSubHub } from '@/shared/utils/websub-ping';
import { submitIndexNowUrl } from '@/shared/seo/indexnow';
import { cacheThumbnailToStorage } from './cacheThumbnail';
import type { PostActionResponse } from './utils';
import { calculateBoardViewerPermissions } from '../permissions';
import type { PostPollDraft } from '@/domains/boards/types/poll';

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

function normalizePostPollDraft(value: unknown): PostPollDraft | null {
  if (!value || typeof value !== 'object') return null;

  const draft = value as { question?: unknown; options?: unknown };
  const question = typeof draft.question === 'string' ? draft.question.trim() : '';
  const options = Array.isArray(draft.options)
    ? draft.options
        .map((option) => typeof option === 'string' ? option.trim() : '')
        .filter(Boolean)
        .slice(0, 5)
    : [];

  if (!question || options.length < 2) return null;

  return {
    question: question.slice(0, 120),
    options: options.map((option) => option.slice(0, 80)),
  };
}

async function insertPostPoll(params: {
  supabase: unknown;
  postId: string;
  userId: string;
  poll: PostPollDraft;
}) {
  const { supabase, postId, userId, poll } = params;
  const supabaseAny = supabase as {
    from: (table: string) => {
      insert: (row: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      } | Promise<{ error: { message: string } | null }>;
    };
  };

  const pollInsert = supabaseAny.from('post_polls').insert({
    post_id: postId,
    question: poll.question,
    created_by: userId,
  }) as {
    select: (columns: string) => {
      single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
    };
  };

  const { data: pollRow, error: pollError } = await pollInsert.select('id').single();
  if (pollError || !pollRow) {
    throw new Error(pollError?.message || '투표 생성에 실패했습니다.');
  }

  const optionRows = poll.options.map((optionText, index) => ({
    poll_id: pollRow.id,
    option_text: optionText,
    display_order: index,
  }));

  const { error: optionError } = await supabaseAny.from('post_poll_options').insert(optionRows) as { error: { message: string } | null };
  if (optionError) {
    throw new Error(optionError.message);
  }
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
  poll?: PostPollDraft | null;
}): Promise<CreatePostResult> {
  const { title, content, boardId, userId, isNotice, noticeType, noticeBoards, noticeOrder, dealInfo, poll } = params;

  try {
    const supabase = await getSupabaseAction();
    if (!supabase) {
      return { success: false, error: 'Supabase 클라이언트 초기화 오류' };
    }

    // 정지 확인 + 게시판 조회 병렬 실행
    const [boardResult, profileResult] = await Promise.all([
      supabase.from('boards').select('id, name, slug, access_level').eq('id', boardId).single(),
      supabase
        .from('profiles')
        .select('is_admin, is_suspended, suspended_until')
        .eq('id', userId)
        .single(),
    ]);

    const { data: profile } = profileResult;
    const suspendedUntil = profile?.suspended_until ? new Date(profile.suspended_until).getTime() : null;
    const suspensionCheck = {
      isSuspended: Boolean(profile?.is_suspended && (!suspendedUntil || suspendedUntil > Date.now())),
      message: '계정이 정지되어 게시글을 작성할 수 없습니다.',
    };

    if (suspensionCheck.isSuspended) {
      return { success: false, error: suspensionCheck.message || '계정이 정지되어 게시글을 작성할 수 없습니다.' };
    }

    const { data: boardData, error: boardError } = boardResult;
    if (boardError || !boardData) {
      return { success: false, error: '게시판 정보를 찾을 수 없습니다.' };
    }

    const permissions = calculateBoardViewerPermissions(boardData, profile);
    if (!permissions.canWrite) {
      return {
        success: false,
        error: boardData.slug === 'notice'
          ? '공지사항은 관리자만 작성할 수 있습니다.'
          : '이 게시판에 글을 작성할 권한이 없습니다.',
      };
    }

    // content JSON 파싱 (posts_content에 저장하기 위해 변수로 추출)
    const parsedContent = typeof content === 'string' && content.startsWith('{')
      ? JSON.parse(content)
      : content;
    const autoTags = extractAutoTagsFromContent(parsedContent);

    // 게시글 데이터 준비 (content는 posts_content 테이블에 분리 저장)
    const thumbnailUrl = extractFirstImageUrl(content);
    const insertData: Record<string, unknown> = {
      title: title.trim(),
      user_id: userId,
      board_id: boardId,
      thumbnail_url: thumbnailUrl,
      summary: extractSummary(content),
      tags: autoTags,
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

    // 캐시 갱신 (즉시 실행 - 사용자 경험에 중요)
    const boardSlug = boardData.slug || boardId;
    revalidatePath(`/boards/${boardSlug}`);
    revalidatePath('/boards');
    revalidateTag(`user-stats-${userId}`, 'default');

    // 후처리: 본문 분리 저장, 카드 링크, 로그, 보상 (전부 fire-and-forget)
    // 게시글 INSERT 이미 성공 → 사용자 응답 차단하지 않음
    const postId = data.id;
    const postNumber = data.post_number;

    if (poll) {
      try {
        await insertPostPoll({ supabase, postId, userId, poll });
      } catch (pollError) {
        console.error('[post_poll INSERT 실패]', pollError);
        return {
          success: false,
          error: pollError instanceof Error ? `투표 저장 실패: ${pollError.message}` : '투표 저장에 실패했습니다.',
        };
      }
    }

    Promise.all([
      // posts_content 분리 저장
      (async () => {
        try {
          const contentText = extractSummary(content, 10000);
          const supabaseAny = supabase as unknown as {
            from: (table: string) => {
              insert: (data: unknown) => Promise<{ error: { message: string } | null }>;
            };
          };
          const { error: contentError } = await supabaseAny
            .from('posts_content')
            .insert({ post_id: postId, content: parsedContent, content_text: contentText });
          if (contentError) console.error('[posts_content INSERT 실패]', contentError.message);
        } catch (e) { console.error('[posts_content INSERT 예외]', e); }
      })(),
      // 카드 링크 저장
      (async () => {
        try {
          const cardLinks = extractCardLinks(parsedContent);
          if (cardLinks.length > 0) {
            const supabaseAny = supabase as unknown as { from: (table: string) => { insert: (data: unknown) => Promise<unknown> } };
            await supabaseAny.from('post_card_links').insert(cardLinks.map(link => ({ ...link, post_id: postId })));
          }
        } catch (e) { console.error('카드 링크 저장 실패:', e); }
      })(),
      // 로그 기록
      logUserAction('POST_CREATE', `게시글 생성: ${title} (게시판: ${boardData.name})`, userId, {
        postId, postNumber, boardId, boardName: boardData.name, boardSlug: boardData.slug, title
      }),
      // 보상 처리
      getActivityTypeValues().then(types => rewardUserActivity(userId, types.POST_CREATION, postId)),
      // WebSub Hub 알림
      pingWebSubHub(),
      // IndexNow 알림
      submitIndexNowUrl(`/boards/${boardSlug}/${postNumber}`).then((result) => {
        if (!result.ok) console.error('[IndexNow] post create submit failed:', result);
      }),
      // 썸네일 Storage 캐싱 (외부 URL → CDN URL로 교체)
      cacheThumbnailToStorage(thumbnailUrl ?? '', postId),
      // 첫 게시글 마일스톤
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        .then(({ count }) => { if (count === 1) return checkReferralMilestone(userId, 'first_post'); }),
    ]).catch(err => console.error('게시글 후처리 실패 (무시됨):', err));

    return { success: true, post: data as unknown as CreatedPost };
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

    const pollStr = formData.get('poll') as string | null;
    let poll: PostPollDraft | null = null;
    if (pollStr) {
      try {
        poll = normalizePostPollDraft(JSON.parse(pollStr));
      } catch (e) {
        console.error('poll 파싱 실패:', e);
        return { success: false, error: '투표 정보를 확인할 수 없습니다.' };
      }
    }

    return createPostInternal({
      title,
      content,
      boardId,
      userId: user.id,
      isNotice,
      noticeType,
      noticeBoards,
      noticeOrder: noticeOrderStr ? parseInt(noticeOrderStr, 10) : 0,
      dealInfo,
      poll
    });
  } catch (error) {
    console.error('[createPost] 예외 발생:', error);
    return { success: false, error: error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다' };
  }
}
