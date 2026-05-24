'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { PostPoll } from '@/domains/boards/types/poll';

interface PostPollCardProps {
  poll: PostPoll;
  isLoggedIn: boolean;
  className?: string;
}

function hashString(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function isPredictionPoll(poll: PostPoll): boolean {
  return (
    poll.options.length === 3 &&
    poll.question.includes('결과를 어떻게 예상') &&
    poll.options.some((option) => option.text.includes('무승부'))
  );
}

function getReferenceVoteCounts(poll: PostPoll): number[] {
  if (!isPredictionPoll(poll)) return [];

  const seed = hashString(poll.id);
  const total = 10 + (seed % 8);
  const draw = 1 + ((seed >> 3) % 3);
  const underdog = 1 + ((seed >> 5) % 4);
  const favorite = Math.max(1, total - draw - underdog);
  const counts = [favorite, draw, underdog];

  if (seed % 5 === 0) {
    return [underdog, draw, favorite];
  }

  return counts;
}

export default function PostPollCard({ poll, isLoggedIn, className = 'px-4 sm:px-6 pb-5' }: PostPollCardProps) {
  const [localPoll, setLocalPoll] = useState(poll);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const hasVoted = !!localPoll.viewerVoteOptionId;
  const totalVotes = localPoll.totalVotes || 0;

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  const options = useMemo(() => {
    return [...localPoll.options].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [localPoll.options]);

  const referenceVoteCounts = useMemo(() => {
    if (totalVotes >= 20) return [];
    return getReferenceVoteCounts(localPoll);
  }, [localPoll, totalVotes]);
  const referenceVoteTotal = referenceVoteCounts.reduce((sum, count) => sum + count, 0);
  const revealResults = hasVoted;
  const visibleTotalVotes = totalVotes + referenceVoteTotal;

  const handleVote = async (optionId: string) => {
    if (hasVoted || votingOptionId) return;

    setVotingOptionId(optionId);
    const scrollY = window.scrollY;

    try {
      const response = await fetch('/api/post-polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, optionId }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;

      if (!result?.success) {
        toast.error(result?.error || '투표에 실패했습니다.');
        return;
      }

      setLocalPoll((currentPoll) => {
        if (currentPoll.viewerVoteOptionId) return currentPoll;

        return {
          ...currentPoll,
          totalVotes: currentPoll.totalVotes + 1,
          viewerVoteOptionId: optionId,
          options: currentPoll.options.map((option) =>
            option.id === optionId
              ? { ...option, voteCount: option.voteCount + 1 }
              : option
          ),
        };
      });
      if (isLoggedIn) {
        toast.success('투표가 반영됐습니다.');
      } else {
        toast.success('투표가 반영됐습니다.', {
          description: '회원가입/로그인하고 더 많은 활동을 해보세요.',
        });
      }
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'auto' });
      });
    } finally {
      setVotingOptionId(null);
    }
  };

  return (
    <div className={className}>
      <div className="rounded-md border border-black/7 bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-[#262626]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="min-w-0 text-[15px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
            {poll.question}
          </h3>
          <span className="shrink-0 text-[12px] text-gray-500 dark:text-gray-400">
            {visibleTotalVotes}표
          </span>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => {
            const selected = localPoll.viewerVoteOptionId === option.id;
            const visibleVoteCount = option.voteCount + (revealResults ? referenceVoteCounts[index] || 0 : 0);
            const percent = visibleTotalVotes > 0 ? Math.round((visibleVoteCount / visibleTotalVotes) * 100) : 0;
            const showResult = revealResults;

            return (
              <button
                key={option.id}
                type="button"
                disabled={hasVoted || !!votingOptionId}
                onClick={() => handleVote(option.id)}
                className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left transition-colors ${
                  selected
                    ? 'border-brand-primary bg-blue-50 dark:border-brand-primary-dark dark:bg-blue-500/10'
                    : 'border-black/7 bg-white hover:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#1D1D1D] dark:hover:bg-[#333333]'
                }`}
              >
                {showResult && (
                  <span
                    className="absolute inset-y-0 left-0 bg-brand-primary/10 dark:bg-brand-primary-dark/15"
                    style={{ width: `${percent}%` }}
                  />
                )}
                <span className="relative flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                    {option.text}
                  </span>
                  {showResult && (
                    <span className="shrink-0 text-[12px] text-gray-600 dark:text-gray-300">
                      {percent}% · {visibleVoteCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {!hasVoted && (
          <p className="mt-2 text-[12px] text-gray-500 dark:text-gray-400">
            {isLoggedIn
              ? '선택 후 결과를 볼 수 있습니다.'
              : '로그인 없이도 바로 참여할 수 있습니다. 선택 후 결과가 공개됩니다.'}
          </p>
        )}

        {hasVoted && !isLoggedIn && (
          <div className="mt-3 rounded-md border border-brand-primary/15 bg-white px-3 py-2.5 dark:border-brand-primary-dark/25 dark:bg-[#1D1D1D]">
            <p className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
              의견이 반영됐어요.
            </p>
            <p className="mt-1 text-[12px] leading-5 text-gray-600 dark:text-gray-300">
              가입하면 투표 기록을 이어서 볼 수 있고, 댓글과 글쓰기까지 바로 참여할 수 있습니다.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
              <Link
                href="/signup"
                className="rounded-md bg-brand-primary px-3 py-1.5 font-semibold text-white hover:bg-brand-primary/90 dark:bg-brand-primary-dark dark:hover:bg-brand-primary-dark/90"
              >
                회원가입하고 계속 참여하기
              </Link>
              <Link
                href="/signin"
                className="rounded-md border border-black/10 px-3 py-1.5 font-medium text-gray-700 hover:bg-[#F5F5F5] dark:border-white/10 dark:text-gray-200 dark:hover:bg-[#333333]"
              >
                이미 계정이 있어요
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
