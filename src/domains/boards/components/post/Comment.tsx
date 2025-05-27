"use client";

import React, { useState, useEffect } from 'react';
import UserIcon from '@/shared/components/UserIcon';
import { getOptimizedUserIcon } from '@/shared/utils';
import { likeComment, dislikeComment } from '@/domains/boards/actions/comments';
import { CommentType } from '@/domains/boards/types/post/comment';
import { formatCommentDate } from '@/shared/utils/commentDateFormat';

interface CommentProps {
  comment: CommentType & {
    userAction?: 'like' | 'dislike' | null;
  };
  currentUserId: string | null;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isPostOwner?: boolean;
}

export default function Comment({ comment, currentUserId, onUpdate, onDelete, isPostOwner = false }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes || 0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(comment.userAction || null);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null);
  
  // 현재 사용자가 댓글 작성자인지 확인
  const isCommentOwner = currentUserId === comment.user_id;
  
  // comment props가 변경될 때 상태 업데이트 (페이지 이동 후 돌아왔을 때 등)
  useEffect(() => {
    setLikes(comment.likes || 0);
    setDislikes(comment.dislikes || 0);
    setUserAction(comment.userAction || null);
    setEditContent(comment.content);
  }, [comment.likes, comment.dislikes, comment.userAction, comment.content]);
  
  // 사용자 아이콘 가져오기 - 최적화된 버전 사용
  useEffect(() => {
    const fetchUserIcon = async () => {
      if (!comment.user_id) return;
      
      try {
        // 최적화된 아이콘 로딩 함수 사용
        const iconInfo = await getOptimizedUserIcon(comment.user_id);
        
        if (iconInfo) {
          setUserIconUrl(iconInfo.url);
        }
      } catch (error) {
        console.error('아이콘 로딩 오류:', error);
      }
    };
    
    fetchUserIcon();
  }, [comment.user_id]);
  
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
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    }
  };
  
  const handleLike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    
    setIsLiking(true);
    
    try {
      // 서버 액션으로 좋아요 처리
      const result = await likeComment(comment.id);
      
      if (!result.success) {
        // 로그인 필요 시 처리
        if (result.error === '로그인이 필요합니다.') {
          alert('로그인이 필요합니다.');
          return;
        }
        
        // 오류 메시지 표시 개선
        const errorMessage = result.error || '좋아요 처리 중 오류가 발생했습니다.';
        console.error('좋아요 오류:', errorMessage);
        alert(`좋아요 처리 중 오류: ${errorMessage}`);
        return;
      }
      
      // 상태 업데이트
      setLikes(result.likes || 0);
      setDislikes(result.dislikes || 0);
      setUserAction(result.userAction || null);
      
    } catch (error) {
      console.error('좋아요 처리 중 예외 발생:', error);
      
      // 오류 객체 상세 정보 로깅
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
      
      alert(error instanceof Error ? `좋아요 처리 중 오류: ${error.message}` : '좋아요 처리 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDislike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    
    setIsDisliking(true);
    
    try {
      // 서버 액션으로 싫어요 처리
      const result = await dislikeComment(comment.id);
      
      if (!result.success) {
        // 로그인 필요 시 처리
        if (result.error === '로그인이 필요합니다.') {
          alert('로그인이 필요합니다.');
          return;
        }
        
        // 오류 메시지 표시 개선
        const errorMessage = result.error || '싫어요 처리 중 오류가 발생했습니다.';
        console.error('싫어요 오류:', errorMessage);
        alert(`싫어요 처리 중 오류: ${errorMessage}`);
        return;
      }
      
      // 상태 업데이트
      setLikes(result.likes || 0);
      setDislikes(result.dislikes || 0);
      setUserAction(result.userAction || null);
      
    } catch (error) {
      console.error('싫어요 처리 중 예외 발생:', error);
      
      // 오류 객체 상세 정보 로깅
      if (error instanceof Error) {
        console.error('오류 메시지:', error.message);
        console.error('오류 스택:', error.stack);
      }
      
      alert(error instanceof Error ? `싫어요 처리 중 오류: ${error.message}` : '싫어요 처리 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsDisliking(false);
    }
  };
  
  return (
    <div className="border-b py-3 px-4 transition-colors hover:bg-gray-50">
      <div className="flex space-x-3">
        {/* 사용자 아이콘 */}
        <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0">
          <UserIcon 
            iconUrl={userIconUrl}
            size={32}
            alt={comment.profiles?.nickname || '사용자'}
            className="object-cover"
            priority={true}
          />
        </div>
        
        {/* 댓글 내용 영역 */}
        <div className="flex-1 min-w-0">
          {/* 사용자 정보 및 시간 */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0">
              <span className={`font-medium text-sm truncate ${
                isPostOwner && isCommentOwner 
                  ? 'text-blue-600' 
                  : 'text-gray-900'
              }`}>
                {comment.profiles?.nickname || '알 수 없음'}
              </span>
              {isPostOwner && isCommentOwner && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex-shrink-0">
                  작성자
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatCommentDate(comment.created_at || '')}
            </span>
          </div>
          
          {/* 댓글 내용 (수정 모드가 아닐 때) */}
          {!isEditing ? (
            <div className="text-sm text-gray-800 mb-2 break-words">
              {comment.content}
            </div>
          ) : (
            <div className="mb-3">
              <textarea 
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                placeholder="댓글을 수정해주세요"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button 
                  onClick={handleCancel}
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={!editContent.trim()}
                >
                  저장
                </button>
              </div>
            </div>
          )}
          
          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between">
            {/* 좋아요/싫어요 버튼 */}
            <div className="flex items-center space-x-4">
              <button 
                className={`flex items-center text-xs space-x-1 ${
                  userAction === 'like' 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                } transition-colors disabled:opacity-50`}
                onClick={handleLike}
                disabled={isLiking || isDisliking || !currentUserId}
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
                } transition-colors disabled:opacity-50`}
                onClick={handleDislike}
                disabled={isLiking || isDisliking || !currentUserId}
                aria-label="싫어요"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={userAction === 'dislike' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11v-9m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                <span>{dislikes}</span>
              </button>
            </div>
            
            {/* 수정/삭제 버튼 (본인 댓글일 때만 표시) */}
            {isCommentOwner && !isEditing && (
              <div className="flex space-x-3">
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
    </div>
  );
} 