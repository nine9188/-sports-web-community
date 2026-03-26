"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/shared/components/ui';
import { CommentType } from '@/domains/boards/types/post/comment';
import ReportButton from '@/domains/reports/components/ReportButton';
import AuthorLink from '@/domains/user/components/AuthorLink';
import { formatDate } from '@/shared/utils/dateUtils';
import Image from 'next/image';
import EmoticonPicker from './EmoticonPicker';
import { useEmoticonMap } from '@/domains/boards/hooks/useEmoticonMap';

// 이모티콘 코드를 파싱하여 텍스트 + 이미지로 렌더링
function renderContent(text: string, emoticonMap: Map<string, { code: string; url: string; name: string }>, emoticonRegex: RegExp) {
  if (!text) return null;

  const parts = text.split(emoticonRegex);

  return parts.map((part, index) => {
    const matched = emoticonMap.get(part);
    if (matched) {
      return (
        <Image
          key={index}
          src={matched.url}
          alt={matched.name}
          title={matched.name}
          width={60}
          height={60}
          className="inline-block w-[60px] h-[60px] object-contain align-middle m-1"
        />
      );
    }
    // 줄바꿈 처리
    return (
      <React.Fragment key={index}>
        {part.split('\n').map((line, i, arr) => (
          <React.Fragment key={i}>
            {line}
            {i !== arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  });
}

interface CommentProps {
  comment: CommentType & {
    userAction?: 'like' | 'dislike' | null;
  };
  currentUserId: string | null;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReply?: (parentId: string) => void;
  onLike: (commentId: string) => Promise<void>;
  onDislike: (commentId: string) => Promise<void>;
  isLiking?: boolean;
  isPostOwner?: boolean;
  isReply?: boolean;
}

export default function Comment({
  comment,
  currentUserId,
  onUpdate,
  onDelete,
  onReply,
  onLike,
  onDislike,
  isLiking: parentIsLiking = false,
  isPostOwner = false,
  isReply = false
}: CommentProps) {
  const { emoticonMap, emoticonRegex } = useEmoticonMap();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showEditEmoticonPicker, setShowEditEmoticonPicker] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isCommentOwner = currentUserId === comment.user_id;
  const isHidden = comment.is_hidden === true;
  const isDeleted = comment.is_deleted === true;

  useEffect(() => {
    setEditContent(comment.content);
  }, [comment.content]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setShowEditEmoticonPicker(false);
    setEditContent(comment.content);
  };

  const handleSave = async () => {
    if (!editContent.trim()) return;
    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
      setShowEditEmoticonPicker(false);
    } catch {
      alert('댓글 수정에 실패했습니다.');
    }
  };

  const handleEditEmoticonSelect = useCallback((code: string) => {
    const textarea = editTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = editContent.substring(0, start) + code + editContent.substring(end);
      setEditContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + code.length;
        textarea.focus();
      }, 0);
    } else {
      setEditContent(prev => prev + code);
    }
  }, [editContent]);

  const handleLike = async () => {
    if (parentIsLiking || !currentUserId) return;
    try {
      await onLike(comment.id);
    } catch {
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDislike = async () => {
    if (parentIsLiking || !currentUserId) return;
    try {
      await onDislike(comment.id);
    } catch {
      alert('싫어요 처리 중 오류가 발생했습니다.');
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
        className={`border-b border-black/5 dark:border-white/10 py-3 px-4 ${isReply ? 'pl-12 bg-[#F5F5F5]/50 dark:bg-[#1A1A1A]' : ''}`}
      >
        <div className="flex space-x-2">
          {isReply && (
            <div className="flex-shrink-0 pt-0.5">
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2 min-w-0">
                <AuthorLink
                  nickname={comment.profiles?.nickname || '알 수 없음'}
                  oddsUserId={comment.user_id ?? undefined}
                  publicId={comment.profiles?.public_id ?? undefined}
                  iconUrl={comment.profiles?.icon_url || undefined}
                  level={comment.profiles?.level || 1}
                  exp={comment.profiles?.exp ?? undefined}
                  iconSize={20}
                  showIcon={true}
                  priority
                  enableMobile
                />
                {isPostOwner && isCommentOwner && (
                  <span className="text-xs bg-[#F5F5F5] dark:bg-[#333333] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">작성자</span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{formatDate(comment.created_at || '')}</span>
            </div>

            {!isEditing ? (
              <div className="text-[13px] text-gray-800 dark:text-gray-200 mb-2 break-words leading-relaxed whitespace-pre-wrap">{renderContent(comment.content, emoticonMap, emoticonRegex)}</div>
            ) : (
              <div className="mb-3">
                <textarea
                  ref={editTextareaRef}
                  className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-md text-base sm:text-[13px] resize-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] focus:bg-[#F5F5F5] dark:focus:bg-[#262626] transition-colors duration-200"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEditEmoticonPicker(!showEditEmoticonPicker)}
                      className="flex items-center gap-1.5 px-3 h-[36px] text-[13px] font-medium"
                    >
                      이모티콘
                    </Button>
                    {showEditEmoticonPicker && (
                      <EmoticonPicker
                        onSelect={handleEditEmoticonSelect}
                        onClose={() => setShowEditEmoticonPicker(false)}
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleCancel} className="px-3 h-[36px] text-[13px] font-medium">취소</Button>
                    <Button variant="primary" onClick={handleSave} className="px-3 h-[36px] text-[13px] font-medium" disabled={!editContent.trim()}>저장</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ActionButton action="like" active={comment.userAction === 'like'} count={comment.likes || 0} onClick={handleLike} disabled={parentIsLiking || !currentUserId} />
                <ActionButton action="dislike" active={comment.userAction === 'dislike'} count={comment.dislikes || 0} onClick={handleDislike} disabled={parentIsLiking || !currentUserId} />
                {!isReply && currentUserId && onReply && (
                  <Button
                    variant="ghost"
                    onClick={() => onReply(comment.id)}
                    className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 h-auto px-0 py-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    답글
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {!isCommentOwner && currentUserId && (
                  <ReportButton targetType="comment" targetId={comment.id} variant="ghost" size="sm" showText={false} className="text-xs p-1" />
                )}
                {isCommentOwner && !isEditing && (
                  <>
                    <Button variant="ghost" onClick={handleEdit} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 h-auto px-0 py-0">수정</Button>
                    <Button variant="ghost" onClick={() => onDelete(comment.id)} className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 h-auto px-0 py-0">삭제</Button>
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
              onLike={onLike}
              onDislike={onDislike}
              isLiking={parentIsLiking}
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
    <div className={`border-b border-black/5 dark:border-white/10 py-3 px-4 bg-red-50 dark:bg-red-950/20 ${isReply ? 'pl-12' : ''}`}>
      <div className="flex items-center py-2">
        {isReply && (
          <svg className="w-4 h-4 text-red-300 dark:text-red-700 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )}
        <div className="flex items-center text-[13px] text-red-600 dark:text-red-400">
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
    <div className={`border-b border-black/5 dark:border-white/10 py-3 px-4 bg-[#F5F5F5] dark:bg-[#252525] ${isReply ? 'pl-12' : ''}`}>
      <div className="flex items-center py-2">
        {isReply && (
          <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )}
        <div className="flex items-center text-[13px] text-gray-600 dark:text-gray-400">
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
