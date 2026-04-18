/**
 * PostList 빈 상태 컴포넌트
 * 서버 컴포넌트 - LCP 최적화
 */

import React from 'react';

interface PostListEmptyProps {
  message: string;
}

/**
 * 게시글이 없을 때 표시되는 빈 상태 UI
 */
export function PostListEmpty({ message }: PostListEmptyProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] p-8">
      <div className="text-center text-gray-500 dark:text-gray-400">{message}</div>
    </div>
  );
}
