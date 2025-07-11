"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  createComment,
  deleteComment,
  updateComment,
  getComments
} from "@/domains/boards/actions/comments/index";
import { CommentType } from "@/domains/boards/types/post/comment";
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
}

export default function CommentSection({ postId, postOwnerId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // 댓글 데이터 업데이트 함수 최적화 - 사용자 액션 정보 포함
  const updateComments = useCallback(async () => {
    try {
      const response = await getComments(postId);
      if (response && response.success && response.comments && response.comments.length >= 0) {
        setComments(response.comments);
      } else {
        console.error('댓글 업데이트 실패:', response?.error || '응답이 없습니다');
      }
    } catch (error) {
      console.error("댓글 실시간 업데이트 중 오류:", error);
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

  // 사용자 정보 가져오기
  useEffect(() => {
    let isMounted = true;
    
    const getCurrentUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user && isMounted) {
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    };
    
    getCurrentUser();
    
    return () => {
      isMounted = false;
    };
  }, [supabase.auth]);

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

  // 댓글 제출 핸들러
  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const result = await createComment({
        postId,
        content: content.trim()
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
        setErrorMessage(null);
      }
      
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
      const message = error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.';
      setErrorMessage(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, content]);
  
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
      console.error('댓글 수정 중 오류:', error);
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
      console.error('댓글 삭제 중 오류:', error);
      alert(error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.');
    }
  }, []);

  // 텍스트영역 변경 핸들러
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  // 댓글 목록 메모이제이션
  const commentsList = useMemo(() => {
    return comments.length > 0 ? (
      comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId} 
          onUpdate={handleUpdate} 
          onDelete={handleDelete}
          isPostOwner={currentUserId === postOwnerId}
        />
      ))
    ) : (
      <div className="px-4 py-8 text-center text-sm text-gray-500">
        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
      </div>
    );
  }, [comments, currentUserId, handleUpdate, handleDelete, postOwnerId]);

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-4">
      {/* 댓글 헤더 */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <h3 className="font-medium text-sm text-gray-900">
          댓글 <span className="text-blue-600">{comments.length}</span>개
        </h3>
      </div>
      
      {/* 댓글 목록 */}
      <div className="divide-y divide-gray-100">
        {commentsList}
      </div>

      {/* 댓글 작성 폼 */}
      <div className="px-4 py-4 border-t bg-gray-50">
        {errorMessage && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        <form className="space-y-3" onSubmit={handleCommentSubmit}>
          <textarea 
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="댓글을 작성해주세요..."
            value={content}
            onChange={handleTextareaChange}
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 text-sm font-medium"
            >
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 