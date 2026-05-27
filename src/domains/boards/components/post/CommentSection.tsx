"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommentType } from "@/domains/boards/types/post/comment";
import { useComments } from "@/domains/boards/hooks/post/useComments";
import Comment from "./Comment";
import { Button } from "@/shared/components/ui/button";
import { Container, ContainerHeader, ContainerTitle } from "@/shared/components/ui";
import { useClickOutsideOrEscape } from '@/shared/hooks/useClickOutside';
import EmoticonPicker from './EmoticonPicker';
import { reactToPost, type PostReactionType } from '@/domains/boards/utils/post/postReactionClient';
import {
  POST_REACTION_UPDATED_EVENT,
  dispatchPostReactionUpdated,
  type PostReactionUpdatedDetail,
} from '@/domains/boards/utils/post/postReactionEvents';
import { trackEvent } from '@/shared/lib/gtag';

interface CommentSectionProps {
  postId: string;
  boardSlug?: string;
  postNumber?: string;
  postOwnerId?: string;
  currentUserId?: string | null;
  initialPostLikes?: number;
  initialPostDislikes?: number;
  initialPostUserAction?: PostReactionType | null;
  initialComments?: CommentType[];
}

export default function CommentSection({
  postId,
  postOwnerId,
  currentUserId = null,
  initialPostLikes = 0,
  initialPostDislikes = 0,
  initialPostUserAction = null,
  initialComments
}: CommentSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToNickname, setReplyToNickname] = useState<string | null>(null);
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const replyFormRef = useRef<HTMLTextAreaElement>(null);
  const emoticonContainerRef = useRef<HTMLDivElement>(null);
  const submitTypeRef = useRef<'normal' | 'withLike'>('normal');
  const postReactionStateRef = useRef({
    likes: initialPostLikes,
    dislikes: initialPostDislikes,
    userAction: initialPostUserAction,
  });

  const isLoggedIn = currentUserId !== null;

  // 이모티콘 피커 외부 클릭/ESC 닫기
  useClickOutsideOrEscape(emoticonContainerRef, () => setShowEmoticonPicker(false), showEmoticonPicker);

  useEffect(() => {
    postReactionStateRef.current = {
      likes: initialPostLikes,
      dislikes: initialPostDislikes,
      userAction: initialPostUserAction,
    };
  }, [initialPostLikes, initialPostDislikes, initialPostUserAction]);

  useEffect(() => {
    const handlePostReactionUpdated = (event: Event) => {
      const detail = (event as CustomEvent<PostReactionUpdatedDetail>).detail;
      if (!detail || detail.postId !== postId) return;
      postReactionStateRef.current = {
        likes: detail.likes,
        dislikes: detail.dislikes,
        userAction: detail.userAction,
      };
    };

    window.addEventListener(POST_REACTION_UPDATED_EVENT, handlePostReactionUpdated);
    return () => window.removeEventListener(POST_REACTION_UPDATED_EVENT, handlePostReactionUpdated);
  }, [postId]);

  const {
    comments,
    treeComments,
    commentCount,
    isLoading,
    isCreating,
    createComment,
    updateComment,
    deleteComment,
    likeComment,
    dislikeComment,
    likingCommentId
  } = useComments({ postId, initialComments });

  // URL 해시 감지 → 댓글 스크롤 + 하이라이트
  const hasScrolledRef = useRef(false);

  // comment_number가 로드됐는지 확인 (첫 댓글에 comment_number가 있으면 로드 완료)
  const numbersReady = treeComments.length > 0 && treeComments[0].comment_number != null;

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#comment-') || hasScrolledRef.current) return;
    if (isLoading || treeComments.length === 0 || !numbersReady) return;

    const commentNumber = hash.replace('#comment-', '');

    const scrollToElement = () => {
      const element = document.getElementById(`comment-${commentNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedNumber(commentNumber);
        hasScrolledRef.current = true;
        setTimeout(() => setHighlightedNumber(null), 2000);
        // 이미지 로드 등 레이아웃 변경 후 한 번 더 보정
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
      }
    };

    // 페이지 이미지 로드 완료 대기 후 스크롤
    if (document.readyState === 'complete') {
      requestAnimationFrame(scrollToElement);
    } else {
      window.addEventListener('load', scrollToElement, { once: true });
    }
  }, [isLoading, treeComments, numbersReady]);

  // hashchange 이벤트 대응 (같은 페이지 내 해시 변경)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#comment-')) return;

      const commentNumber = hash.replace('#comment-', '');
      const element = document.getElementById(`comment-${commentNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedNumber(commentNumber);
        setTimeout(() => setHighlightedNumber(null), 2000);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 답글 시작 핸들러
  const handleReply = useCallback((parentId: string) => {
    const parentComment = comments.find(c => c.id === parentId);
    setReplyTo(parentId);
    setReplyToNickname(parentComment?.profiles?.nickname || '알 수 없음');
    setContent('');
    setTimeout(() => {
      replyFormRef.current?.focus();
      replyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [comments]);

  const cancelReply = useCallback(() => {
    setReplyTo(null);
    setReplyToNickname(null);
    setContent('');
  }, []);

  // 댓글 제출 핸들러
  const handleCommentSubmit = useCallback(async (e?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    setErrorMessage(null);

    try {
      const shouldLikeWithComment = submitTypeRef.current === 'withLike'
        && postReactionStateRef.current.userAction !== 'like';
      const previousReactionState = postReactionStateRef.current;
      let reactionPromise: ReturnType<typeof reactToPost> | null = null;

      if (shouldLikeWithComment) {
        const optimisticState = {
          likes: previousReactionState.likes + 1,
          dislikes: previousReactionState.userAction === 'dislike'
            ? Math.max(0, previousReactionState.dislikes - 1)
            : previousReactionState.dislikes,
          userAction: 'like' as const,
        };

        postReactionStateRef.current = optimisticState;
        dispatchPostReactionUpdated({ postId, ...optimisticState });
        reactionPromise = reactToPost(postId, 'like');
      }

      await createComment(content.trim(), replyTo);
      trackEvent('comment_submit', {
        post_id: postId,
        is_reply: Boolean(replyTo),
        page: pathname,
      });

      if (reactionPromise) {
        const reactionResult = await reactionPromise;
          if (!reactionResult.success) {
            postReactionStateRef.current = previousReactionState;
            dispatchPostReactionUpdated({ postId, ...previousReactionState });
            throw new Error(reactionResult.error || '추천 처리에 실패했습니다.');
          }

          const nextAction = reactionResult.userAction || null;
        const nextState = {
            likes: reactionResult.likes ?? 0,
            dislikes: reactionResult.dislikes ?? 0,
            userAction: nextAction,
        };
        postReactionStateRef.current = nextState;
        dispatchPostReactionUpdated({ postId, ...nextState });
      }

      setContent('');
      setReplyTo(null);
      setReplyToNickname(null);
      setErrorMessage(null);
      submitTypeRef.current = 'normal';
    } catch (error) {
      const message = error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.';
      setErrorMessage(message);

      if (message === '로그인이 필요합니다.') {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
      } else {
        alert(message);
      }
    }
  }, [content, replyTo, createComment, postId, pathname]);

  const handleUpdate = useCallback(async (commentId: string, updatedContent: string) => {
    await updateComment(commentId, updatedContent);
  }, [updateComment]);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
    } catch (error) {
      alert(error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.');
    }
  }, [deleteComment]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleEmoticonSelect = useCallback((code: string) => {
    const textarea = replyFormRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + code + content.substring(end);

      setContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + code.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + code);
    }
  }, [content]);

  const commentsList = useMemo(() => {
    if (isLoading) {
      return (
        <div className="px-4 py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
          댓글을 불러오는 중...
        </div>
      );
    }

    return treeComments.length > 0 ? (
      treeComments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReply={handleReply}
          onLike={likeComment}
          onDislike={dislikeComment}
          likingCommentId={likingCommentId}
          postOwnerId={postOwnerId}
          isHighlighted={highlightedNumber === String(comment.comment_number ?? comment.id)}
          highlightedCommentId={highlightedNumber}
          commentPermalink={`${pathname}#comment-${comment.comment_number ?? comment.id}`}
        />
      ))
    ) : (
      <div className="px-4 py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
      </div>
    );
  }, [treeComments, currentUserId, handleUpdate, handleDelete, handleReply, postOwnerId, likeComment, dislikeComment, likingCommentId, isLoading, highlightedNumber, pathname]);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4 !overflow-visible">
      <ContainerHeader>
        <ContainerTitle>
          댓글 <span className="text-gray-900 dark:text-[#F0F0F0]">{commentCount}</span>개
        </ContainerTitle>
      </ContainerHeader>

      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {commentsList}
      </div>

      {/* 댓글 작성 폼 */}
      <div className="px-4 py-4 border-t border-black/7 dark:border-white/10">
        {errorMessage && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-[13px]">
            {errorMessage}
          </div>
        )}

        {!isLoggedIn ? (
          <div
            className="relative cursor-pointer"
            onClick={() => {
              if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/signin');
              }
            }}
          >
            <textarea
              className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-gray-50 dark:bg-[#262626] text-gray-400 dark:text-gray-500 rounded-lg text-[13px] placeholder-gray-400 dark:placeholder-gray-500 resize-none pointer-events-none"
              rows={3}
              placeholder="댓글을 작성하려면 로그인해주세요."
              disabled
              readOnly
            />
          </div>
        ) : (
          <>
            {/* 답글 대상 표시 */}
            {replyTo && replyToNickname && (
              <div className="mb-3 p-3 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-md flex items-center justify-between">
                <div className="flex items-center text-[13px] text-gray-900 dark:text-[#F0F0F0]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span className="font-medium">{replyToNickname}</span>
                  <span className="ml-1">님에게 답글 작성 중</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelReply}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#F0F0F0]"
                >
                  취소
                </Button>
              </div>
            )}

            <form className="space-y-3" onSubmit={handleCommentSubmit}>
              <textarea
                ref={replyFormRef}
                className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg text-base sm:text-[13px] placeholder-gray-500 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors duration-200 resize-none"
                rows={3}
                placeholder={replyTo ? "답글을 작성해주세요..." : "댓글을 작성해주세요..."}
                value={content}
                onChange={handleTextareaChange}
                required
                disabled={isCreating}
              />
              <div className="flex justify-between w-full relative">
                <div ref={emoticonContainerRef} className="relative">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowEmoticonPicker(!showEmoticonPicker)}
                    className="h-[40px] font-medium"
                  >
                    이모티콘
                  </Button>

                  {showEmoticonPicker && (
                    <EmoticonPicker
                      onSelect={handleEmoticonSelect}
                      onClose={() => setShowEmoticonPicker(false)}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {replyTo && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={cancelReply}
                      disabled={isCreating}
                    >
                      취소
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant={replyTo ? 'primary' : 'secondary'}
                    disabled={isCreating || !content.trim()}
                    className="h-[40px] font-medium"
                    onClick={(e) => {
                      submitTypeRef.current = 'normal';
                      handleCommentSubmit(e);
                    }}
                  >
                    {isCreating ? '진행 중...' : (replyTo ? '답글 작성' : '등록')}
                  </Button>
                  {!replyTo && (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={isCreating || !content.trim()}
                      className="h-[40px] font-medium"
                      onClick={(e) => {
                        submitTypeRef.current = 'withLike';
                        handleCommentSubmit(e);
                      }}
                    >
                      {isCreating ? '진행 중...' : '등록+추천'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </Container>
  );
}
