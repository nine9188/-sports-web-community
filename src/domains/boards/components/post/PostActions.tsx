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
    console.log('[PostActions] handleLike 시작, postId:', postId);
    console.log('[PostActions] 현재 상태:', { likes, dislikes, userAction, isLiking, isDisliking });
    
    if (isLiking || isDisliking) {
      console.log('[PostActions] 이미 처리 중, 무시');
      return;
    }
    
    setIsLiking(true);
    console.log('[PostActions] isLiking 상태 설정');
    
    try {
      console.log('[PostActions] likePost 서버 액션 호출 시작');
      // 서버 액션으로 좋아요 처리
      const result = await likePost(postId);
      console.log('[PostActions] likePost 서버 액션 응답:', result);
      
      if (!result.success) {
        console.log('[PostActions] 좋아요 실패:', result.error);
        // 로그인 필요 시 리다이렉트
        if (result.error === '로그인이 필요합니다.') {
          alert('로그인이 필요합니다.');
          router.push('/signin');
          return;
        }
        
        alert(result.error || '좋아요 처리 중 오류가 발생했습니다.');
        return;
      }
      
      console.log('[PostActions] 좋아요 성공, 상태 업데이트 중');
      console.log('[PostActions] 업데이트할 데이터:', { 
        likes: result.likes, 
        dislikes: result.dislikes, 
        userAction: result.userAction 
      });
      
      // 상태 업데이트
      if (result.likes !== undefined) setLikes(result.likes);
      if (result.dislikes !== undefined) setDislikes(result.dislikes);
      setUserAction(result.userAction || null);
      console.log('[PostActions] 상태 업데이트 완료');
      
      // 페이지 새로고침으로 서버 컴포넌트 데이터 갱신
      router.refresh();
      
    } catch (error) {
      console.error('[PostActions] 좋아요 처리 중 예외:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
      console.log('[PostActions] handleLike 완료, 최종 상태:', { likes, dislikes, userAction });
    }
  };
  
  // 싫어요 처리 함수
  const handleDislike = async () => {
    console.log('[PostActions] handleDislike 시작, postId:', postId);
    console.log('[PostActions] 현재 상태:', { likes, dislikes, userAction, isLiking, isDisliking });
    
    if (isLiking || isDisliking) {
      console.log('[PostActions] 이미 처리 중, 무시');
      return;
    }
    
    setIsDisliking(true);
    console.log('[PostActions] isDisliking 상태 설정');
    
    try {
      console.log('[PostActions] dislikePost 서버 액션 호출 시작');
      // 서버 액션으로 싫어요 처리
      const result = await dislikePost(postId);
      console.log('[PostActions] dislikePost 서버 액션 응답:', result);
      
      if (!result.success) {
        console.log('[PostActions] 싫어요 실패:', result.error);
        // 로그인 필요 시 리다이렉트
        if (result.error === '로그인이 필요합니다.') {
          alert('로그인이 필요합니다.');
          router.push('/signin');
          return;
        }
        
        alert(result.error || '싫어요 처리 중 오류가 발생했습니다.');
        return;
      }
      
      console.log('[PostActions] 싫어요 성공, 상태 업데이트 중');
      console.log('[PostActions] 업데이트할 데이터:', { 
        likes: result.likes, 
        dislikes: result.dislikes, 
        userAction: result.userAction 
      });
      
      // 상태 업데이트
      if (result.likes !== undefined) setLikes(result.likes);
      if (result.dislikes !== undefined) setDislikes(result.dislikes);
      setUserAction(result.userAction || null);
      console.log('[PostActions] 상태 업데이트 완료');
      
      // 페이지 새로고침으로 서버 컴포넌트 데이터 갱신
      router.refresh();
      
    } catch (error) {
      console.error('[PostActions] 싫어요 처리 중 오류:', error);
      alert('싫어요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDisliking(false);
      console.log('[PostActions] handleDislike 완료, 최종 상태:', { likes, dislikes, userAction });
    }
  };

  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button
        onClick={handleLike}
        disabled={isLiking || isDisliking}
        className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm ${
          userAction === 'like'
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200'
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
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
        }`}
      >
        <ThumbsDown size={16} className={userAction === 'dislike' ? 'text-white' : ''} />
        <span>{dislikes}</span>
      </button>
    </div>
  );
} 