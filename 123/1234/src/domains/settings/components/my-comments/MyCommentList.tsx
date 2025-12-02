'use client';

import React from 'react';
import Link from 'next/link';
import { MyCommentItem } from '../../types';
import { formatDate } from '@/shared/utils/date';

interface MyCommentListProps {
  comments: MyCommentItem[];
  totalCount: number;
}

export default function MyCommentList({
  comments = [],
  totalCount = 0
}: MyCommentListProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
      <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10 flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900 dark:text-[#F0F0F0]">댓글 목록</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">총 {totalCount}개</span>
      </div>

      {comments.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-[#F5F5F5] dark:bg-[#262626] bg-opacity-50">
          <p>작성한 댓글이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/5 dark:divide-white/10 table-fixed">
            <thead className="bg-[#F5F5F5] dark:bg-[#262626]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-5/12">
                  댓글 내용
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell w-3/12">
                  게시글
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell w-2/12">
                  게시판
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/12">
                  작성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1D1D1D] divide-y divide-black/5 dark:divide-white/10">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                  <td className="px-4 py-4 text-sm max-w-0">
                    <Link
                      href={`/boards/${comment.board_id}/posts/${comment.post_id}#comment-${comment.id}`}
                      className="text-gray-900 dark:text-[#F0F0F0] hover:text-gray-700 dark:hover:text-gray-300 transition-colors block truncate"
                      title={comment.content}
                    >
                      {comment.content}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 text-left hidden md:table-cell max-w-0">
                    <Link
                      href={`/boards/${comment.board_id}/posts/${comment.post_id}`}
                      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors block truncate"
                      title={comment.post_title || '(제목 없음)'}
                    >
                      {comment.post_title || '(제목 없음)'}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-left hidden sm:table-cell">
                    {comment.board_name || '게시판 없음'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                    {formatDate(comment.created_at) || '-'}
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
