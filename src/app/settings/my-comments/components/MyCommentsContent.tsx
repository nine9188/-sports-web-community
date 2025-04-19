'use client';

import React, { useState } from 'react';
import { MyCommentItem } from '../actions';
import MyCommentList from './MyCommentList';

interface MyCommentsContentProps {
  initialComments: MyCommentItem[];
  initialTotalCount: number;
}

export default function MyCommentsContent({
  initialComments,
  initialTotalCount,
}: MyCommentsContentProps) {
  // 상태 관리 - 항상 prop으로 받은 초기값을 사용
  const [comments] = useState<MyCommentItem[]>(initialComments);
  const [totalCount] = useState<number>(initialTotalCount);
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* 댓글 목록 */}
      <MyCommentList
        comments={comments}
        totalCount={totalCount}
      />
      
      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="text-center py-2 text-gray-500 text-sm">
          댓글을 불러오는 중...
        </div>
      )}
    </div>
  );
} 