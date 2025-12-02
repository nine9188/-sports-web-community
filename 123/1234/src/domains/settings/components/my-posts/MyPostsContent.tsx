'use client';

import React, { useState } from 'react';
import { MyPostItem } from '../../types/posts';
import MyPostList from './MyPostList';

interface MyPostsContentProps {
  initialPosts: MyPostItem[];
  initialTotalCount: number;
}

export default function MyPostsContent({
  initialPosts,
  initialTotalCount
}: MyPostsContentProps) {
  // 상태 관리 - 항상 prop으로 받은 초기값을 사용
  const [posts] = useState<MyPostItem[]>(initialPosts);
  const [totalCount] = useState<number>(initialTotalCount);
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 게시글 목록 */}
      <MyPostList
        posts={posts}
        totalCount={totalCount}
      />

      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
          게시글을 불러오는 중...
        </div>
      )}
    </div>
  );
}
