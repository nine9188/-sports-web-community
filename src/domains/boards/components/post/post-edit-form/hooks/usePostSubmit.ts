import { useCallback } from 'react';
import type { FormEvent, MutableRefObject } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';

import {
  createPost,
  deletePostDraft,
  updatePost,
} from '@/domains/boards/actions/posts/index';
import type { Board } from '@/domains/boards/types/board';
import type { DealInfo } from '@/domains/boards/types/hotdeal';
import type { PostPollDraft } from '@/domains/boards/types/poll';
import { trackEvent } from '@/shared/lib/gtag';

type FormState = {
  title: string;
  content: string;
  categoryId: string;
};

type HotdealState = {
  dealUrl: string;
  store: string;
  productName: string;
  price: string;
  originalPrice: string;
  shipping: string;
};

type UsePostSubmitParams = {
  editor: Editor | null;
  router: AppRouterInstance;
  postId?: string;
  isCreateMode: boolean;
  isHotdeal: boolean;
  isSubmitting: boolean;
  currentDraftId: string | null;
  initialDealInfo: DealInfo | null;
  allBoardsFlat: Board[];
  autoTags: string[];
  pollDraft: PostPollDraft | null;
  formStateRef: MutableRefObject<FormState>;
  hotdealStateRef: MutableRefObject<HotdealState>;
  setError: (error: string | null) => void;
  setIsSubmitting: (value: boolean) => void;
};

