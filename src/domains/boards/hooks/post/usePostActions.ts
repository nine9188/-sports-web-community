'use client';

// 게시글 관련 액션 훅
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/shared/context/AuthContext';
import { likePost, dislikePost } from '@/domains/boards/actions/posts/index';

interface UsePostActionsProps {
  postId: string;
  initialLikes?: number;
  initialDislikes?: number;
}

/**
 * 게시글 액션(좋아요, 싫어요 등)을 관리하는 커스텀 훅
 * @param params 게시글 ID, 초기 좋아요 수, 초기 싫어요 수
 * @returns 게시글 액션 관련 상태 및 함수
 */
export function usePostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0 
}: UsePostActionsProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLoading, setIsLoading] = useState(false);
  const [userAction, setUserAction] = useState<string | null>(null);

  /**
   * 게시글 좋아요 처리
   */
  const handleLike = useCallback(async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const result = await likePost(postId);
      
      if (result.success) {
        setLikes(result.likes || 0);
        setDislikes(result.dislikes || 0);
        setUserAction(result.userAction || null);
        
        if (result.userAction === 'like') {
          toast.success('게시글을 추천했습니다.');
        } else {
          toast.success('추천을 취소했습니다.');
        }
      } else {
        toast.error(result.error || '추천 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('좋아요 처리 오류:', error);
      toast.error('추천 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, user, isLoading]);

  /**
   * 게시글 싫어요 처리
   */
  const handleDislike = useCallback(async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      
      const result = await dislikePost(postId);
      
      if (result.success) {
        setLikes(result.likes || 0);
        setDislikes(result.dislikes || 0);
        setUserAction(result.userAction || null);
        
        if (result.userAction === 'dislike') {
          toast.success('게시글을 비추천했습니다.');
        } else {
          toast.success('비추천을 취소했습니다.');
        }
      } else {
        toast.error(result.error || '비추천 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('싫어요 처리 오류:', error);
      toast.error('비추천 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, user, isLoading]);

  return {
    likes,
    dislikes,
    isLoading,
    userAction,
    handleLike,
    handleDislike
  };
} 