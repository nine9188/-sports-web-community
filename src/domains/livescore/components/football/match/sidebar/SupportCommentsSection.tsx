'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { 
  createSupportComment,
  getSupportComments,
  toggleCommentLike,
  type TeamType,
  type SupportComment
} from '@/domains/livescore/actions/match/supportComments';
import { createClient } from '@/shared/api/supabase';
import ReportButton from '@/domains/reports/components/ReportButton';

// 매치 데이터 타입 정의
interface MatchDataType {
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
  };
}

// 댓글 아이템 컴포넌트
function CommentItem({ 
  comment, 
  onLike,
  currentUserId,
  isLoggedIn
}: { 
  comment: SupportComment;
  onLike: (commentId: string) => void;
  currentUserId?: string;
  isLoggedIn: boolean;
}) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금';
    if (diffInMinutes < 60) return `${diffInMinutes}분`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간`;
    return `${Math.floor(diffInMinutes / 1440)}일`;
  };

  const getTeamEmoji = (teamType: TeamType) => {
    switch (teamType) {
      case 'home': return '홈';
      case 'away': return '원정';
      case 'neutral': return '중립';
      default: return '중립';
    }
  };

  const isAuthor = currentUserId === comment.user_id;
  const showReportButton = isLoggedIn && !isAuthor;
  
  // 댓글이 숨김 처리되었는지 확인
  const isHidden = 'is_hidden' in comment && comment.is_hidden === true;
  
  // 댓글이 삭제 처리되었는지 확인
  const isDeleted = 'is_deleted' in comment && comment.is_deleted === true;
  
  // 삭제 처리된 댓글인 경우 특별한 UI 표시
  if (isDeleted) {
    return (
      <div className="p-3 bg-red-50">
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm text-red-600 font-medium">신고에 의해 삭제되었습니다</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 숨김 처리된 댓글인 경우 특별한 UI 표시
  if (isHidden) {
    return (
      <div className="p-3 bg-gray-50">
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
              <span className="text-sm text-gray-600 font-medium">신고에 의해 일시 숨김처리 되었습니다</span>
            </div>
            <p className="text-xs text-gray-500">7일 후 다시 검토됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-3">
        {/* 사용자 아이콘 */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          comment.user_profile?.shop_items?.image_url 
            ? 'bg-transparent' 
            : 'bg-gradient-to-br from-blue-400 to-purple-500'
        }`}>
          {comment.user_profile?.shop_items?.image_url ? (
            <Image
              src={comment.user_profile.shop_items.image_url}
              alt="user icon"
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-xs text-white font-bold">
              {comment.user_profile?.nickname?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* 사용자 정보 */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {comment.user_profile?.nickname || '익명'}
              </span>
              <span className="text-xs">
                {getTeamEmoji(comment.team_type)}
              </span>
              <span className="text-xs text-gray-400">
                {formatTimeAgo(comment.created_at || '')}
              </span>
            </div>
            
            {/* 신고 버튼 (날짜 옆으로 이동) */}
            {showReportButton && (
              <ReportButton
                targetType="match_comment"
                targetId={comment.id}
                variant="ghost"
                size="sm"
                showText={false}
                className="text-xs text-gray-400 hover:text-gray-600 p-1"
              />
            )}
          </div>

          {/* 댓글 내용 */}
          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
            {comment.content}
          </p>

          {/* 좋아요 버튼 (댓글 내용 아래로 이동, 크기 축소) */}
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center space-x-1 text-xs transition-all hover:scale-105 ${
              comment.is_liked 
                ? 'text-red-500' 
                : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <span className="text-xs">좋아요</span>
            {comment.likes_count > 0 && (
              <span className="font-medium text-xs">{comment.likes_count}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// 메인 응원 댓글 섹션 컴포넌트
export default function SupportCommentsSection({ 
  matchData,
  initialComments
}: { 
  matchData: MatchDataType;
  initialComments?: SupportComment[];
}) {
  const pathname = usePathname();
  const matchId = pathname?.split('/').pop() || '';
  
  const [allComments, setAllComments] = useState<SupportComment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;

  // 필터링된 댓글 계산
  const filteredComments = allComments.filter(comment => {
    if (activeTab === 'all') return true;
    return comment.team_type === activeTab;
  });

  // 로그인 상태 체크
  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        setCurrentUserId(user?.id);
      } catch {
        setIsLoggedIn(false);
        setCurrentUserId(undefined);
      }
    };

    // 초기 로그인 상태 체크
    checkAuth();

    // 로그인 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // 보안 강화: getUser()로 실제 인증 확인
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!error && user) {
          setIsLoggedIn(true);
          setCurrentUserId(user.id);
        } else {
          setIsLoggedIn(false);
          setCurrentUserId(undefined);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUserId(undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 댓글 목록 로드 - useCallback으로 감싸서 dependency 문제 해결
  const loadComments = useCallback(async () => {
    if (!matchId) return;
    
    setIsRefreshing(true);
    try {
      const result = await getSupportComments(matchId);
      
      if (result.success && result.data) {
        setAllComments(result.data);
      }
    } catch {
      // 에러 처리는 조용히 진행
    } finally {
      setIsRefreshing(false);
    }
  }, [matchId]);

  // 초기 댓글이 없는 경우에만 로드
  useEffect(() => {
    if (initialComments === undefined) {
      loadComments();
    }
  }, [matchId, loadComments, initialComments]);

  // 탭 변경 핸들러 - 클라이언트 필터링만
  const handleTabChange = (tab: TeamType | 'all') => {
    setActiveTab(tab);
  };

  // 댓글 작성
  const handleSubmitComment = useCallback(async () => {
    if (!matchId || !newComment.trim() || !selectedTeam || !isLoggedIn) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSupportComment(
        matchId,
        selectedTeam,
        newComment.trim()
      );
      
      if (result.success) {
        setNewComment('');
        await loadComments(); // 댓글 목록 새로고침
      }
    } catch {
      // 에러 처리는 조용히 진행
    } finally {
      setIsSubmitting(false);
    }
  }, [matchId, newComment, selectedTeam, isLoggedIn, loadComments]);

  // 댓글 좋아요 토글
  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await toggleCommentLike(commentId);
      
      if (result.success) {
        setAllComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: !comment.is_liked,
              likes_count: comment.is_liked 
                ? comment.likes_count - 1 
                : comment.likes_count + 1
            };
          }
          return comment;
        }));
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 댓글 새로고침 함수
  const handleRefreshComments = async () => {
    if (!matchId || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      loadComments();
      toast.success('댓글을 새로고침했습니다!');
    } catch {
      toast.error('댓글 새로고침에 실패했습니다.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800">응원 댓글</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {filteredComments.length}개
            </span>
            <button
              onClick={handleRefreshComments}
              disabled={isRefreshing}
              className={`p-1 rounded-full transition-all hover:bg-gray-100 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="댓글 새로고침"
            >
              <svg 
                className="w-4 h-4 text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 댓글 작성 폼 - 개선된 UI */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="space-y-3">
          {/* 응원팀 선택 - 상단으로 이동 */}
          <div className="flex space-x-2 w-full">
            <button
              onClick={() => setSelectedTeam('home')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedTeam === 'home'
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="truncate block">
                {(() => {
                  const teamName = homeTeam?.name_ko || homeTeam?.name || '홈';
                  return teamName.length > 7 ? `${teamName.slice(0, 7)}...` : teamName;
                })()}
              </span>
            </button>
            <button
              onClick={() => setSelectedTeam('away')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedTeam === 'away'
                  ? 'bg-red-500 text-white'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <span className="truncate block">
                {(() => {
                  const teamName = awayTeam?.name_ko || awayTeam?.name || '원정';
                  return teamName.length > 7 ? `${teamName.slice(0, 7)}...` : teamName;
                })()}
              </span>
            </button>
            <button
              onClick={() => setSelectedTeam('neutral')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                selectedTeam === 'neutral'
                  ? 'bg-gray-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              중립
            </button>
          </div>

          {/* 댓글 입력창 */}
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isLoggedIn ? "응원 댓글을 남겨보세요..." : "로그인이 필요합니다."}
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              rows={3}
              maxLength={300}
              disabled={!isLoggedIn || isSubmitting}
            />
            {/* 글자 수 표시 */}
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {newComment.length}/300
            </div>
          </div>

          {/* 등록 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || !isLoggedIn || isSubmitting}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isSubmitting ? '작성중...' : '등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 필터링 탭 - 댓글 목록 위로 이동 */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex space-x-1">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'all'
                ? 'bg-gray-800 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleTabChange('home')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'home'
                ? 'bg-blue-500 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            홈
          </button>
          <button
            onClick={() => handleTabChange('away')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'away'
                ? 'bg-red-500 text-white'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            원정
          </button>
          <button
            onClick={() => handleTabChange('neutral')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'neutral'
                ? 'bg-gray-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            중립
          </button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="max-h-[32rem] overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <p>아직 댓글이 없습니다.</p>
            <p className="text-xs mt-1">첫 번째 응원 댓글을 남겨보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLikeComment}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 