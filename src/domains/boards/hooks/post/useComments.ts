'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommentType } from '../../types/post/comment';
import { buildCommentTree } from '../../utils/comment/commentUtils';
import {
  getComments,
  createComment as createCommentAction,
  updateComment as updateCommentAction,
  deleteComment as deleteCommentAction,
  likeComment as likeCommentAction,
  dislikeComment as dislikeCommentAction,
} from '../../actions/comments/index';
import { getSupabaseBrowser } from '@/shared/lib/supabase';

interface UseCommentsProps {
  postId: string;
  enabled?: boolean;
  initialComments?: CommentType[];
}

interface UseCommentsReturn {
  comments: CommentType[];
  treeComments: CommentType[];
  commentCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  createComment: (content: string, parentId?: string | null) => Promise<void>;
  isCreating: boolean;
  updateComment: (commentId: string, content: string) => Promise<void>;
  isUpdating: boolean;
  deleteComment: (commentId: string) => Promise<void>;
  isDeleting: boolean;
  likeComment: (commentId: string) => Promise<void>;
  dislikeComment: (commentId: string) => Promise<void>;
  isLiking: boolean;
  likingCommentId: string | null;
  refetch: () => void;
}

export function useComments({ postId, enabled = true, initialComments }: UseCommentsProps): UseCommentsReturn {
  const [commentsData, setCommentsData] = useState<CommentType[]>(initialComments || []);
  const [commentNumbers, setCommentNumbers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(!initialComments && enabled);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return getSupabaseBrowser();
  }, []);

  const refetch = useCallback(() => {
    setVersion(value => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !postId) return;
    if (initialComments && version === 0) {
      setIsLoading(false);
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    async function loadComments() {
      const initialLoad = !initialComments && commentsData.length === 0;
      setIsLoading(initialLoad);
      setIsFetching(!initialLoad);
      setError(null);

      try {
        const response = await getComments(postId);
        if (!response.success) {
          throw new Error(response.error || '댓글을 불러오지 못했습니다.');
        }
        if (!cancelled) {
          setCommentsData(response.comments || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '댓글을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    }

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [postId, enabled, version]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !postId || !supabase) return;

    let cancelled = false;

    async function loadNumbers() {
      const { data } = await supabase
        .from('comments')
        .select('id, comment_number')
        .eq('post_id', postId);

      if (cancelled) return;

      const map: Record<string, number> = {};
      if (data) {
        (data as unknown as { id: string; comment_number: number }[]).forEach(row => {
          map[row.id] = row.comment_number;
        });
      }
      setCommentNumbers(map);
    }

    loadNumbers();

    return () => {
      cancelled = true;
    };
  }, [postId, enabled, supabase, version]);

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
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, postId, enabled, refetch]);

  const comments = useMemo(() => {
    if (!commentNumbers || Object.keys(commentNumbers).length === 0) return commentsData;
    return commentsData.map(comment => ({
      ...comment,
      comment_number: comment.comment_number ?? commentNumbers[comment.id],
    }));
  }, [commentsData, commentNumbers]);

  const treeComments = useMemo(() => buildCommentTree(comments), [comments]);
  const commentCount = comments.length;

  const createComment = useCallback(async (content: string, parentId?: string | null) => {
    setIsCreating(true);
    try {
      const result = await createCommentAction({ postId, content, parentId });
      if (!result.success) {
        throw new Error(result.error || '댓글 작성에 실패했습니다.');
      }
      if (result.comment) {
        setCommentsData(old => [...old, { ...result.comment, userAction: null } as CommentType]);
      }
    } finally {
      setIsCreating(false);
    }
  }, [postId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    setIsUpdating(true);
    try {
      const result = await updateCommentAction(commentId, content);
      if (!result.success) {
        throw new Error(result.error || '댓글 수정에 실패했습니다.');
      }
      if (result.comment) {
        setCommentsData(old => old.map(comment =>
          comment.id === commentId
            ? { ...result.comment, userAction: comment.userAction } as CommentType
            : comment
        ));
      }
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteCommentAction(commentId);
      if (!result.success) {
        throw new Error(result.error || '댓글 삭제에 실패했습니다.');
      }
      setCommentsData(old => old.filter(comment => comment.id !== commentId));
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const likeComment = useCallback(async (commentId: string) => {
    setIsLiking(true);
    setLikingCommentId(commentId);
    try {
      const result = await likeCommentAction(commentId);
      if (!result.success) {
        throw new Error(result.error || '좋아요 처리에 실패했습니다.');
      }
      setCommentsData(old => old.map(comment =>
        comment.id === commentId
          ? { ...comment, likes: result.likes || 0, dislikes: result.dislikes || 0, userAction: result.userAction || null }
          : comment
      ));
    } finally {
      setIsLiking(false);
      setLikingCommentId(null);
    }
  }, []);

  const dislikeComment = useCallback(async (commentId: string) => {
    setIsLiking(true);
    setLikingCommentId(commentId);
    try {
      const result = await dislikeCommentAction(commentId);
      if (!result.success) {
        throw new Error(result.error || '싫어요 처리에 실패했습니다.');
      }
      setCommentsData(old => old.map(comment =>
        comment.id === commentId
          ? { ...comment, likes: result.likes || 0, dislikes: result.dislikes || 0, userAction: result.userAction || null }
          : comment
      ));
    } finally {
      setIsLiking(false);
      setLikingCommentId(null);
    }
  }, []);

  return {
    comments,
    treeComments,
    commentCount,
    isLoading,
    isFetching,
    error,
    createComment,
    isCreating,
    updateComment,
    isUpdating,
    deleteComment,
    isDeleting,
    likeComment,
    dislikeComment,
    isLiking,
    likingCommentId,
    refetch,
  };
}
