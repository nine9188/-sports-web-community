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
        className="bg-gray-50 hover:bg-gray-100 rounded-md py-2 transition-colors"
      >
        <div className="font-medium">{postCount}</div>
        <div className="text-gray-500">작성 글</div>
      </Link>
      <Link 
        href="/settings/my-comments"
        className="bg-gray-50 hover:bg-gray-100 rounded-md py-2 transition-colors"
      >
        <div className="font-medium">{commentCount}</div>
        <div className="text-gray-500">작성 댓글</div>
      </Link>
    </div>
  );
} 