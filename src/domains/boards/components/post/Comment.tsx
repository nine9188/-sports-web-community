"use client";

import React, { useState, useEffect } from 'react';
import UserIcon from '@/shared/components/UserIcon';
import { likeComment, dislikeComment } from '@/domains/boards/actions/comments/index';
import { CommentType } from '@/domains/boards/types/post/comment';
import ReportButton from '@/domains/reports/components/ReportButton';
import { formatDate } from '@/shared/utils/date'; // 공통 날짜 포맷팅 유틸로 대체 추천

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

  const isCommentOwner = currentUserId === comment.user_id;
  const isHidden = comment.is_hidden === true;
  const isDeleted = comment.is_deleted === true;

  useEffect(() => {
    setLikes(comment.likes || 0);
    setDislikes(comment.dislikes || 0);
    setUserAction(comment.userAction || null);
    setEditContent(comment.content);
  }, [comment.likes, comment.dislikes, comment.userAction, comment.content]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (!editContent.trim()) return;
    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleLike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    setIsLiking(true);
    try {
      const result = await likeComment(comment.id);
      if (!result.success) {
        alert(result.error || '좋아요 처리 중 오류가 발생했습니다.');
        return;
      }
      setLikes(result.likes || 0);
      setDislikes(result.dislikes || 0);
      setUserAction(result.userAction || null);
    } catch {
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    setIsDisliking(true);
    try {
      const result = await dislikeComment(comment.id);
      if (!result.success) {
        alert(result.error || '싫어요 처리 중 오류가 발생했습니다.');
        return;
      }
      setLikes(result.likes || 0);
      setDislikes(result.dislikes || 0);
      setUserAction(result.userAction || null);
    } catch {
      alert('싫어요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsDisliking(false);
    }
  };

  // 숨김 / 삭제 댓글 처리
  if (isDeleted) return <DeletedCommentUI />;
  if (isHidden) {
    const hiddenUntil = (comment as CommentType & { hidden_until?: string }).hidden_until;
    return <HiddenCommentUI hiddenUntil={hiddenUntil} />;
  }
  
  return (
    <div className="border-b py-3 px-4 transition-colors hover:bg-gray-50">
      <div className="flex space-x-2">
        <div className="w-5 h-5 relative rounded-full overflow-hidden flex-shrink-0">
          <UserIcon 
            iconUrl={comment.profiles?.icon_url || null}
            level={comment.profiles?.level || 1}
            size={20}
            alt={comment.profiles?.nickname || '사용자'}
            className="object-cover"
            priority
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0">
              <span className={`font-medium text-sm truncate ${isPostOwner && isCommentOwner ? 'text-blue-600' : 'text-gray-900'}`}>
                {comment.profiles?.nickname || '알 수 없음'}
              </span>
              {isPostOwner && isCommentOwner && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">작성자</span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDate(comment.created_at || '')}</span>
          </div>

          {!isEditing ? (
            <div className="text-sm text-gray-800 mb-2 break-words">{comment.content}</div>
          ) : (
            <div className="mb-3">
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button onClick={handleCancel} className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">취소</button>
                <button onClick={handleSave} className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700" disabled={!editContent.trim()}>저장</button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ActionButton action="like" active={userAction === 'like'} count={likes} onClick={handleLike} disabled={isLiking || isDisliking || !currentUserId} />
              <ActionButton action="dislike" active={userAction === 'dislike'} count={dislikes} onClick={handleDislike} disabled={isLiking || isDisliking || !currentUserId} />
            </div>

            <div className="flex items-center space-x-3">
              {!isCommentOwner && currentUserId && (
                <ReportButton targetType="comment" targetId={comment.id} variant="ghost" size="sm" showText={false} className="text-xs p-1" />
              )}
              {isCommentOwner && !isEditing && (
                <>
                  <button onClick={handleEdit} className="text-xs text-gray-500 hover:text-gray-700">수정</button>
                  <button onClick={() => onDelete(comment.id)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeletedCommentUI() {
  return (
    <div className="border-b py-3 px-4 bg-red-50">
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center text-sm text-red-600 font-medium">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          신고에 의해 삭제되었습니다
        </div>
      </div>
    </div>
  );
}

function HiddenCommentUI({ hiddenUntil }: { hiddenUntil?: string }) {
  const calculateRemainingDays = () => {
    if (!hiddenUntil) return '7일';
    try {
      const hiddenDate = new Date(hiddenUntil);
      const now = new Date();
      const diffDays = Math.ceil((hiddenDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 0 ? '곧 복구 예정' : `${diffDays}일`;
    } catch {
      return '7일';
    }
  };

  return (
    <div className="border-b py-3 px-4 bg-gray-50">
      <div className="flex items-center justify-center py-4 text-center">
        <div>
          <div className="flex items-center justify-center mb-2 text-sm text-gray-600 font-medium">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
            신고에 의해 일시 숨김처리 되었습니다
          </div>
          <p className="text-xs text-gray-500">{calculateRemainingDays()} 후 다시 검토됩니다</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ action, active, count, onClick, disabled }: {
  action: 'like' | 'dislike';
  active: boolean;
  count: number;
  onClick: () => void;
  disabled: boolean;
}) {
  const color = action === 'like' ? 'blue' : 'red';
  const label = action === 'like' ? '좋아요' : '싫어요';

  return (
    <button
      className={`flex items-center text-xs space-x-1 ${
        active ? `text-${color}-600 font-medium` : 'text-gray-500 hover:text-gray-700'
      } transition-colors disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        {action === 'like' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 11v-9m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        )}
      </svg>
      <span>{count}</span>
    </button>
  );
}
