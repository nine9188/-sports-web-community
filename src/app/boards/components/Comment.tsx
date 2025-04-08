"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase-browser';
import Image from 'next/image';
import { getUserIconInfo } from '@/app/utils/level-icons';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    likes?: number;
    dislikes?: number;
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
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null);
  const [iconName, setIconName] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
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
  }, [comment.user_id]);
  
  // 초기 상태 확인 (사용자가 이미 좋아요/싫어요를 눌렀는지)
  useEffect(() => {
    async function checkUserAction() {
      if (!currentUserId) return;
      
      // 좋아요 확인
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', currentUserId)
        .eq('type', 'like');
      
      if (existingLike && existingLike.length > 0) {
        setUserAction('like');
        return;
      }
      
      // 싫어요 확인
      const { data: existingDislike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', currentUserId)
        .eq('type', 'dislike');
      
      if (existingDislike && existingDislike.length > 0) {
        setUserAction('dislike');
        return;
      }
    }
    
    checkUserAction();
  }, [comment.id, currentUserId, supabase]);
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleSave = async () => {
    if (!editContent.trim()) return;
    
    await onUpdate(comment.id, editContent.trim());
    setIsEditing(false);
  };
  
  const handleLike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    
    setIsLiking(true);
    
    try {
      // 이미 싫어요를 누른 상태인지 확인
      if (userAction === 'dislike') {
        // 싫어요 기록 조회
        const { data: existingDislike } = await supabase
          .from('comment_likes')
          .select('*')
          .eq('comment_id', comment.id)
          .eq('user_id', currentUserId)
          .eq('type', 'dislike');
        
        if (existingDislike && existingDislike.length > 0) {
          // 싫어요 취소
          await supabase
            .from('comment_likes')
            .delete()
            .eq('id', existingDislike[0].id);
          
          // 싫어요 카운트 감소
          await supabase
            .from('comments')
            .update({ dislikes: dislikes - 1 })
            .eq('id', comment.id);
          
          setDislikes(dislikes - 1);
        }
      }
      
      // 이미 좋아요를 눌렀는지 확인
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', currentUserId)
        .eq('type', 'like');
      
      if (existingLike && existingLike.length > 0) {
        // 좋아요 취소
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike[0].id);
          
        await supabase
          .from('comments')
          .update({ likes: likes - 1 })
          .eq('id', comment.id);
          
        setLikes(likes - 1);
        setUserAction(null);
      } else {
        // 좋아요 추가
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: currentUserId,
            type: 'like'
          });
          
        await supabase
          .from('comments')
          .update({ likes: likes + 1 })
          .eq('id', comment.id);
          
        setLikes(likes + 1);
        setUserAction('like');
      }
      
      router.refresh();
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleDislike = async () => {
    if (isLiking || isDisliking || !currentUserId) return;
    
    setIsDisliking(true);
    
    try {
      // 이미 좋아요를 누른 상태인지 확인
      if (userAction === 'like') {
        // 좋아요 기록 조회
        const { data: existingLike } = await supabase
          .from('comment_likes')
          .select('*')
          .eq('comment_id', comment.id)
          .eq('user_id', currentUserId)
          .eq('type', 'like');
        
        if (existingLike && existingLike.length > 0) {
          // 좋아요 취소
          await supabase
            .from('comment_likes')
            .delete()
            .eq('id', existingLike[0].id);
          
          // 좋아요 카운트 감소
          await supabase
            .from('comments')
            .update({ likes: likes - 1 })
            .eq('id', comment.id);
          
          setLikes(likes - 1);
        }
      }
      
      // 이미 싫어요를 눌렀는지 확인
      const { data: existingDislike } = await supabase
        .from('comment_likes')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', currentUserId)
        .eq('type', 'dislike');
      
      if (existingDislike && existingDislike.length > 0) {
        // 싫어요 취소
        await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingDislike[0].id);
          
        await supabase
          .from('comments')
          .update({ dislikes: dislikes - 1 })
          .eq('id', comment.id);
          
        setDislikes(dislikes - 1);
        setUserAction(null);
      } else {
        // 싫어요 추가
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: currentUserId,
            type: 'dislike'
          });
          
        await supabase
          .from('comments')
          .update({ dislikes: dislikes + 1 })
          .eq('id', comment.id);
          
        setDislikes(dislikes + 1);
        setUserAction('dislike');
      }
      
      router.refresh();
    } catch (error) {
      console.error('싫어요 처리 중 오류:', error);
    } finally {
      setIsDisliking(false);
    }
  };
  
  // 이미지 로드 에러 핸들러
  const handleImageError = () => {
    setUserIconUrl(null);
  };
  
  return (
    <div className="border-b py-4 px-4">
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
                className={`flex items-center text-xs space-x-1 ${userAction === 'like' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={handleLike}
                disabled={isLiking || isDisliking}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{likes}</span>
              </button>
              <button 
                className={`flex items-center text-xs space-x-1 ${userAction === 'dislike' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={handleDislike}
                disabled={isLiking || isDisliking}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  취소
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                수정
              </button>
              <button 
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-500 hover:text-red-700"
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