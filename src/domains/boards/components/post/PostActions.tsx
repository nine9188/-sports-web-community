"use client";

import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui';
import { reactToPost } from '@/domains/boards/utils/post/postReactionClient';
import { togglePostScrap } from '@/domains/boards/actions/posts/scrap';
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
  initialIsScrapped?: boolean;
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
  initialIsScrapped = false,
  isLoggedIn = false,
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(initialUserAction);
  const [isScrapped, setIsScrapped] = useState(initialIsScrapped);
  const [isScraping, setIsScraping] = useState(false);

  // 서버 데이터가 변경되면(router.refresh 등) 로컬 상태 동기화
  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
    setUserAction(initialUserAction);
    setIsScrapped(initialIsScrapped);
  }, [initialLikes, initialDislikes, initialUserAction, initialIsScrapped]);

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

  const handleScrapClick = async () => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요한 서비스입니다.', {
        description: '스크랩 기능은 회원만 이용할 수 있습니다. 로그인하시겠습니까?',
        action: {
          label: '로그인',
          onClick: () => window.location.href = '/signin',
        },
        duration: 5000,
      });
      return;
    }

    if (isScraping) return;

    try {
      setIsScraping(true);
      const res = await togglePostScrap(postId);
      if (res.success) {
        setIsScrapped(!!res.scrapped);
        if (res.scrapped) {
          toast.success('게시글을 스크랩했습니다.', {
            action: {
              label: '스크랩 보기',
              onClick: () => window.location.href = '/settings/my-scraps',
            },
            duration: 4000,
          });
        } else {
          toast.success('스크랩을 취소했습니다.');
        }
      } else {
        toast.error(res.error || '스크랩 처리 중 오류가 발생했습니다.');
      }
    } catch {
      toast.error('스크랩 처리 중 오류가 발생했습니다.');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="flex justify-center items-center gap-3 mt-4 mb-2">
      <Button
        variant="ghost"
        onClick={handleLike}
        disabled={isLiking || isDisliking}
        className={`rounded-md shadow-sm border ${
          userAction === 'like'
            ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700'
            : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50'
        }`}
      >
        <ThumbsUp size={16} className={userAction === 'like' ? 'text-white' : 'text-blue-500 dark:text-blue-400'} />
        <span>{likes}</span>
      </Button>

      <Button
        variant="ghost"
        onClick={handleScrapClick}
        disabled={isScraping}
        className={`rounded-md shadow-sm border transition-colors ${
          isScrapped
            ? 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-500 dark:border-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700'
            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/50'
        }`}
      >
        <Bookmark size={16} className={isScrapped ? 'fill-current text-white' : 'text-amber-600 dark:text-amber-400'} />
        <span>{isScrapped ? '스크랩 완료' : '스크랩'}</span>
      </Button>

      <Button
        variant="ghost"
        onClick={handleDislike}
        disabled={isLiking || isDisliking}
        className={`rounded-md shadow-sm border ${
          userAction === 'dislike'
            ? 'bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600 hover:bg-red-600 dark:hover:bg-red-700'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
        }`}
      >
        <ThumbsDown size={16} className={userAction === 'dislike' ? 'text-white' : 'text-red-500 dark:text-red-400'} />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
}
