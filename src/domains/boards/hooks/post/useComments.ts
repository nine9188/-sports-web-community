'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommentType } from '../../types/post/comment';
import { buildCommentTree } from '../../utils/comment/commentUtils';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment
} from '../../actions/comments/index';
import { getSupabaseBrowser } from '@/shared/lib/supabase';

// Query Keys 상수
export const commentKeys = {
  all: ['comments'] as const,
  list: (postId: string) => [...commentKeys.all, 'list', postId] as const,
};

interface UseCommentsProps {
  postId: string;
  enabled?: boolean;
}

interface UseCommentsReturn {
  // 데이터
  comments: CommentType[];
  treeComments: CommentType[];
  commentCount: number;

  // 상태
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;

  // 댓글 작성
  createComment: (content: string, parentId?: string | null) => Promise<void>;
  isCreating: boolean;

  // 댓글 수정
  updateComment: (commentId: string, content: string) => Promise<void>;
  isUpdating: boolean;

  // 댓글 삭제
  deleteComment: (commentId: string) => Promise<void>;
  isDeleting: boolean;

  // 좋아요/싫어요
  likeComment: (commentId: string) => Promise<void>;
  dislikeComment: (commentId: string) => Promise<void>;
  isLiking: boolean;

  // 데이터 갱신
  refetch: () => void;
}

/**
 * 댓글 관련 상태 및 액션을 관리하는 커스텀 훅 (React Query 기반)
 */
export function useComments({ postId, enabled = true }: UseCommentsProps): UseCommentsReturn {
  const queryClient = useQueryClient();

  // Supabase 클라이언트 (클라이언트 사이드에서만 사용)
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getSupabaseBrowser();
  }, []);

  // 댓글 목록 조회
  const {
    data: commentsData,
    isLoading,
    isFetching,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: commentKeys.list(postId),
    queryFn: async () => {
      const response = await getComments(postId);
      if (!response.success) {
        throw new Error(response.error || '댓글을 불러오는데 실패했습니다.');
      }
      return response.comments || [];
    },
    enabled: enabled && !!postId,
    staleTime: 1000 * 60, // 1분
    gcTime: 1000 * 60 * 5, // 5분
  });

  // 댓글 데이터와 트리 구조
  const comments = commentsData || [];
  const treeComments = useMemo(() => buildCommentTree(comments), [comments]);
  const commentCount = comments.length;

  // 실시간 업데이트 구독
  useEffect(() => {
    if (!supabase || !postId || !enabled) return;

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // 실시간 변경 감지 시 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, postId, enabled, queryClient]);

  // 댓글 작성 mutation
  const createMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      const result = await createComment({ postId, content, parentId });
      if (!result.success) {
        throw new Error(result.error || '댓글 작성에 실패했습니다.');
      }
      return result.comment;
    },
    onSuccess: (newComment) => {
      // 새 댓글을 캐시에 추가 (optimistic update)
      if (newComment) {
        queryClient.setQueryData<CommentType[]>(
          commentKeys.list(postId),
          (old) => [...(old || []), { ...newComment, userAction: null } as CommentType]
        );
      }
    },
    onError: (error) => {
      console.error('댓글 작성 오류:', error);
    },
  });

  // 댓글 수정 mutation
  const updateMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const result = await updateComment(commentId, content);
      if (!result.success) {
        throw new Error(result.error || '댓글 수정에 실패했습니다.');
      }
      return result.comment;
    },
    onSuccess: (updatedComment, { commentId }) => {
      // 수정된 댓글을 캐시에 업데이트
      if (updatedComment) {
        queryClient.setQueryData<CommentType[]>(
          commentKeys.list(postId),
          (old) =>
            old?.map((comment) =>
              comment.id === commentId
                ? { ...updatedComment, userAction: comment.userAction }
                : comment
            ) || []
        );
      }
    },
  });

  // 댓글 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await deleteComment(commentId);
      if (!result.success) {
        throw new Error(result.error || '댓글 삭제에 실패했습니다.');
      }
      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      // 삭제된 댓글을 캐시에서 제거
      queryClient.setQueryData<CommentType[]>(
        commentKeys.list(postId),
        (old) => old?.filter((comment) => comment.id !== deletedCommentId) || []
      );
    },
  });

  // 좋아요 mutation
  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await likeComment(commentId);
      if (!result.success) {
        throw new Error(result.error || '좋아요 처리에 실패했습니다.');
      }
      return { commentId, ...result };
    },
    onSuccess: ({ commentId, likes, dislikes, userAction }) => {
      // 좋아요/싫어요 카운트 업데이트
      queryClient.setQueryData<CommentType[]>(
        commentKeys.list(postId),
        (old) =>
          old?.map((comment) =>
            comment.id === commentId
              ? { ...comment, likes: likes || 0, dislikes: dislikes || 0, userAction: userAction || null }
              : comment
          ) || []
      );
    },
  });

  // 싫어요 mutation
  const dislikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await dislikeComment(commentId);
      if (!result.success) {
        throw new Error(result.error || '싫어요 처리에 실패했습니다.');
      }
      return { commentId, ...result };
    },
    onSuccess: ({ commentId, likes, dislikes, userAction }) => {
      // 좋아요/싫어요 카운트 업데이트
      queryClient.setQueryData<CommentType[]>(
        commentKeys.list(postId),
        (old) =>
          old?.map((comment) =>
            comment.id === commentId
              ? { ...comment, likes: likes || 0, dislikes: dislikes || 0, userAction: userAction || null }
              : comment
          ) || []
      );
    },
  });

  // 핸들러 함수들
  const handleCreateComment = useCallback(
    async (content: string, parentId?: string | null) => {
      await createMutation.mutateAsync({ content, parentId });
    },
    [createMutation]
  );

  const handleUpdateComment = useCallback(
    async (commentId: string, content: string) => {
      await updateMutation.mutateAsync({ commentId, content });
    },
    [updateMutation]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      await deleteMutation.mutateAsync(commentId);
    },
    [deleteMutation]
  );

  const handleLikeComment = useCallback(
    async (commentId: string) => {
      await likeMutation.mutateAsync(commentId);
    },
    [likeMutation]
  );

  const handleDislikeComment = useCallback(
    async (commentId: string) => {
      await dislikeMutation.mutateAsync(commentId);
    },
    [dislikeMutation]
  );

  return {
    // 데이터
    comments,
    treeComments,
    commentCount,

    // 상태
    isLoading,
    isFetching,
    error: queryError?.message || null,

    // 댓글 작성
    createComment: handleCreateComment,
    isCreating: createMutation.isPending,

    // 댓글 수정
    updateComment: handleUpdateComment,
    isUpdating: updateMutation.isPending,

    // 댓글 삭제
    deleteComment: handleDeleteComment,
    isDeleting: deleteMutation.isPending,

    // 좋아요/싫어요
    likeComment: handleLikeComment,
    dislikeComment: handleDislikeComment,
    isLiking: likeMutation.isPending || dislikeMutation.isPending,

    // 데이터 갱신
    refetch: () => refetch(),
  };
}
