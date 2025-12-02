'use client';

// 댓글 관련 훅
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CommentType } from '../../types/post/comment';
import { buildCommentTree } from '../../utils/post/postUtils';

interface UseCommentsProps {
  postId: string;
  initialComments: CommentType[];
  postOwnerId: string;
}

/**
 * 댓글 관련 상태 및 액션을 관리하는 커스텀 훅
 * @param params 게시글 ID, 초기 댓글 목록, 게시글 작성자 ID
 * @returns 댓글 관련 상태 및 함수
 */
export function useComments({
  postId,
  initialComments,
  postOwnerId
}: UseCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentType[]>(initialComments || []);
  const [isLoading, setIsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [treeComments, setTreeComments] = useState<CommentType[]>([]);

  // 댓글 계층 구조 생성
  useEffect(() => {
    if (comments.length > 0) {
      const tree = buildCommentTree(comments);
      setTreeComments(tree);
    } else {
      setTreeComments([]);
    }
  }, [comments]);

  // 댓글 작성
  const submitComment = useCallback(async () => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 댓글 작성 API 호출
      // const result = await createComment({
      //  postId,
      //  content,
      //  parentId: replyTo
      // });
      
      // 임시 댓글 ID 생성 (실제로는 서버에서 생성된 ID 사용)
      const newCommentId = `temp-${Date.now()}`;
      
      // 새 댓글 객체 생성
      const newComment: CommentType = {
        id: newCommentId,
        post_id: postId,
        user_id: 'current-user-id', // 실제로는 현재 사용자 ID
        content,
        created_at: new Date().toISOString(),
        parent_id: replyTo,
        profiles: {
          nickname: '현재 사용자', // 실제로는 현재 사용자 닉네임
          icon_id: null
        }
      };
      
      // 댓글 목록 업데이트
      setComments(prevComments => [...prevComments, newComment]);
      
      // 입력 필드 초기화
      setContent('');
      setReplyTo(null);
      
      // 화면 새로고침 (필요에 따라)
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [content, postId, replyTo, router, isLoading]);

  // 댓글 삭제
  const deleteComment = useCallback(async (commentId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 댓글 삭제 API 호출
      // await deleteCommentAction(commentId);
      
      // 댓글 목록에서 삭제된 댓글 제거
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
      
      // 화면 새로고침 (필요에 따라)
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [router, isLoading]);

  // 댓글 수정
  const startReply = useCallback((commentId: string) => {
    setReplyTo(commentId);
    setContent(''); // 새 답글 작성 시 내용 초기화
  }, []);

  // 답글 작성 취소
  const cancelReply = useCallback(() => {
    setReplyTo(null);
    setContent('');
  }, []);

  return {
    comments: treeComments,
    allComments: comments,
    isLoading,
    content,
    setContent,
    error,
    replyTo,
    startReply,
    cancelReply,
    submitComment,
    deleteComment,
    postOwnerId
  };
} 