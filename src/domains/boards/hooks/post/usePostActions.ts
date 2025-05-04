'use client';

// 게시글 관련 액션 훅
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UsePostActionsProps {
  postId: string;
  boardId: string;
  initialLikes?: number;
  initialDislikes?: number;
}

/**
 * 게시글 액션(좋아요, 싫어요 등)을 관리하는 커스텀 훅
 * @param params 게시글 ID, 게시판 ID, 초기 좋아요 수, 초기 싫어요 수
 * @returns 게시글 액션 관련 상태 및 함수
 */
export function usePostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0 
}: Omit<UsePostActionsProps, 'boardId'>) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isDislikeLoading, setIsDislikeLoading] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 게시글 좋아요 처리
   */
  const handleLike = async () => {
    if (isLikeLoading || isDislikeLoading) return;
    setIsLikeLoading(true);
    setError(null);
    
    try {
      // 이미 좋아요를 한 경우 취소, 아니면 좋아요 처리
      if (hasLiked) {
        // 좋아요 취소 API 호출
        // await cancelLikePost(postId); - 실제 구현 시 서버 액션 호출
        setLikes(prev => Math.max(0, prev - 1));
        setHasLiked(false);
      } else {
        // 이미 싫어요를 한 경우 싫어요 취소
        if (hasDisliked) {
          // await cancelDislikePost(postId); - 실제 구현 시 서버 액션 호출
          setDislikes(prev => Math.max(0, prev - 1));
          setHasDisliked(false);
        }
        
        // 좋아요 API 호출
        // await likePost(postId); - 실제 구현 시 서버 액션 호출
        console.log(`게시글 ID: ${postId} 좋아요 처리`);
        setLikes(prev => prev + 1);
        setHasLiked(true);
      }
      
      // 새로고침 대신 상태만 업데이트
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  /**
   * 게시글 싫어요 처리
   */
  const handleDislike = async () => {
    if (isLikeLoading || isDislikeLoading) return;
    setIsDislikeLoading(true);
    setError(null);
    
    try {
      // 이미 싫어요를 한 경우 취소, 아니면 싫어요 처리
      if (hasDisliked) {
        // 싫어요 취소 API 호출
        // await cancelDislikePost(postId); - 실제 구현 시 서버 액션 호출
        setDislikes(prev => Math.max(0, prev - 1));
        setHasDisliked(false);
      } else {
        // 이미 좋아요를 한 경우 좋아요 취소
        if (hasLiked) {
          // await cancelLikePost(postId); - 실제 구현 시 서버 액션 호출
          setLikes(prev => Math.max(0, prev - 1));
          setHasLiked(false);
        }
        
        // 싫어요 API 호출
        // await dislikePost(postId); - 실제 구현 시 서버 액션 호출
        console.log(`게시글 ID: ${postId} 싫어요 처리`);
        setDislikes(prev => prev + 1);
        setHasDisliked(true);
      }
      
      // 새로고침 대신 상태만 업데이트
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '싫어요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDislikeLoading(false);
    }
  };

  return {
    likes,
    dislikes,
    isLikeLoading,
    isDislikeLoading,
    hasLiked,
    hasDisliked,
    error,
    handleLike,
    handleDislike
  };
} 