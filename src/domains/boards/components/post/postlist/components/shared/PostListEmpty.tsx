/**
 * PostList 빈 상태 컴포넌트
 */

'use client';

import React from 'react';

interface PostListEmptyProps {
  message: string;
}

/**
 * 게시글이 없을 때 표시되는 빈 상태 UI
 */
export function PostListEmpty({ message }: PostListEmptyProps) {
  return (
    <div className="flex justify-center items-center h-32 text-center">
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
