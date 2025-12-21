/**
 * PostList 로딩 스켈레톤 컴포넌트
 */

'use client';

import React from 'react';

/**
 * 로딩 중 표시되는 스켈레톤 UI
 */
export function PostListSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {Array(10)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"
          ></div>
        ))}
    </div>
  );
}
