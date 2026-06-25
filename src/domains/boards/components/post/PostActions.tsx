"use client";

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui';
import { reactToPost } from '@/domains/boards/utils/post/postReactionClient';
import {
  POST_REACTION_UPDATED_EVENT,
  dispatchPostReactionUpdated,
  type PostReactionUpdatedDetail,
} from '@/domains/boards/utils/post/postReactionEvents';

interface PostActionsProps {
  postId: string;
  boardId?: string;
  initialLikes: number;
  initialDislikes: number;
  initialUserAction: 'like' | 'dislike' | null;
  isLoggedIn?: boolean;
}

type ReactionType = 'like' | 'dislike';

function getReactionSuccessMessage(
  type: ReactionType,
  previousAction: ReactionType | null,
  nextAction: ReactionType | null,
) {
  if (nextAction === 'like') {
    return previousAction === 'dislike' ? '추천으로 변경했습니다.' : '게시글을 추천했습니다.';
  }

  if (nextAction === 'dislike') {
    return previousAction === 'like' ? '비추천으로 변경했습니다.' : '게시글을 비추천했습니다.';
  }

  return type === 'like' ? '추천을 취소했습니다.' : '비추천을 취소했습니다.';
}

export default function PostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0,
  initialUserAction = null,
  isLoggedIn = false,
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(initialUserAction);
  // 서버 데이터가 변경되면(router.refresh 등) 로컬 상태 동기화
  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setUserAction(initialUserAction);
  }, [initialLikes, initialDislikes, initialUserAction]);

  useEffect(() => {
    const handleExternalReaction = (event: Event) => {
      const detail = (event as CustomEvent<PostReactionUpdatedDetail>).detail;
      if (!detail || detail.postId !== postId) return;

      setLikes(detail.likes);
      setDislikes(detail.dislikes);
      setUserAction(detail.userAction);
    };

    window.addEventListener(POST_REACTION_UPDATED_EVENT, handleExternalReaction);
    return () => window.removeEventListener(POST_REACTION_UPDATED_EVENT, handleExternalReaction);
  }, [postId]);
  
  const handleReaction = async (type: ReactionType) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요한 서비스입니다.', {
        description: '추천 기능은 회원만 이용할 수 있습니다. 로그인하시겠습니까?',
        action: {
          label: '로그인',
          onClick: () => window.location.href = '/signin',
        },
        duration: 5000,
      });
      return;
    }

    if (isLiking || isDisliking) return;

    const previousAction = userAction;

    if (type === 'like') {
      setIsLiking(true);
    } else {
      setIsDisliking(true);
    }

    try {
      const result = await reactToPost(postId, type);

      if (!result.success) {
        toast.error(result?.error || `${type === 'like' ? '추천' : '비추천'} 처리 중 오류가 발생했습니다.`);
        return;
      }

      const nextAction = result.userAction || null;

      if (result.likes !== undefined) setLikes(result.likes);
      if (result.dislikes !== undefined) setDislikes(result.dislikes);
      setUserAction(nextAction);
      dispatchPostReactionUpdated({
        postId,
        likes: result.likes ?? 0,
        dislikes: result.dislikes ?? 0,
        userAction: nextAction,
      });
      toast.success(getReactionSuccessMessage(type, previousAction, nextAction));
    } catch {
      toast.error(`${type === 'like' ? '추천' : '비추천'} 처리 중 오류가 발생했습니다.`);
    } finally {
      if (type === 'like') {
        setIsLiking(false);
      } else {
        setIsDisliking(false);
      }
    }
  };

  const handleLike = () => handleReaction('like');
  const handleDislike = () => handleReaction('dislike');

  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <Button
        variant="ghost"
        onClick={handleLike}
        disabled={isLiking || isDisliking}
        className={`rounded-md shadow-sm border ${
          userAction === 'like'
            ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
            : 'bg-[#F5F5F5] dark:bg-[#262626] border-black/7 dark:border-white/10'
        }`}
      >
        <ThumbsUp size={16} className={userAction === 'like' ? 'text-white' : ''} />
        <span>{likes}</span>
      </Button>

      <Button
        variant="ghost"
        onClick={handleDislike}
        disabled={isLiking || isDisliking}
        className={`rounded-md shadow-sm border ${
          userAction === 'dislike'
            ? 'bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600 hover:bg-red-600 dark:hover:bg-red-700'
            : 'bg-[#F5F5F5] dark:bg-[#262626] border-black/7 dark:border-white/10'
        }`}
      >
        <ThumbsDown size={16} className={userAction === 'dislike' ? 'text-white' : ''} />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
} 
