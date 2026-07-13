'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import {
  createSupportComment,
  type SupportComment,
  type TeamType,
} from '@/domains/livescore/actions/match/supportComments';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthorLink } from '@/domains/user/components';
import { useAuth } from '@/shared/context/AuthContext';

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

function formatTimeAgo(dateString: string | null) {
  if (!dateString) return '';

  const now = new Date();
  const commentDate = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return '방금';
  if (diffInMinutes < 60) return `${diffInMinutes}분`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간`;
  return `${Math.floor(diffInMinutes / 1440)}일`;
}

function getTeamLabel(teamType: TeamType) {
  switch (teamType) {
    case 'home':
      return '홈';
    case 'away':
      return '원정';
    case 'neutral':
    default:
      return '중립';
  }
}

function getShortTeamName(team?: { name?: string; name_ko?: string }, fallback = '') {
  const teamName = team?.name_ko || team?.name || fallback;
  return teamName.length > 7 ? `${teamName.slice(0, 7)}...` : teamName;
}

function CommentItem({ comment }: { comment: SupportComment }) {
  const isHidden = 'is_hidden' in comment && comment.is_hidden === true;
  const isDeleted = 'is_deleted' in comment && comment.is_deleted === true;

  if (isDeleted) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center justify-center py-4 text-[13px] text-red-600 dark:text-red-400 font-medium">
          신고로 인해 삭제되었습니다
        </div>
      </div>
    );
  }

  if (isHidden) {
    return (
      <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626]">
        <div className="text-center py-4">
          <div className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">
            신고로 인해 일시 숨김 처리되었습니다
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">검토 후 다시 표시될 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
      <div className="flex items-center space-x-2 mb-1">
        <AuthorLink
          nickname={comment.user_profile?.nickname || '익명'}
          publicId={comment.user_profile?.public_id}
          authorId={comment.user_id}
          showIcon={false}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getTeamLabel(comment.team_type)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatTimeAgo(comment.created_at)}
        </span>
      </div>

      <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
        {comment.content}
      </p>
    </div>
  );
}

export default function SupportCommentsSection({
  matchId,
  matchData,
  initialComments,
}: {
  matchId: string;
  matchData: MatchDataType;
  initialComments?: SupportComment[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [newComment, setNewComment] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamType>('neutral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TeamType | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(10);
  const [allComments, setAllComments] = useState<SupportComment[]>(initialComments ?? []);

  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;

  useEffect(() => {
    setAllComments(initialComments ?? []);
  }, [initialComments]);

  const filteredComments = allComments.filter((comment) => {
    if (activeTab === 'all') return true;
    return comment.team_type === activeTab;
  });

  const handleTabChange = (tab: TeamType | 'all') => {
    setActiveTab(tab);
    setVisibleCount(10);
  };

  const handleSubmitComment = useCallback(async () => {
    if (!matchId || !newComment.trim() || !selectedTeam || !isLoggedIn) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSupportComment(matchId, selectedTeam, newComment.trim(), pathname);

      if (result.success) {
        setNewComment('');
        startTransition(() => {
          router.refresh();
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [matchId, newComment, selectedTeam, isLoggedIn, router, pathname, startTransition]);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      <ContainerHeader>
        <ContainerTitle>응원 댓글</ContainerTitle>
      </ContainerHeader>

      <div className="p-4 border-b border-black/5 dark:border-white/10">
        {!isLoggedIn ? (
          <div
            className="relative cursor-pointer"
            onClick={() => {
              if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/signin');
              }
            }}
          >
            <textarea
              className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-gray-50 dark:bg-[#262626] text-gray-400 dark:text-gray-500 rounded-lg text-[13px] placeholder-gray-400 dark:placeholder-gray-500 resize-none pointer-events-none"
              rows={2}
              placeholder="댓글을 작성하려면 로그인해주세요"
              disabled
              readOnly
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex space-x-2 w-full">
              <Button
                variant={selectedTeam === 'home' ? 'primary' : 'ghost'}
                onClick={() => setSelectedTeam('home')}
                className="flex-1 px-2 py-1 text-xs h-auto whitespace-nowrap"
              >
                <span className="truncate block">{getShortTeamName(homeTeam, '홈')}</span>
              </Button>
              <Button
                variant={selectedTeam === 'away' ? 'primary' : 'ghost'}
                onClick={() => setSelectedTeam('away')}
                className="flex-1 px-2 py-1 text-xs h-auto whitespace-nowrap"
              >
                <span className="truncate block">{getShortTeamName(awayTeam, '원정')}</span>
              </Button>
              <Button
                variant={selectedTeam === 'neutral' ? 'primary' : 'ghost'}
                onClick={() => setSelectedTeam('neutral')}
                className="flex-1 px-2 py-1 text-xs h-auto whitespace-nowrap"
              >
                중립
              </Button>
            </div>

            <div className="relative">
              <textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="응원 댓글을 남겨보세요"
                className="w-full px-3 py-3 border border-black/7 dark:border-white/10 bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] rounded-lg text-[13px] resize-none outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-[#EAEAEA] dark:focus:bg-[#333333] placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                rows={2}
                maxLength={300}
                disabled={isSubmitting}
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-500 dark:text-gray-400">
                {newComment.length}/300
              </div>
            </div>

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

      <div className="max-h-[32rem] overflow-y-auto">
        {filteredComments.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
            댓글이 없습니다.
          </div>
        ) : (
          <>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {filteredComments.slice(0, visibleCount).map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
            {visibleCount < filteredComments.length && (
              <div className="p-3 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 10)}
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
