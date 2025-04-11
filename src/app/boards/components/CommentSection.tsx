"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import { Button } from '@/app/ui/button';
import Comment from '@/app/boards/components/Comment';
import { rewardUserActivity, ActivityType } from '@/app/utils/activity-rewards';
import { CommentType } from '@/app/types/comment';

interface CommentSectionProps {
  postId: string;
  initialComments: CommentType[];
  boardSlug?: string;
  postNumber?: string;
  postOwnerId?: string;
}

export default function CommentSection({ 
  postId, 
  initialComments, 
  boardSlug, 
  postNumber,
  postOwnerId
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const supabase = createClient();
  
  // 댓글 데이터를 최신으로 다시 가져오기 (useCallback으로 감싸서 안정적인 참조 유지)
  const refreshComments = useCallback(async () => {
    try {
      console.log(`댓글 새로고침 시도 - 게시글 ID: ${postId}`);
      
      // 절대 URL 구성
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/comments/${postId}`;
      
      console.log(`댓글 새로고침 API 요청: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        console.error(`댓글 새로고침 실패: ${response.status} ${response.statusText}`);
        throw new Error('댓글을 다시 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      console.log(`댓글 ${data?.length || 0}개 새로고침 성공, 게시글 ID: ${postId}`);
      if (Array.isArray(data)) {
        setComments(data);
      }
    } catch (error) {
      console.error('댓글 새로고침 오류:', error);
    }
  }, [postId]);
  
  // 초기 댓글과 사용자 정보 초기화
  useEffect(() => {
    console.log(`CommentSection 마운트 - 초기 댓글 ${initialComments?.length || 0}개 받음`);
    
    // 초기 댓글 설정
    if (Array.isArray(initialComments) && initialComments.length > 0) {
      setComments(initialComments);
    } else {
      console.log('초기 댓글이 없거나 유효하지 않음 - 새로고침 시도');
      refreshComments();
    }
    
    // 사용자 정보 가져오기
    async function getCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user) {
          setCurrentUserId(data.user.id);
          console.log(`현재 로그인 사용자 ID: ${data.user.id}`);
        } else {
          console.log('로그인되지 않은 상태');
        }
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    getCurrentUser();
  }, [initialComments, postId, refreshComments, supabase.auth]);
  
  const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
        if (boardSlug && postNumber) {
          router.push(`/login?redirect=/boards/${boardSlug}/${postNumber}`);
        } else {
          router.push('/login');
        }
        return;
      }
      
      const userId = userData.user.id;
      console.log(`댓글 작성 시도 - 사용자 ID: ${userId}, 게시글 ID: ${postId}`);
      
      // 절대 URL 구성
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/comments/${postId}`;
      
      // API를 통해 댓글 작성
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`댓글 작성 응답 오류: ${response.status}`, errorData);
        throw new Error(errorData.error || '댓글 작성에 실패했습니다');
      }
      
      const newComment = await response.json();
      console.log(`댓글 작성 성공 - 댓글 ID: ${newComment.id}`);
      
      // 댓글 목록 업데이트
      setComments(prevComments => [...prevComments, newComment]);
      setContent('');
      
      // 게시글 작성자에게 알림 전송 (본인이 아닌 경우)
      if (userId !== postOwnerId && postOwnerId) {
        try {
          console.log(`게시글 작성자(${postOwnerId})에게 댓글 알림 전송`);
        } catch (notificationError) {
          console.error('알림 전송 중 오류:', notificationError);
        }
      }
      
      // 전체 댓글 목록 갱신
      await refreshComments();
      
      // 서버 상태 갱신
      router.refresh();
      
      // 보상 지급 시도
      try {
        const rewardResult = await rewardUserActivity(userId, ActivityType.COMMENT_CREATION, newComment.id);
        if (!rewardResult.success) {
          console.warn('댓글 작성 보상 지급 실패:', rewardResult.error);
        }
      } catch (rewardError) {
        console.error('보상 지급 중 예외 발생:', rewardError);
      }
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
      alert(error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, postId, supabase.auth, boardSlug, postNumber, router, postOwnerId, refreshComments]);
  
  const handleUpdate = useCallback(async (commentId: string, updatedContent: string) => {
    try {
      console.log(`댓글 수정 시도 - 댓글 ID: ${commentId}, 내용: ${updatedContent}`);
      
      // API를 통한 수정 요청
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/comments/${postId}/${commentId}`;
      
      console.log(`댓글 수정 API 요청: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ content: updatedContent })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`댓글 수정 응답 오류:`, errorData);
        throw new Error(errorData.error || '댓글 수정에 실패했습니다');
      }
      
      // 응답에서 업데이트된 댓글 정보 추출
      const updatedComment = await response.json();
      console.log(`댓글 수정 성공:`, updatedComment);
      
      // 댓글 목록 업데이트
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      
      // 전체 댓글 목록 갱신
      await refreshComments();
      
      // 서버 상태 갱신
      router.refresh();
    } catch (error) {
      console.error('댓글 수정 중 오류:', error);
      alert(error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다.');
    }
  }, [postId, router, refreshComments]);
  
  const handleDelete = useCallback(async (commentId: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      console.log(`댓글 삭제 시도 - 댓글 ID: ${commentId}, 게시글 ID: ${postId}`);
      
      if (!currentUserId) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      // 서버 API를 통해 삭제 요청
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/comments/${postId}/${commentId}`;
      
      console.log(`댓글 삭제 API 요청: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('댓글 삭제 HTTP 오류:', response.status, errorData);
        throw new Error(errorData.error || '댓글 삭제에 실패했습니다');
      }
      
      console.log(`댓글 삭제 성공 - 댓글 ID: ${commentId}`);
      
      // 댓글 목록에서 삭제된 댓글 제거
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
      
      // 전체 댓글 목록 갱신
      await refreshComments();
      
      // 서버 상태 갱신
      router.refresh();
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error);
      alert(error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.');
    }
  }, [currentUserId, postId, router, refreshComments]);
  
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b">
        <h3 className="font-medium">댓글 {comments.length}개</h3>
      </div>
      
      {/* 댓글 목록 */}
      <div className="divide-y">
        {isLoading ? (
          <div className="px-6 py-4 text-sm text-gray-500 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            댓글을 불러오는 중...
          </div>
        ) : comments.length > 0 ? (
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
        <form className="space-y-3" onSubmit={handleCommentSubmit}>
          <textarea 
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="댓글을 작성해주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 