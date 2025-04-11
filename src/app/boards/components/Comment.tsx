"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserIconInfo } from '@/app/utils/level-icons';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    post_id: string;
    likes?: number;
    dislikes?: number;
    userAction?: 'like' | 'dislike' | null;
    profiles: {
      nickname: string | null;
      id?: string;
      icon_id?: number | null;
      icon_url?: string | null;
    } | null;
  };
  currentUserId: string | null;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Comment({ comment, currentUserId, onUpdate, onDelete }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes || 0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(comment.userAction || null);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null);
  const [iconName, setIconName] = useState<string | null>(null);
  
  const router = useRouter();
  
  // 사용자 아이콘 가져오기
  useEffect(() => {
    const fetchUserIcon = async () => {
      if (!comment.user_id) return;
      
      try {
        const iconInfo = await getUserIconInfo(comment.user_id);
        
        if (iconInfo) {
          setUserIconUrl(iconInfo.currentIconUrl);
          setIconName(iconInfo.currentIconName);
        }
      } catch (error) {
        console.error('아이콘 로딩 오류:', error);
      }
    };
    
    fetchUserIcon();
  }, [comment.user_id, comment.profiles?.icon_id]);
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleSave = async () => {
    if (!editContent.trim()) return;
    
    try {
      console.log(`댓글 수정 시도 - 댓글 ID: ${comment.id}`);
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
      console.log('댓글 수정 완료');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };
  
  const handleLike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    
    setIsLiking(true);
    console.log(`좋아요 시도 - 댓글 ID: ${comment.id}, 사용자 ID: ${currentUserId}`);
    
    try {
      // API를 통한 좋아요 처리
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/comments/${comment.post_id || 'unknown'}/${comment.id}/likes`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actionType: 'like' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('좋아요 처리 응답 오류:', errorData);
        throw new Error(errorData.error || '좋아요 처리에 실패했습니다');
      }
      
      // 응답에서 새로운 상태 정보 추출
      const result = await response.json();
      console.log('좋아요 처리 결과:', result);
      
      // 로컬 상태 업데이트
      setLikes(result.likes);
      setDislikes(result.dislikes);
      setUserAction(result.userAction);
      
      // 브라우저 새로고침
      router.refresh();
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
      alert(error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDislike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    
    setIsDisliking(true);
    console.log(`싫어요 시도 - 댓글 ID: ${comment.id}, 사용자 ID: ${currentUserId}`);
    
    try {
      // API를 통한 싫어요 처리
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/comments/${comment.post_id || 'unknown'}/${comment.id}/likes`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actionType: 'dislike' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('싫어요 처리 응답 오류:', errorData);
        throw new Error(errorData.error || '싫어요 처리에 실패했습니다');
      }
      
      // 응답에서 새로운 상태 정보 추출
      const result = await response.json();
      console.log('싫어요 처리 결과:', result);
      
      // 로컬 상태 업데이트
      setLikes(result.likes);
      setDislikes(result.dislikes);
      setUserAction(result.userAction);
      
      // 브라우저 새로고침
      router.refresh();
    } catch (error) {
      console.error('싫어요 처리 중 오류:', error);
      alert(error instanceof Error ? error.message : '싫어요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDisliking(false);
    }
  };
  
  // 이미지 로드 에러 핸들러
  const handleImageError = () => {
    setUserIconUrl(null);
  };
  
  return (
    <div className="border-b py-4 px-4 transition-colors hover:bg-gray-50">
      <div className="flex">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              {userIconUrl ? (
                <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0" title={iconName || undefined}>
                  <Image 
                    src={userIconUrl}
                    alt={comment.profiles?.nickname || '사용자'}
                    fill
                    className="object-cover"
                    sizes="20px"
                    unoptimized={true}
                    priority={true}
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="w-5 h-5 mr-1.5 bg-transparent rounded-full flex-shrink-0"></div>
              )}
              <span className="font-medium text-sm mr-2">{comment.profiles?.nickname || '알 수 없음'}</span>
              <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString('ko-KR')}</span>
            </div>
            
            {/* 좋아요/싫어요 버튼 */}
            <div className="flex items-center space-x-3">
              <button 
                className={`flex items-center text-xs space-x-1 ${
                  userAction === 'like' 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                } transition-colors`}
                onClick={handleLike}
                disabled={isLiking || isDisliking}
                aria-label="좋아요"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={userAction === 'like' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{likes}</span>
              </button>
              <button 
                className={`flex items-center text-xs space-x-1 ${
                  userAction === 'dislike' 
                    ? 'text-red-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                } transition-colors`}
                onClick={handleDislike}
                disabled={isLiking || isDisliking}
                aria-label="싫어요"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={userAction === 'dislike' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11v-9m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                <span>{dislikes}</span>
              </button>
            </div>
          </div>
          
          {/* 댓글 내용 (수정 모드가 아닐 때) */}
          {!isEditing ? (
            <div className="text-sm mb-2">{comment.content}</div>
          ) : (
            <div className="mt-2 mb-3">
              <textarea 
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              ></textarea>
              <div className="flex justify-end space-x-2 mt-2">
                <button 
                  onClick={handleCancel}
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  disabled={!editContent.trim()}
                >
                  저장
                </button>
              </div>
            </div>
          )}
          
          {/* 수정/삭제 버튼 (본인 댓글일 때만 표시) */}
          {currentUserId === comment.user_id && !isEditing && (
            <div className="flex justify-end space-x-2 mt-1">
              <button 
                onClick={handleEdit}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                수정
              </button>
              <button 
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 