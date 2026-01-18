"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { likePost, dislikePost } from '@/domains/boards/actions/posts/index';

interface PostActionsProps {
  postId: string;
  boardId?: string;
  initialLikes: number;
  initialDislikes: number;
  initialUserAction: 'like' | 'dislike' | null;
}

export default function PostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0,
  initialUserAction = null,
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(initialUserAction);
  
  const router = useRouter();
  
  // 좋아요 처리 함수
  const handleLike = async () => {
    
    
    if (isLiking || isDisliking) {
      return;
    }
    
    setIsLiking(true);
    
    try {
      // 서버 액션으로 좋아요 처리
      const result = await likePost(postId);
      
      if (!result.success) {
        // 로그인 필요 시 리다이렉트
        if (result.error === '로그인이 필요합니다.') {
          alert('로그인이 필요합니다.');
          router.push('/signin');
          return;
        }
        
        alert(result.error || '좋아요 처리 중 오류가 발생했습니다.');
        return;
      }
      
      // 상태 업데이트
      if (result.likes !== undefined) setLikes(result.likes);
      if (result.dislikes !== undefined) setDislikes(result.dislikes);
      setUserAction(result.userAction || null);
      
      // 페이지 새로고침으로 서버 컴포넌트 데이터 갱신
      router.refresh();
      
    } catch (error) {
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };
  
  // 싫어요 처리 함수
  const handleDislike = async () => {
    
    
    if (isLiking || isDisliking) {
      return;
    }
    
    setIsDisliking(true);
    
    try {
      // 서버 액션으로 싫어요 처리
      const result = await dislikePost(postId);
      
      if (!result.success) {
        // 로그인 필요 시 리다이렉트
        if (result.error === '로그인이 필요합니다.') {
          alert('로그인이 필요합니다.');
          router.push('/signin');
          return;
        }
        
        alert(result.error || '싫어요 처리 중 오류가 발생했습니다.');
        return;
      }
      
      // 상태 업데이트
      if (result.likes !== undefined) setLikes(result.likes);
      if (result.dislikes !== undefined) setDislikes(result.dislikes);
      setUserAction(result.userAction || null);
      
      // 페이지 새로고침으로 서버 컴포넌트 데이터 갱신
      router.refresh();
      
    } catch (error) {
      alert('싫어요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDisliking(false);
    }
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button
        onClick={handleLike}
        disabled={isLiking || isDisliking}
        className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${
          userAction === 'like'
            ? 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
            : 'bg-gray-50 dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
        }`}
      >
        <ThumbsUp size={16} className={userAction === 'like' ? 'text-white' : ''} />
        <span>{likes}</span>
      </button>
      
      <button
        onClick={handleDislike}
        disabled={isLiking || isDisliking}
        className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${
          userAction === 'dislike'
            ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
            : 'bg-gray-50 dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
        }`}
      >
        <ThumbsDown size={16} className={userAction === 'dislike' ? 'text-white' : ''} />
        <span>{dislikes}</span>
      </button>
    </div>
  );
} 