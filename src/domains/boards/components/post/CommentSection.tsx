"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  createComment,
  deleteComment,
  updateComment,
  getComments
} from "@/domains/boards/actions/comments/index";
import { CommentType } from "@/domains/boards/types/post/comment";
import { buildCommentTree } from "@/domains/boards/utils/comment/commentUtils";
import Comment from "./Comment";
import { Button } from "@/shared/components/ui/button";
import { createClient } from '@/shared/api/supabase';

// 내부 디바운스 함수 구현
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

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
  const [comments, setComments] = useState<CommentType[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(propCurrentUserId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyToNickname, setReplyToNickname] = useState<string | null>(null);
  const replyFormRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useMemo(() => createClient(), []);

  // 댓글 데이터 업데이트 함수 최적화 - 사용자 액션 정보 포함
  const updateComments = useCallback(async () => {
    try {
      const response = await getComments(postId);
      if (response && response.success && response.comments && response.comments.length >= 0) {
        setComments(response.comments);
      } else {

      }
    } catch {

    }
  }, [postId]);

  // 초기 댓글 로딩
  useEffect(() => {
    updateComments();
  }, [updateComments]);

  // 디바운스된 업데이트 함수
  const debouncedUpdateComments = useMemo(() => 
    debounce(updateComments, 300),
    [updateComments]
  );

  // 사용자 정보 가져오기 (props로 받지 않은 경우에만)
  useEffect(() => {
    // props로 currentUserId를 받은 경우 클라이언트 사이드에서 다시 가져오지 않음
    if (propCurrentUserId !== null) {
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
  }, [supabase.auth, propCurrentUserId]);

  // 실시간 댓글 업데이트 구독 - 별도 effect로 분리
  useEffect(() => {
    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        debouncedUpdateComments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, supabase, debouncedUpdateComments]);

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
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const result = await createComment({
        postId,
        content: content.trim(),
        parentId: replyTo
      });
      
      if (!result.success) {
        if (result.error === '로그인이 필요합니다.') {
          setErrorMessage('댓글을 작성하려면 로그인이 필요합니다.');
          alert('댓글을 작성하려면 로그인이 필요합니다.');
          return;
        }
        
        setErrorMessage(result.error || '댓글 작성에 실패했습니다.');
        alert(result.error || '댓글 작성에 실패했습니다.');
        return;
      }
      
      if (result.comment) {
        // 새 댓글에 userAction 초기값 설정
        const newComment = { ...result.comment, userAction: null } as CommentType;
        setComments(prevComments => [...prevComments, newComment]);
        setContent('');
        setReplyTo(null);
        setReplyToNickname(null);
        setErrorMessage(null);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.';
      setErrorMessage(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, content, replyTo]);
  
  // 댓글 수정 핸들러
  const handleUpdate = useCallback(async (commentId: string, updatedContent: string) => {
    try {
      
      // API 요청 대신 server action 직접 호출
      const result = await updateComment(commentId, updatedContent);
      
      if (!result.success) {
        throw new Error(result.error || '댓글 수정에 실패했습니다.');
      }
      
      // 댓글 목록 업데이트 - 기존 userAction 상태 유지
      if (result.comment) {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === commentId) {
              // 기존 userAction 상태 유지
              return { ...result.comment as CommentType, userAction: comment.userAction };
            }
            return comment;
          })
        );
      } else {
        // 데이터가 반환되지 않은 경우 전체 목록 새로고침
        await updateComments();
      }
    } catch (error) {
      throw error;
    }
  }, [updateComments]);
  
  // 댓글 삭제 핸들러
  const handleDelete = useCallback(async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      
      // API 요청 대신 server action 직접 호출
      const result = await deleteComment(commentId);
      
      if (!result.success) {
        throw new Error(result.error || '댓글 삭제에 실패했습니다.');
      }
      
      // 댓글 목록에서 삭제된 댓글 제거
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.');
    }
  }, []);

  // 텍스트영역 변경 핸들러
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  // 댓글 계층 구조로 변환
  const treeComments = useMemo(() => {
    return buildCommentTree(comments);
  }, [comments]);

  // 댓글 목록 메모이제이션 (계층 구조 렌더링)
  const commentsList = useMemo(() => {
    return treeComments.length > 0 ? (
      treeComments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId} 
          onUpdate={handleUpdate} 
          onDelete={handleDelete}
          onReply={handleReply}
          isPostOwner={currentUserId === postOwnerId}
        />
      ))
    ) : (
      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
      </div>
    );
  }, [treeComments, currentUserId, handleUpdate, handleDelete, handleReply, postOwnerId]);

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden mb-4">
      {/* 댓글 헤더 */}
      <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/7 dark:border-white/10">
        <h3 className="font-bold text-sm text-gray-900 dark:text-[#F0F0F0]">
          댓글 <span className="text-gray-900 dark:text-[#F0F0F0]">{comments.length}</span>개
        </h3>
      </div>

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
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center justify-between">
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="font-medium">{replyToNickname}</span>
              <span className="ml-1">님에게 답글 작성 중</span>
            </div>
            <button
              type="button"
              onClick={cancelReply}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              취소
            </button>
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
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            {replyTo && (
              <Button
                type="button"
                variant="ghost"
                onClick={cancelReply}
                disabled={isSubmitting}
              >
                취소
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? '작성 중...' : (replyTo ? '답글 작성' : '댓글 작성')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 