export function usePostSubmit({
  editor,
  router,
  postId,
  isCreateMode,
  isHotdeal,
  isSubmitting,
  currentDraftId,
  initialDealInfo,
  allBoardsFlat,
  autoTags,
  pollDraft,
  formStateRef,
  hotdealStateRef,
  setError,
  setIsSubmitting,
}: UsePostSubmitParams) {
  const buildDealInfo = useCallback((forUpdate = false): DealInfo => {
    const { store, productName, price, originalPrice, shipping, dealUrl } = hotdealStateRef.current;

    return {
      store,
      product_name: productName.trim(),
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : undefined,
      shipping,
      deal_url: dealUrl.trim(),
      is_ended: forUpdate ? (initialDealInfo?.is_ended || false) : false,
      ...(forUpdate && initialDealInfo?.ended_reason && { ended_reason: initialDealInfo.ended_reason }),
      ...(forUpdate && initialDealInfo?.ended_at && { ended_at: initialDealInfo.ended_at }),
    };
  }, [hotdealStateRef, initialDealInfo]);

  const validateForm = useCallback((): boolean => {
    const { title, content, categoryId } = formStateRef.current;
    const { dealUrl, store, productName, price, shipping } = hotdealStateRef.current;

    if (!title.trim() && !(isCreateMode && isHotdeal)) {
      toast.error('제목을 입력해주세요.');
      return false;
    }

    if (!content || content === '<p></p>') {
      toast.error('내용을 입력해주세요.');
      return false;
    }

    if (isCreateMode) {
      if (!categoryId) {
        toast.error('게시판을 선택해주세요.');
        return false;
      }

      const board = allBoardsFlat.find((b) => b.id === categoryId);
      if (board && board.parent_id === null) {
        const hasChildren = allBoardsFlat.some((b) => b.parent_id === categoryId);
        if (hasChildren) {
          toast.error('하위 게시판을 선택해주세요.');
          return false;
        }
      }
    }

    if (isHotdeal) {
      if (!dealUrl.trim()) {
        toast.error('상품 링크를 입력해주세요.');
        return false;
      }
      if (!store) {
        toast.error('쇼핑몰을 선택해주세요.');
        return false;
      }
      if (!productName.trim()) {
        toast.error('상품명을 입력해주세요.');
        return false;
      }
      if (!price || parseFloat(price) < 0) {
        toast.error('올바른 가격을 입력해주세요.');
        return false;
      }
      if (!shipping) {
        toast.error('배송비를 선택해주세요.');
        return false;
      }
    }

    return true;
  }, [allBoardsFlat, formStateRef, hotdealStateRef, isCreateMode, isHotdeal]);

  const handleErrorResponse = useCallback((errorMsg: string, defaultMessage: string) => {
    if (errorMsg.includes('로그인') || errorMsg.includes('인증')) {
      toast.error('로그인이 필요합니다.');
      router.push('/signin');
      return;
    }

    setError(errorMsg || defaultMessage);
    toast.error(errorMsg || defaultMessage);
    setIsSubmitting(false);
  }, [router, setError, setIsSubmitting]);

  const handleCreatePost = useCallback(async () => {
    const { title, content, categoryId } = formStateRef.current;
    const currentContent = editor ? JSON.stringify(editor.getJSON()) : content;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', currentContent);
    formData.append('boardId', categoryId);

    if (isHotdeal) {
      formData.append('deal_info', JSON.stringify(buildDealInfo(false)));
    }

    if (pollDraft) {
      formData.append('poll', JSON.stringify(pollDraft));
    }

    if (autoTags.length > 0) {
      formData.append('tags', JSON.stringify(autoTags));
    }

    const result = await createPost(formData);

    if (!result.success) {
      handleErrorResponse(result.error || '', '게시글 작성에 실패했습니다.');
      return;
    }

    if (!result.post) {
      throw new Error('게시글 데이터를 받아오지 못했습니다.');
    }

    const { post } = result;
    const boardSlug =
      post.board?.slug ||
      allBoardsFlat.find((b) => b.id === categoryId)?.slug ||
      categoryId;

    trackEvent('post_create', {
      board: boardSlug,
      post_number: post.post_number,
      is_hotdeal: isHotdeal,
      has_poll: Boolean(pollDraft),
    });

    toast.success('게시글이 작성되었습니다.');

    if (currentDraftId) {
      void deletePostDraft(currentDraftId);
    }

    router.push(`/boards/${boardSlug}/${post.post_number}`);
  }, [
    allBoardsFlat,
    autoTags,
    buildDealInfo,
    currentDraftId,
    editor,
    formStateRef,
    handleErrorResponse,
    isHotdeal,
    pollDraft,
    router,
  ]);

  const handleUpdatePost = useCallback(async () => {
    if (!postId) {
      throw new Error('게시글 ID가 제공되지 않았습니다.');
    }

    const { title, content } = formStateRef.current;
    const currentContent = editor ? JSON.stringify(editor.getJSON()) : content;
    const dealInfoToUpdate = isHotdeal ? buildDealInfo(true) : null;

    const result = await updatePost(postId, title.trim(), currentContent, dealInfoToUpdate, autoTags);

    if (!result.success) {
      handleErrorResponse(result.error || '', '게시글 수정에 실패했습니다.');
      return;
    }

    if (!result.boardSlug || !result.postNumber) {
      throw new Error('게시글 정보를 받아오지 못했습니다.');
    }

    toast.success('게시글이 수정되었습니다.');
    router.push(`/boards/${result.boardSlug}/${result.postNumber}`);
  }, [
    autoTags,
    buildDealInfo,
    editor,
    formStateRef,
    handleErrorResponse,
    isHotdeal,
    postId,
    router,
  ]);

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isCreateMode) {
        await handleCreatePost();
      } else {
        await handleUpdatePost();
      }
    } catch (err) {
      const errorMsg = err instanceof Error
        ? err.message
        : `게시글 ${isCreateMode ? '작성' : '수정'} 중 오류가 발생했습니다.`;

      setError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
    }
  }, [
    handleCreatePost,
    handleUpdatePost,
    isCreateMode,
    isSubmitting,
    setError,
    setIsSubmitting,
    validateForm,
  ]);

  return {
    handleSubmit,
    validateForm,
    buildDealInfo,
  };
}
