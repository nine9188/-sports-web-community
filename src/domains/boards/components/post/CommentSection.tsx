"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { CommentType } from "@/domains/boards/types/post/comment";
import { useComments } from "@/domains/boards/hooks/post/useComments";
import Comment from "./Comment";
import { Button } from "@/shared/components/ui/button";
import { Container, ContainerHeader, ContainerTitle } from "@/shared/components/ui";
import { getSupabaseBrowser } from '@/shared/lib/supabase';

interface CommentSectionProps {
  postId: string;
  boardSlug?: string;
  postNumber?: string;
  postOwnerId?: string;
  currentUserId?: string | null;
}

export default function CommentSection({
  postId,
  postOwnerId,
  currentUserId: propCurrentUserId = null
}: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToNickname, setReplyToNickname] = useState<string | null>(null);
  const replyFormRef = useRef<HTMLTextAreaElement>(null);

  // React Query 기반 댓글 훅
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
    isLiking
  } = useComments({ postId });

  // Supabase 클라이언트 (SSR 안전)
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getSupabaseBrowser();
  }, []);

  // 사용자 정보 가져오기 (props로 받지 않은 경우에만)
  useEffect(() => {
    if (!supabase || propCurrentUserId !== null) {
      return;
    }

    let isMounted = true;

    const getCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user && isMounted) {
          setCurrentUserId(data.user.id);
        } else {
          setCurrentUserId(null);
        }
      } catch {
        setCurrentUserId(null);
      }
    };

    getCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [supabase, propCurrentUserId]);

  // 답글 시작 핸들러
  const handleReply = useCallback((parentId: string) => {
    const parentComment = comments.find(c => c.id === parentId);
    setReplyTo(parentId);
    setReplyToNickname(parentComment?.profiles?.nickname || '알 수 없음');
    setContent('');
    // 답글 폼으로 스크롤 및 포커스
    setTimeout(() => {
      replyFormRef.current?.focus();
      replyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [comments]);

  // 답글 취소 핸들러
  const cancelReply = useCallback(() => {
    setReplyTo(null);
    setReplyToNickname(null);
    setContent('');
  }, []);

  // 댓글 제출 핸들러
  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setErrorMessage(null);

    try {
      await createComment(content.trim(), replyTo);
      setContent('');
      setReplyTo(null);
      setReplyToNickname(null);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.';
      setErrorMessage(message);

      if (message === '로그인이 필요합니다.') {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
      } else {
        alert(message);
      }
    }
  }, [content, replyTo, createComment]);

  // 댓글 수정 핸들러
  const handleUpdate = useCallback(async (commentId: string, updatedContent: string) => {
    try {
      await updateComment(commentId, updatedContent);
    } catch (error) {
      throw error;
    }
  }, [updateComment]);

  // 댓글 삭제 핸들러
  const handleDelete = useCallback(async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteComment(commentId);
    } catch (error) {
      alert(error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.');
    }
  }, [deleteComment]);

  // 텍스트영역 변경 핸들러
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  // 댓글 목록 메모이제이션 (계층 구조 렌더링)
  const commentsList = useMemo(() => {
    if (isLoading) {
      return (
        <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
          isLiking={isLiking}
          isPostOwner={currentUserId === postOwnerId}
        />
      ))
    ) : (
      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
      </div>
    );
  }, [treeComments, currentUserId, handleUpdate, handleDelete, handleReply, postOwnerId, likeComment, dislikeComment, isLiking, isLoading]);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      {/* 댓글 헤더 */}
      <ContainerHeader>
        <ContainerTitle>
          댓글 <span className="text-gray-900 dark:text-[#F0F0F0]">{commentCount}</span>개
        </ContainerTitle>
      </ContainerHeader>

      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {commentsList}
      </div>

      {/* 댓글 작성 폼 */}
      <div className="px-4 py-4 border-t border-black/7 dark:border-white/10">
        {errorMessage && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        {/* 답글 대상 표시 */}
        {replyTo && replyToNickname && (
          <div className="mb-3 p-3 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-md flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-900 dark:text-[#F0F0F0]">
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
            className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors duration-200 resize-none"
            rows={3}
            placeholder={replyTo ? "답글을 작성해주세요..." : "댓글을 작성해주세요..."}
            value={content}
            onChange={handleTextareaChange}
            required
            disabled={isCreating}
          />
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
              type="submit"
              variant="primary"
              disabled={isCreating || !content.trim()}
            >
              {isCreating ? '작성 중...' : (replyTo ? '답글 작성' : '댓글 작성')}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
