"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import UserIcon from '@/shared/components/UserIcon';
import { likeComment, dislikeComment } from '@/domains/boards/actions/comments/index';
import { CommentType } from '@/domains/boards/types/post/comment';
import ReportButton from '@/domains/reports/components/ReportButton';
import { formatDate } from '@/shared/utils/date';

interface CommentProps {
  comment: CommentType & {
    userAction?: 'like' | 'dislike' | null;
  };
  currentUserId: string | null;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply?: (parentId: string) => void;
  isPostOwner?: boolean;
  isReply?: boolean;
}

export default function Comment({
  comment,
  currentUserId,
  onUpdate,
  onDelete,
  onReply,
  isPostOwner = false,
  isReply = false
}: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes || 0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(comment.userAction || null);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const isCommentOwner = currentUserId === comment.user_id;
  const isHidden = comment.is_hidden === true;
  const isDeleted = comment.is_deleted === true;

  // 외부 클릭 시 작성자 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target as Node)) {
        setIsAuthorDropdownOpen(false);
      }
    };

    if (isAuthorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAuthorDropdownOpen]);

  const handleAuthorToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (comment.profiles?.public_id) {
      setIsAuthorDropdownOpen(prev => !prev);
    }
  }, [comment.profiles?.public_id]);

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
  if (isDeleted) return <DeletedCommentUI isReply={isReply} />;
  if (isHidden) {
    const hiddenUntil = (comment as CommentType & { hidden_until?: string }).hidden_until;
    return <HiddenCommentUI hiddenUntil={hiddenUntil} isReply={isReply} />;
  }
  
  return (
    <>
      <div 
        id={`comment-${comment.id}`}
        className={`border-b border-gray-100 dark:border-white/10 py-3 px-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#252525] ${isReply ? 'pl-12 bg-gray-50/50 dark:bg-[#1A1A1A]' : ''}`}
      >
        <div className="flex space-x-2">
          {/* 대댓글 표시 아이콘 */}
          {isReply && (
            <div className="flex-shrink-0 pt-0.5">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
          )}
          
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
                {comment.profiles?.public_id ? (
                  <div className="relative" ref={authorDropdownRef}>
                    <button
                      type="button"
                      onClick={handleAuthorToggle}
                      className="font-medium text-sm truncate text-gray-900 dark:text-[#F0F0F0] hover:underline cursor-pointer"
                    >
                      {comment.profiles?.nickname || '알 수 없음'}
                    </button>
                    {isAuthorDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 z-50 min-w-[120px] bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
                        <Link
                          href={`/user/${comment.profiles.public_id}`}
                          onClick={() => setIsAuthorDropdownOpen(false)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          프로필 보기
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="font-medium text-sm truncate text-gray-900 dark:text-[#F0F0F0]">
                    {comment.profiles?.nickname || '알 수 없음'}
                  </span>
                )}
                {isPostOwner && isCommentOwner && (
                  <span className="text-xs bg-gray-100 dark:bg-[#333333] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">작성자</span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{formatDate(comment.created_at || '')}</span>
            </div>

            {!isEditing ? (
              <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 break-words">{comment.content}</div>
            ) : (
              <div className="mb-3">
                <textarea
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md text-sm resize-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors duration-200"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={handleCancel} className="px-3 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#333333] rounded-md hover:bg-gray-200 dark:hover:bg-[#404040]">취소</button>
                  <button onClick={handleSave} className="px-3 py-1 text-xs text-white bg-slate-800 dark:bg-[#3F3F3F] rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A]" disabled={!editContent.trim()}>저장</button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ActionButton action="like" active={userAction === 'like'} count={likes} onClick={handleLike} disabled={isLiking || isDisliking || !currentUserId} />
                <ActionButton action="dislike" active={userAction === 'dislike'} count={dislikes} onClick={handleDislike} disabled={isLiking || isDisliking || !currentUserId} />
                {/* 답글 버튼 - 원댓글에만 표시 (대댓글에는 표시 안 함) */}
                {!isReply && currentUserId && onReply && (
                  <button
                    onClick={() => onReply(comment.id)}
                    className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    답글
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {!isCommentOwner && currentUserId && (
                  <ReportButton targetType="comment" targetId={comment.id} variant="ghost" size="sm" showText={false} className="text-xs p-1" />
                )}
                {isCommentOwner && !isEditing && (
                  <>
                    <button onClick={handleEdit} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">수정</button>
                    <button onClick={() => onDelete(comment.id)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">삭제</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 대댓글 렌더링 (1단계만) */}
      {comment.children && comment.children.length > 0 && (
        <>
          {comment.children.map((childComment) => (
            <Comment
              key={childComment.id}
              comment={childComment}
              currentUserId={currentUserId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isPostOwner={isPostOwner}
              isReply={true}
            />
          ))}
        </>
      )}
    </>
  );
}

function DeletedCommentUI({ isReply = false }: { isReply?: boolean }) {
  return (
    <div className={`border-b border-gray-100 dark:border-white/10 py-3 px-4 bg-red-50 dark:bg-red-950/20 ${isReply ? 'pl-12' : ''}`}>
      <div className="flex items-center py-2">
        {isReply && (
          <svg className="w-4 h-4 text-red-300 dark:text-red-700 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )}
        <div className="flex items-center text-sm text-red-600 dark:text-red-400">
          <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          삭제된 댓글입니다
        </div>
      </div>
    </div>
  );
}

function HiddenCommentUI({ hiddenUntil, isReply = false }: { hiddenUntil?: string; isReply?: boolean }) {
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
    <div className={`border-b border-gray-100 dark:border-white/10 py-3 px-4 bg-gray-50 dark:bg-[#252525] ${isReply ? 'pl-12' : ''}`}>
      <div className="flex items-center py-2">
        {isReply && (
          <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )}
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
          숨김 처리된 댓글입니다 ({calculateRemainingDays()} 후 검토)
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
  const label = action === 'like' ? '좋아요' : '싫어요';

  const getColorClass = () => {
    if (active) {
      return action === 'like'
        ? 'text-blue-500 dark:text-blue-400 font-medium'
        : 'text-red-500 dark:text-red-400 font-medium';
    }
    return 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300';
  };

  return (
    <button
      className={`flex items-center text-xs space-x-1 ${getColorClass()} transition-colors disabled:opacity-50`}
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
