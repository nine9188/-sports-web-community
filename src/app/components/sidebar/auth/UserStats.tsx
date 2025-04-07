'use client';

import Link from 'next/link';

interface UserStatsProps {
  postCount?: number;
  commentCount?: number;
}

export default function UserStats({ postCount = 0, commentCount = 0 }: UserStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href="/settings/posts" className="block">
        <div className="border rounded-md py-1.5 px-3 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <span className="text-xs font-medium text-gray-700">{postCount} 게시글</span>
        </div>
      </Link>
      
      <Link href="/settings/comments" className="block">
        <div className="border rounded-md py-1.5 px-3 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
          <span className="text-xs font-medium text-gray-700">{commentCount} 댓글</span>
        </div>
      </Link>
    </div>
  );
} 