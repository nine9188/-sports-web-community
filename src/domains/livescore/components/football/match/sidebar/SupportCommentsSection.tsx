'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import {
  createSupportComment,
  getSupportComments,
  type TeamType,
  type SupportComment
} from '@/domains/livescore/actions/match/supportComments';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { AuthorLink } from '@/domains/user/components';

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
}: {
  comment: SupportComment;
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

  // 댓글이 숨김 처리되었는지 확인
  const isHidden = 'is_hidden' in comment && comment.is_hidden === true;
  
  // 댓글이 삭제 처리되었는지 확인
  const isDeleted = 'is_deleted' in comment && comment.is_deleted === true;
  
  // 삭제 처리된 댓글인 경우 특별한 UI 표시
  if (isDeleted) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">신고에 의해 삭제되었습니다</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 숨김 처리된 댓글인 경우 특별한 UI 표시
  if (isHidden) {
    return (
      <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626]">
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">신고에 의해 일시 숨김처리 되었습니다</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">7일 후 다시 검토됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
      {/* 닉네임 줄 */}
      <div className="flex items-center space-x-2 mb-1">
        <AuthorLink
          nickname={comment.user_profile?.nickname || '익명'}
          publicId={comment.user_profile?.public_id}
          oddsUserId={comment.user_id}
          showIcon={false}
        />
        <span className="text-xs">
          {getTeamEmoji(comment.team_type)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatTimeAgo(comment.created_at || '')}
        </span>
      </div>

      {/* 댓글 내용 */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {comment.content}
      </p>
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
  const router = useRouter();
  const matchId = pathname?.split('/').pop() || '';
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamType | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;

  // React Query로 댓글 로드
  const { data: commentsData } = useQuery({
    queryKey: ['supportComments', matchId],
    queryFn: async () => {
      const result = await getSupportComments(matchId);
      return result.success && result.data ? result.data : [];
    },
    enabled: !!matchId,
    initialData: initialComments,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 10 * 60 * 1000, // 10분
  });

  const allComments = commentsData ?? [];

  // 필터링된 댓글 계산
  const filteredComments = allComments.filter(comment => {
    if (activeTab === 'all') return true;
    return comment.team_type === activeTab;
  });

  // 로그인 상태 체크
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
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
        } else {
          setIsLoggedIn(false);
          }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 댓글 새로고침 함수
  const refreshComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['supportComments', matchId] });
  }, [queryClient, matchId]);

  // 탭 변경 핸들러 - 클라이언트 필터링만
  const handleTabChange = (tab: TeamType | 'all') => {
    setActiveTab(tab);
    setVisibleCount(10);
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
        refreshComments(); // 댓글 목록 새로고침
      }
    } catch {
      // 에러 처리는 조용히 진행
    } finally {
      setIsSubmitting(false);
    }
  }, [matchId, newComment, selectedTeam, isLoggedIn, refreshComments]);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      {/* 헤더 */}
      <ContainerHeader>
        <ContainerTitle>응원 댓글</ContainerTitle>
      </ContainerHeader>

      {/* 댓글 작성 폼 - 개선된 UI */}
      <div className="p-4 border-b border-black/5 dark:border-white/10">
        {!isLoggedIn ? (
          /* 비로그인 상태 */
          <div
            className="relative cursor-pointer"
            onClick={() => {
              if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/signin');
              }
            }}
          >
            <textarea
              className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-gray-50 dark:bg-[#262626] text-gray-400 dark:text-gray-500 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 resize-none pointer-events-none"
              rows={2}
              placeholder="댓글을 작성하려면 로그인해주세요."
              disabled
              readOnly
            />
          </div>
        ) : (
          /* 로그인 상태 */
          <div className="space-y-3">
            {/* 응원팀 선택 - 상단으로 이동 */}
            <div className="flex space-x-2 w-full">
              <Button
                variant={selectedTeam === 'home' ? 'primary' : 'ghost'}
                onClick={() => setSelectedTeam('home')}
                className="flex-1 px-2 py-1 text-xs h-auto whitespace-nowrap"
              >
                <span className="truncate block">
                  {(() => {
                    const teamName = homeTeam?.name_ko || homeTeam?.name || '홈';
                    return teamName.length > 7 ? `${teamName.slice(0, 7)}...` : teamName;
                  })()}
                </span>
              </Button>
              <Button
                variant={selectedTeam === 'away' ? 'primary' : 'ghost'}
                onClick={() => setSelectedTeam('away')}
                className="flex-1 px-2 py-1 text-xs h-auto whitespace-nowrap"
              >
                <span className="truncate block">
                  {(() => {
                    const teamName = awayTeam?.name_ko || awayTeam?.name || '원정';
                    return teamName.length > 7 ? `${teamName.slice(0, 7)}...` : teamName;
                  })()}
                </span>
              </Button>
              <Button
                variant={selectedTeam === 'neutral' ? 'primary' : 'ghost'}
                onClick={() => setSelectedTeam('neutral')}
                className="flex-1 px-2 py-1 text-xs h-auto whitespace-nowrap"
              >
                중립
              </Button>
            </div>

            {/* 댓글 입력창 */}
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="응원 댓글을 남겨보세요..."
                className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg text-sm resize-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                rows={2}
                maxLength={300}
                disabled={isSubmitting}
              />
              {/* 글자 수 표시 */}
              <div className="absolute bottom-2 right-3 text-xs text-gray-500 dark:text-gray-400">
                {newComment.length}/300
              </div>
            </div>

            {/* 등록 버튼 */}
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="px-3 py-1 text-xs h-auto"
              >
                {isSubmitting ? '작성중...' : '등록'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 필터링 탭 - 댓글 목록 위로 이동 */}
      <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
        <div className="flex space-x-1">
          <Button
            variant={activeTab === 'all' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('all')}
            className="px-2 py-1 text-xs h-auto"
          >
            전체
          </Button>
          <Button
            variant={activeTab === 'home' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('home')}
            className="px-2 py-1 text-xs h-auto"
          >
            홈
          </Button>
          <Button
            variant={activeTab === 'away' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('away')}
            className="px-2 py-1 text-xs h-auto"
          >
            원정
          </Button>
          <Button
            variant={activeTab === 'neutral' ? 'primary' : 'ghost'}
            onClick={() => handleTabChange('neutral')}
            className="px-2 py-1 text-xs h-auto"
          >
            중립
          </Button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="max-h-[32rem] overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>아직 댓글이 없습니다.</p>
            <p className="text-xs mt-1">첫 번째 응원 댓글을 남겨보세요!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {filteredComments.slice(0, visibleCount).map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                />
              ))}
            </div>
            {visibleCount < filteredComments.length && (
              <div className="p-3 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="w-full py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-lg transition-colors"
                >
                  더보기 ({filteredComments.length - visibleCount}개 남음)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
} 