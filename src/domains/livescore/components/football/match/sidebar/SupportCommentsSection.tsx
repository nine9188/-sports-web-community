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
  onLike
}: { 
  comment: SupportComment;
  onLike: (commentId: string) => void;
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
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {comment.user_profile?.nickname || '익명'}
            </span>
            <span className="text-xs">
              {getTeamEmoji(comment.team_type)}
            </span>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>

          {/* 댓글 내용 */}
          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
            {comment.content}
          </p>

          {/* 좋아요 버튼 */}
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center space-x-1 text-xs transition-all hover:scale-105 ${
              comment.is_liked 
                ? 'text-red-500' 
                : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <span className="text-sm">좋아요</span>
            {comment.likes_count > 0 && (
              <span className="font-medium">{comment.likes_count}</span>
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
  
  const [comments, setComments] = useState<SupportComment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamType | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;

  // 댓글 목록 로드 - useCallback으로 감싸서 dependency 문제 해결
  const loadComments = useCallback(async (teamType?: TeamType) => {
    if (!matchId) return;
    
    try {
      console.log('댓글 로드 시작:', { matchId, teamType });
      const result = await getSupportComments(matchId, teamType);
      console.log('댓글 로드 결과:', result);
      
      if (result.success && Array.isArray(result.data)) {
        setComments(result.data);
      } else {
        console.error('댓글 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('댓글 로드 오류:', error);
    }
  }, [matchId]);

  // 초기 댓글이 없는 경우에만 로드
  useEffect(() => {
    if (initialComments === undefined) {
      const teamTypeFilter = activeTab === 'all' ? undefined : (activeTab as TeamType);
      loadComments(teamTypeFilter);
    }
  }, [matchId, activeTab, loadComments, initialComments]);

  // 탭 변경 핸들러
  const handleTabChange = async (tab: TeamType | 'all') => {
    setActiveTab(tab);
    const teamTypeFilter = tab === 'all' ? undefined : (tab as TeamType);
    await loadComments(teamTypeFilter);
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !matchId) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('댓글 작성 시작:', { matchId, selectedTeam, content: newComment });
      const result = await createSupportComment(matchId, selectedTeam, newComment);
      console.log('댓글 작성 결과:', result);
      
      if (result.success) {
        // 입력창 비우기
        setNewComment('');
        toast.success('댓글이 작성되었습니다!');
        // 댓글 목록 새로고침
        const teamTypeFilter = activeTab === 'all' ? undefined : (activeTab as TeamType);
        await loadComments(teamTypeFilter);
      } else {
        console.error('댓글 작성 실패:', result.error);
        toast.error(result.error || '댓글 작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      toast.error('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 좋아요 토글
  const handleLikeComment = async (commentId: string) => {
    try {
      const result = await toggleCommentLike(commentId);
      
      if (result.success) {
        setComments(prev => prev.map(comment => {
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
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 댓글 새로고침 함수
  const handleRefreshComments = async () => {
    if (!matchId || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const teamTypeFilter = activeTab === 'all' ? undefined : (activeTab as TeamType);
      await loadComments(teamTypeFilter);
      toast.success('댓글을 새로고침했습니다!');
    } catch (error) {
      console.error('댓글 새로고침 오류:', error);
      toast.error('댓글 새로고침에 실패했습니다.');
    } finally {
      setIsRefreshing(false);
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
              {comments.length}개
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

      {/* 간단한 탭 */}
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

      {/* 댓글 작성 폼 - 개선된 UI */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="space-y-3">
          {/* 댓글 입력창 */}
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="응원 댓글을 남겨보세요..."
              className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              rows={3}
              maxLength={300}
              disabled={isSubmitting}
            />
            {/* 글자 수 표시 */}
            <div className="absolute bottom-2 right-3 text-xs text-gray-400">
              {newComment.length}/300
            </div>
          </div>

          {/* 하단 액션 영역 */}
          <div className="flex items-center justify-between">
            {/* 응원팀 선택 */}
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedTeam('home')}
                className={`w-16 px-2 py-1 text-xs rounded transition-colors ${
                  selectedTeam === 'home'
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span className="truncate block">
                  {homeTeam?.name_ko && homeTeam.name_ko.length > 5 
                    ? `${homeTeam.name_ko.slice(0, 5)}...` 
                    : homeTeam?.name_ko || '홈'}
                </span>
              </button>
              <button
                onClick={() => setSelectedTeam('away')}
                className={`w-16 px-2 py-1 text-xs rounded transition-colors ${
                  selectedTeam === 'away'
                    ? 'bg-red-500 text-white'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <span className="truncate block">
                  {awayTeam?.name_ko && awayTeam.name_ko.length > 5 
                    ? `${awayTeam.name_ko.slice(0, 5)}...` 
                    : awayTeam?.name_ko || '원정'}
                </span>
              </button>
              <button
                onClick={() => setSelectedTeam('neutral')}
                className={`w-12 px-2 py-1 text-xs rounded transition-colors ${
                  selectedTeam === 'neutral'
                    ? 'bg-gray-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                중립
              </button>
            </div>

            {/* 작성 버튼 */}
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isSubmitting ? '작성중...' : '등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="max-h-[32rem] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            <p>아직 댓글이 없습니다.</p>
            <p className="text-xs mt-1">첫 번째 응원 댓글을 남겨보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={handleLikeComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 