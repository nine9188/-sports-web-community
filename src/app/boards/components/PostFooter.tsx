'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { PenLine } from 'lucide-react';

interface PostFooterProps {
  _boardId: string;
  postId: string;
  isAuthor: boolean;
  boardSlug: string;
  postNumber: string;
}

export default function PostFooter({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _boardId, 
  postId, 
  isAuthor, 
  boardSlug, 
  postNumber 
}: PostFooterProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      // 기존 댓글 삭제
      await supabase
        .from('comments')
        .delete()
        .eq('post_id', postId);
      
      // 좋아요/싫어요 기록 삭제
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);
      
      // 게시글 삭제
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userData.user.id);
        
      if (error) {
        console.error('게시글 삭제 중 오류:', error);
        alert(`게시글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        return;
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${boardSlug}`);
      router.refresh();
    } catch (error: unknown) {
      console.error('게시글 삭제 중 오류:', error);
      alert(`게시글 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-between py-4">
      <div className="flex space-x-2">
        <Link href={`/boards/${boardSlug}`}>
          <Button variant="outline">목록</Button>
        </Link>
        
        <Link href={`/boards/${boardSlug}/create`}>
          <Button variant="outline" className="flex items-center gap-1">
            <PenLine className="h-4 w-4" />
            <span>글쓰기</span>
          </Button>
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
  );
} 