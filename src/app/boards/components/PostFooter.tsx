'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { ListOrdered, PenLine, Edit, Trash } from 'lucide-react';

interface PostFooterProps {
  boardSlug: string;
  postNumber?: string;
  isAuthor?: boolean;
  isLoggedIn?: boolean;
  postId?: string;
  userId?: string;
}

export default function PostFooter({ 
  boardSlug,
  postNumber,
  isAuthor = false,
  isLoggedIn = false,
  postId,
  userId
}: PostFooterProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!postId || !userId) {
      alert('게시글 정보를 찾을 수 없습니다.');
      return;
    }

    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        alert('로그인이 필요합니다.');
        setIsDeleting(false);
        return;
      }
      
      await supabase.from('comments').delete().eq('post_id', postId);
      
      await supabase.from('post_likes').delete().eq('post_id', postId);
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);
        
      if (error) {
        console.error('게시글 삭제 중 오류:', error);
        alert(`게시글 삭제 중 오류가 발생했습니다: ${error.message}`);
        setIsDeleting(false);
        return;
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${boardSlug}`);
      router.refresh();
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      alert(`게시글 삭제 중 오류가 발생했습니다.`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm mb-4">
      <div className="flex flex-row items-center justify-between px-2 py-2">
        {/* 목록 버튼 */}
        <div className="flex-1 text-center">
          <Link 
            href={`/boards/${boardSlug}`}
            className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ListOrdered className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">목록</span>
          </Link>
        </div>

        {/* 글쓰기 버튼 (로그인 시에만 보임) */}
        <div className="hidden md:block flex-1 text-center">
          {isLoggedIn ? (
            <Link 
              href={`/boards/${boardSlug}/create`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <PenLine className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">글쓰기</span>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
        
        {/* 수정 버튼 (작성자만 보임) */}
        <div className="flex-1 text-center">
          {isAuthor && postNumber ? (
            <Link 
              href={`/boards/${boardSlug}/${postNumber}/edit`}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">수정</span>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
        
        {/* 삭제 버튼 (작성자만 보임) */}
        <div className="flex-1 text-center">
          {isAuthor && postNumber ? (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center py-2 px-3 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{isDeleting ? '삭제 중...' : '삭제'}</span>
            </button>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
} 