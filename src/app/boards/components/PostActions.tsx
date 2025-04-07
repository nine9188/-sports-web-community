"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { Button } from '@/app/ui/button';

interface PostActionsProps {
  postId: string;
  boardId?: string;
  initialLikes: number;
  initialDislikes: number;
  isAuthor: boolean;
  boardSlug: string;
  postNumber: string;
}

export default function PostActions({ 
  postId, 
  initialLikes = 0, 
  initialDislikes = 0,
  isAuthor = false,
  boardSlug,
  postNumber
}: PostActionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  // 사용자의 이전 액션(좋아요/싫어요) 확인
  useEffect(() => {
    async function checkUserAction() {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          return;
        }
        
        const userId = data.session.user.id;
        
        // 좋아요 확인
        const { data: existingLike, error: likeError } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        if (likeError) {
          console.error('좋아요 확인 중 오류:', likeError);
          return;
        }
        
        if (existingLike && existingLike.length > 0) {
          setUserAction('like');
          return;
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
          return;
        }
        
        if (existingDislike && existingDislike.length > 0) {
          setUserAction('dislike');
          return;
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
    if (isLiking || isDisliking) return;
    
    setIsLiking(true);
    
    try {
      // 세션 확인
      const { data } = await supabase.auth.getSession();
      
      if (!data?.session?.user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      const userId = data.session.user.id;
      
      // 게시글 최신 정보 조회
      const { data: currentPost, error: fetchError } = await supabase
        .from('posts')
        .select('likes, dislikes')
        .eq('id', postId)
        .single();
        
      if (fetchError) {
        console.error('게시글 정보 조회 오류:', fetchError);
        return;
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
        return;
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
          return;
        }
        
        // 게시글 좋아요 수 감소
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: Math.max(0, currentPost.likes - 1) })
          .eq('id', postId);
        
        if (updateError) {
          console.error('좋아요 수 감소 중 오류:', updateError);
          return;
        }
        
        setLikes(prev => Math.max(0, prev - 1));
        setUserAction(null);
      } else {
        // 기존 싫어요가 있으면 제거
        const { data: dislikeRecord, error: dislikeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'dislike');
        
        if (dislikeCheckError) {
          console.error('싫어요 기록 확인 중 오류:', dislikeCheckError);
        } else if (dislikeRecord && dislikeRecord.length > 0) {
          // 싫어요 제거
          const { error: deleteDislikeError } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('type', 'dislike');
          
          if (deleteDislikeError) {
            console.error('싫어요 취소 중 오류:', deleteDislikeError);
          } else {
            // 게시글 싫어요 수 감소
            const { error: updateDislikeError } = await supabase
              .from('posts')
              .update({ dislikes: Math.max(0, currentPost.dislikes - 1) })
              .eq('id', postId);
            
            if (updateDislikeError) {
              console.error('싫어요 수 감소 중 오류:', updateDislikeError);
            } else {
              setDislikes(prev => Math.max(0, prev - 1));
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
          return;
        }
        
        // 게시글 좋아요 수 증가
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: currentPost.likes + 1 })
          .eq('id', postId);
        
        if (updateError) {
          console.error('좋아요 수 증가 중 오류:', updateError);
          return;
        }
        
        setLikes(prev => prev + 1);
        setUserAction('like');
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  // 싫어요 처리 함수
  const handleDislike = async () => {
    if (isLiking || isDisliking) return;
    
    setIsDisliking(true);
    
    try {
      // 세션 확인
      const { data } = await supabase.auth.getSession();
      
      if (!data?.session?.user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      const userId = data.session.user.id;
      
      // 게시글 최신 정보 조회
      const { data: currentPost, error: fetchError } = await supabase
        .from('posts')
        .select('likes, dislikes')
        .eq('id', postId)
        .single();
        
      if (fetchError) {
        console.error('게시글 정보 조회 오류:', fetchError);
        return;
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
        return;
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
          return;
        }
        
        // 게시글 싫어요 수 감소
        const { error: updateError } = await supabase
          .from('posts')
          .update({ dislikes: Math.max(0, currentPost.dislikes - 1) })
          .eq('id', postId);
        
        if (updateError) {
          console.error('싫어요 수 감소 중 오류:', updateError);
          return;
        }
        
        setDislikes(prev => Math.max(0, prev - 1));
        setUserAction(null);
      } else {
        // 기존 좋아요가 있으면 제거
        const { data: likeRecord, error: likeCheckError } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('type', 'like');
        
        if (likeCheckError) {
          console.error('좋아요 기록 확인 중 오류:', likeCheckError);
        } else if (likeRecord && likeRecord.length > 0) {
          // 좋아요 제거
          const { error: deleteLikeError } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('type', 'like');
          
          if (deleteLikeError) {
            console.error('좋아요 취소 중 오류:', deleteLikeError);
          } else {
            // 게시글 좋아요 수 감소
            const { error: updateLikeError } = await supabase
              .from('posts')
              .update({ likes: Math.max(0, currentPost.likes - 1) })
              .eq('id', postId);
            
            if (updateLikeError) {
              console.error('좋아요 수 감소 중 오류:', updateLikeError);
            } else {
              setLikes(prev => Math.max(0, prev - 1));
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
          return;
        }
        
        // 게시글 싫어요 수 증가
        const { error: updateError } = await supabase
          .from('posts')
          .update({ dislikes: currentPost.dislikes + 1 })
          .eq('id', postId);
        
        if (updateError) {
          console.error('싫어요 수 증가 중 오류:', updateError);
          return;
        }
        
        setDislikes(prev => prev + 1);
        setUserAction('dislike');
      }
    } catch (error) {
      console.error('싫어요 처리 중 오류:', error);
    } finally {
      setIsDisliking(false);
    }
  };
  
  // 게시글 삭제 함수
  const handleDelete = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      // 기존 댓글 삭제
      const { error: commentError } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', postId);
      
      if (commentError) {
        console.error('댓글 삭제 중 오류:', commentError);
      }
      
      // 좋아요/싫어요 기록 삭제
      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);
      
      if (likesError) {
        console.error('좋아요/싫어요 기록 삭제 중 오류:', likesError);
      }
      
      // 게시글 삭제
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userData.user.id);
        
      if (error) {
        console.error('게시글 삭제 중 오류:', error);
        alert(`게시글 삭제 중 오류가 발생했습니다: ${error.message}`);
        return;
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${boardSlug}`);
      router.refresh();
    } catch (error: unknown) {
      console.error('게시글 삭제 중 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`게시글 삭제 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      {/* 추천/비추천 버튼 */}
      <div className="flex justify-center space-x-4">
        <button 
          className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-colors ${
            userAction === 'like' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={handleLike}
          disabled={isLiking || isDisliking}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>추천 {likes}</span>
        </button>
        <button 
          className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-colors ${
            userAction === 'dislike' 
              ? 'bg-red-100 text-red-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={handleDislike}
          disabled={isLiking || isDisliking}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11v-9m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          <span>비추천 {dislikes}</span>
        </button>
      </div>
      
      {/* 게시글 버튼 */}
      <div className="flex justify-between">
        <div>
          <Link href={`/boards/${boardSlug}`}>
            <Button variant="outline">목록</Button>
          </Link>
        </div>
        {isAuthor && (
          <div className="space-x-2">
            <Link href={`/boards/${boardSlug}/${postNumber}/edit`}>
              <Button variant="outline">수정</Button>
            </Link>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 