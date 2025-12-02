'use client';

import Link from 'next/link';

interface UserStatsProps {
  postCount?: number;
  commentCount?: number;
}

export default function UserStats({ postCount = 0, commentCount = 0 }: UserStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-center">
      <Link
        href="/settings/my-posts"
        className="bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md py-2 transition-colors"
      >
        <div className="font-medium text-gray-900 dark:text-[#F0F0F0]">{postCount}</div>
        <div className="text-gray-500 dark:text-gray-400">작성 글</div>
      </Link>
      <Link
        href="/settings/my-comments"
        className="bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md py-2 transition-colors"
      >
        <div className="font-medium text-gray-900 dark:text-[#F0F0F0]">{commentCount}</div>
        <div className="text-gray-500 dark:text-gray-400">작성 댓글</div>
      </Link>
    </div>
  );
} 