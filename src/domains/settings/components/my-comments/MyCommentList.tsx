'use client';

import React from 'react';
import Link from 'next/link';
import { MyCommentItem } from '../../types';

interface MyCommentListProps {
  comments: MyCommentItem[];
  totalCount: number;
}

// 날짜 포맷팅 함수
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}.${month}.${day}`;
}

export default function MyCommentList({ 
  comments = [],
  totalCount = 0
}: MyCommentListProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900">댓글 목록</h3>
        <span className="text-sm text-gray-500">총 {totalCount}개</span>
      </div>
      
      {comments.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-50 bg-opacity-50">
          <p>작성한 댓글이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-6/12">
                  댓글 내용
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-3/12">
                  게시글
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  게시판
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                  작성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="truncate max-w-xs">
                      <Link 
                        href={`/boards/${comment.board_id}/posts/${comment.post_id}#comment-${comment.id}`} 
                        className="text-gray-900 hover:text-blue-600"
                      >
                        {comment.content}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    <Link 
                      href={`/boards/${comment.board_id}/posts/${comment.post_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {comment.post_title || '(제목 없음)'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {comment.board_name || '게시판 없음'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {formatDate(comment.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 