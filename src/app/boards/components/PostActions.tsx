"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface PostActionsProps {
  postId: string;
  boardId?: string;
  initialLikes: number;
  initialDislikes: number;
}

export default function PostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0,
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  // 사용자의 이전 액션(좋아요/싫어요) 확인
  useEffect(() => {
    async function checkUserAction() {
      try {
        // 인증된 사용자 정보 확인 (getUser 사용 - 보안 강화)
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          return null;
        }
        
        const userId = user.id;
        
        // 좋아요 확인
        const { data: existingLike, error: likeError } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        if (likeError) {
          console.error('좋아요 확인 중 오류:', likeError);
          return null;
        }
        
        if (existingLike && existingLike.length > 0) {
          setUserAction('like');
          return null;
        }
        
        // 싫어요 확인
        const { data: existingDislike, error: dislikeError } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        if (dislikeError) {
          console.error('싫어요 확인 중 오류:', dislikeError);
          return null;
        }
        
        if (existingDislike && existingDislike.length > 0) {
          setUserAction('dislike');
          return null;
        }
        
        setUserAction(null);
      } catch (error) {
        console.error('좋아요/싫어요 상태 확인 중 오류:', error);
      }
    }
    
    checkUserAction();
  }, [postId, supabase]);
  
  // 좋아요 처리 함수
  const handleLike = async () => {
    if (isLiking || isDisliking) return null;
    
    setIsLiking(true);
    
    try {
      // 인증된 사용자 정보 확인 (getUser 사용 - 보안 강화)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return null;
      }
      
      const userId = user.id;
      
      // 게시글 최신 정보 조회
      const { data: currentPost, error: fetchError } = await supabase
        .from('posts')
        .select('likes, dislikes')
        .eq('id', postId)
        .single();
        
      if (fetchError) {
        console.error('게시글 정보 조회 오류:', fetchError);
        return null;
      }
      
      // 이미 좋아요를 눌렀는지 확인
      const { data: likeRecord, error: likeError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (likeError) {
        console.error('좋아요 기록 확인 중 오류:', likeError);
        return null;
      }
      
      const alreadyLiked = likeRecord && likeRecord.length > 0;
      
      if (alreadyLiked) {
        // 좋아요 취소
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        if (deleteError) {
          console.error('좋아요 취소 중 오류:', deleteError);
          return null;
        }
        
        // 게시글 좋아요 수 감소
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: Math.max(0, currentPost.likes - 1) })
          .eq('id', postId);
        
        if (updateError) {
          console.error('좋아요 수 감소 중 오류:', updateError);
          return null;
        }
        
        setLikes(Math.max(0, currentPost.likes - 1));
        setUserAction(null);
      } else {
        // 기존 싫어요가 있으면 제거
        const { data: dislikeRecord, error: dislikeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        let newDislikeCount = currentPost.dislikes;
        
        if (!dislikeCheckError && dislikeRecord && dislikeRecord.length > 0) {
          // 싫어요 제거
          const { error: deleteDislikeError } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('type', 'dislike');
          
          if (!deleteDislikeError) {
            // 게시글 싫어요 수 감소
            newDislikeCount = Math.max(0, currentPost.dislikes - 1);
            const { error: updateDislikeError } = await supabase
              .from('posts')
              .update({ dislikes: newDislikeCount })
              .eq('id', postId);
            
            if (!updateDislikeError) {
              setDislikes(newDislikeCount);
            }
          }
        }
        
        // 새로운 좋아요 추가
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: userId,
            type: 'like'
          }]);
        
        if (insertError) {
          console.error('좋아요 추가 중 오류:', insertError);
          return null;
        }
        
        // 게시글 좋아요 수 증가
        const { error: updateError } = await supabase
          .from('posts')
          .update({ 
            likes: currentPost.likes + 1,
            dislikes: newDislikeCount // 싫어요가 제거되었다면 그 값도 업데이트
          })
          .eq('id', postId);
        
        if (updateError) {
          console.error('좋아요 수 증가 중 오류:', updateError);
          return null;
        }
        
        setLikes(currentPost.likes + 1);
        setUserAction('like');
      }
      
      // 클라이언트 측에서 UI 업데이트 후, 백그라운드에서 캐시 무효화
      router.refresh();
      
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  // 싫어요 처리 함수
  const handleDislike = async () => {
    if (isLiking || isDisliking) return null;
    
    setIsDisliking(true);
    
    try {
      // 인증된 사용자 정보 확인 (getUser 사용 - 보안 강화)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return null;
      }
      
      const userId = user.id;
      
      // 게시글 최신 정보 조회
      const { data: currentPost, error: fetchError } = await supabase
        .from('posts')
        .select('likes, dislikes')
        .eq('id', postId)
        .single();
        
      if (fetchError) {
        console.error('게시글 정보 조회 오류:', fetchError);
        return null;
      }
      
      // 이미 싫어요를 눌렀는지 확인
      const { data: dislikeRecord, error: dislikeError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', 'dislike');
      
      if (dislikeError) {
        console.error('싫어요 기록 확인 중 오류:', dislikeError);
        return null;
      }
      
      const alreadyDisliked = dislikeRecord && dislikeRecord.length > 0;
      
      if (alreadyDisliked) {
        // 싫어요 취소
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        if (deleteError) {
          console.error('싫어요 취소 중 오류:', deleteError);
          return null;
        }
        
        // 게시글 싫어요 수 감소
        const { error: updateError } = await supabase
          .from('posts')
          .update({ dislikes: Math.max(0, currentPost.dislikes - 1) })
          .eq('id', postId);
        
        if (updateError) {
          console.error('싫어요 수 감소 중 오류:', updateError);
          return null;
        }
        
        setDislikes(Math.max(0, currentPost.dislikes - 1));
        setUserAction(null);
      } else {
        // 기존 좋아요가 있으면 제거
        const { data: likeRecord, error: likeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        let newLikeCount = currentPost.likes;
        
        if (!likeCheckError && likeRecord && likeRecord.length > 0) {
          // 좋아요 제거
          const { error: deleteLikeError } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('type', 'like');
          
          if (!deleteLikeError) {
            // 게시글 좋아요 수 감소
            newLikeCount = Math.max(0, currentPost.likes - 1);
            const { error: updateLikeError } = await supabase
              .from('posts')
              .update({ likes: newLikeCount })
              .eq('id', postId);
            
            if (!updateLikeError) {
              setLikes(newLikeCount);
            }
          }
        }
        
        // 새로운 싫어요 추가
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: userId,
            type: 'dislike'
          }]);
        
        if (insertError) {
          console.error('싫어요 추가 중 오류:', insertError);
          return null;
        }
        
        // 게시글 싫어요 수 증가
        const { error: updateError } = await supabase
          .from('posts')
          .update({ 
            dislikes: currentPost.dislikes + 1,
            likes: newLikeCount // 좋아요가 제거되었다면 그 값도 업데이트
          })
          .eq('id', postId);
        
        if (updateError) {
          console.error('싫어요 수 증가 중 오류:', updateError);
          return null;
        }
        
        setDislikes(currentPost.dislikes + 1);
        setUserAction('dislike');
      }
    } catch (error) {
      console.error('싫어요 처리 중 오류:', error);
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