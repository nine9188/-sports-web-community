'use client';

import React, { useState } from 'react';
import MyScrapList from './MyScrapList';

interface ScrappedPostItem {
  id: string;
  title: string;
  post_number: number;
  views: number;
  likes: number;
  dislikes: number;
  category: string;
  created_at: string;
  scrapped_at: string;
  author_nickname: string;
  board_name: string;
  board_slug: string;
}

interface MyScrapsContentProps {
  initialPosts: ScrappedPostItem[];
  initialTotalCount: number;
}

export default function MyScrapsContent({
  initialPosts,
  initialTotalCount
}: MyScrapsContentProps) {
  const [posts] = useState<ScrappedPostItem[]>(initialPosts);
  const [totalCount] = useState<number>(initialTotalCount);
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <MyScrapList
        posts={posts}
        totalCount={totalCount}
      />

      {isLoading && (
        <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-[13px]">
          스크랩 목록을 불러오는 중...
        </div>
      )}
    </div>
  );
}
