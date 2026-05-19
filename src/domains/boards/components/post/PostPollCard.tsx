'use client';

import { useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { votePostPoll } from '@/domains/boards/actions/posts';
import type { PostPoll } from '@/domains/boards/types/poll';

interface PostPollCardProps {
  poll: PostPoll;
  isLoggedIn: boolean;
  className?: string;
}

export default function PostPollCard({ poll, isLoggedIn, className = 'px-4 sm:px-6 pb-5' }: PostPollCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasVoted = !!poll.viewerVoteOptionId;
  const totalVotes = poll.totalVotes || 0;

  const options = useMemo(() => {
    return [...poll.options].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [poll.options]);

  const handleVote = (optionId: string) => {
    if (!isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (hasVoted || isPending) return;

    startTransition(async () => {
      const result = await votePostPoll(poll.id, optionId);
      if (!result.success) {
        toast.error(result.error || '투표에 실패했습니다.');
        return;
      }

      toast.success('투표했습니다.');
      router.refresh();
    });
  };

  return (
    <div className={className}>
      <div className="rounded-md border border-black/7 bg-[#FAFAFA] p-4 dark:border-white/10 dark:bg-[#262626]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="min-w-0 text-[15px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
            {poll.question}
          </h3>
          <span className="shrink-0 text-[12px] text-gray-500 dark:text-gray-400">
            {totalVotes}표
          </span>
        </div>

        <div className="space-y-2">
          {options.map((option) => {
            const selected = poll.viewerVoteOptionId === option.id;
            const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

            return (
              <button
                key={option.id}
                type="button"
                disabled={hasVoted || isPending}
                onClick={() => handleVote(option.id)}
                className={`relative w-full overflow-hidden rounded-md border px-3 py-2 text-left transition-colors ${
                  selected
                    ? 'border-brand-primary bg-blue-50 dark:border-brand-primary-dark dark:bg-blue-500/10'
                    : 'border-black/7 bg-white hover:bg-[#F5F5F5] dark:border-white/10 dark:bg-[#1D1D1D] dark:hover:bg-[#333333]'
                }`}
              >
                {hasVoted && (
                  <span
                    className="absolute inset-y-0 left-0 bg-brand-primary/10 dark:bg-brand-primary-dark/15"
                    style={{ width: `${percent}%` }}
                  />
                )}
                <span className="relative flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] font-medium text-gray-900 dark:text-[#F0F0F0]">
                    {option.text}
                  </span>
                  {hasVoted && (
                    <span className="shrink-0 text-[12px] text-gray-600 dark:text-gray-300">
                      {percent}% · {option.voteCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {!hasVoted && (
          <p className="mt-2 text-[12px] text-gray-500 dark:text-gray-400">
            선택 후 결과를 볼 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
