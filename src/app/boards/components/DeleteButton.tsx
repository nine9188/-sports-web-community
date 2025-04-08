'use client';

import React from 'react';
import { Button } from '@/app/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';

interface DeleteButtonProps {
  postId: string;
  userId: string;
  boardSlug: string;
}

export default function DeleteButton({ postId, userId, boardSlug }: DeleteButtonProps) {
  const router = useRouter();
  
  const handleDelete = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      // 기존 댓글 삭제
      await supabase.from('comments').delete().eq('post_id', postId);
      
      // 좋아요/싫어요 기록 삭제
      await supabase.from('post_likes').delete().eq('post_id', postId);
      
      // 게시글 삭제
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('게시글 삭제 중 오류:', error);
        alert(`게시글 삭제 중 오류가 발생했습니다.`);
        return;
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${boardSlug}`);
      router.refresh();
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      alert(`게시글 삭제 중 오류가 발생했습니다.`);
    }
  };
  
  return (
    <Button variant="destructive" onClick={handleDelete}>
      삭제
    </Button>
  );
} 