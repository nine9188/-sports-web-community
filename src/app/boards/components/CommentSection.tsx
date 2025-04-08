"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { Button } from '@/app/ui/button';
import Comment from '@/app/boards/components/Comment';
import { rewardUserActivity, ActivityType } from '@/app/utils/activity-rewards';
import { CommentType } from '@/app/types/comment';

interface CommentSectionProps {
  postId: string;
  boardId?: string;
  initialComments: CommentType[];
  boardSlug?: string;
  postNumber?: string;
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    async function getCurrentUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setCurrentUserId(data.user.id);
      }
    }
    
    getCurrentUser();
  }, [supabase]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
        router.push('/login');
        return;
      }
      
      const userId = userData.user.id;
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: content.trim(),
          likes: 0,
          dislikes: 0
        })
        .select('*, profiles(nickname, icon_id)')
        .single();
        
      if (error) {
        console.error('댓글 작성 중 오류가 발생했습니다:', error);
        alert('댓글 작성 중 오류가 발생했습니다.');
        return;
      }
      
      // 댓글 추가를 먼저 처리
      setComments([...comments, data]);
      setContent('');
      router.refresh();
      
      // 보상 지급 시 오류가 발생해도 댓글 작성은 이미 성공한 상태
      try {
        const rewardResult = await rewardUserActivity(userId, ActivityType.COMMENT_CREATION, data.id);
        if (!rewardResult.success) {
          console.warn('댓글 작성 보상 지급 실패:', rewardResult.error);
          // 보상 지급 실패는 사용자에게 알리지 않고 내부적으로만 로깅
        }
      } catch (rewardError) {
        console.error('보상 지급 중 예외 발생:', rewardError);
        // 보상 지급 중 예외는 사용자에게 알리지 않음
      }
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdate = async (commentId: string, updatedContent: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ content: updatedContent })
        .eq('id', commentId)
        .eq('user_id', currentUserId)
        .select('*, profiles(nickname, icon_id)')
        .single();
        
      if (error) {
        console.error('댓글 수정 중 오류가 발생했습니다:', error);
        alert('댓글 수정 중 오류가 발생했습니다.');
        return;
      }
      
      // 댓글 목록 업데이트
      setComments(comments.map(comment => 
        comment.id === commentId ? data : comment
      ));
      
      router.refresh();
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      alert('댓글 수정 중 오류가 발생했습니다.');
    }
  };
  
  const handleDelete = async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId);
        
      if (error) {
        console.error('댓글 삭제 중 오류가 발생했습니다:', error);
        alert('댓글 삭제 중 오류가 발생했습니다.');
        return;
      }
      
      // 댓글 목록에서 삭제된 댓글 제거
      setComments(comments.filter(comment => comment.id !== commentId));
      router.refresh();
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b">
        <h3 className="font-medium">댓글 {comments.length}개</h3>
      </div>
      
      {/* 댓글 목록 */}
      <div className="divide-y">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Comment 
              key={comment.id} 
              comment={comment} 
              currentUserId={currentUserId} 
              onUpdate={handleUpdate} 
              onDelete={handleDelete} 
            />
          ))
        ) : (
          <div className="px-6 py-4 text-sm text-gray-500">
            아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
          </div>
        )}
      </div>
      
      {/* 댓글 작성 폼 */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <textarea 
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="댓글을 작성해주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 