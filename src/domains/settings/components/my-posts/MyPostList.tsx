'use client';

import React from 'react';
import Link from 'next/link';
import { MyPostItem } from '../../types/posts';
import { formatDate } from '@/shared/utils/date';

interface MyPostListProps {
  posts: MyPostItem[];
  totalCount: number;
}

export default function MyPostList({ 
  posts = [],
  totalCount = 0
}: MyPostListProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900">게시글 목록</h3>
        <span className="text-sm text-gray-500">총 {totalCount}개</span>
      </div>
      
      {posts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-gray-50 bg-opacity-50">
          <p>작성한 게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-7/12">
                  제목
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell w-2/12">
                  게시판
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell w-1/12">
                  조회
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">
                  작성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm max-w-[220px] overflow-hidden">
                    <Link href={`/board/${post.board_id}/post/${post.id}`} className={`font-medium truncate block ${
                      post.title === '[신고에 의해 삭제됨]' || post.title.includes('[삭제된 게시글]') 
                        ? 'text-red-500' 
                        : post.title === '[신고에 의해 숨김 처리됨]' || post.title.includes('[숨김 처리된 게시글]')
                        ? 'text-gray-500'
                        : 'text-gray-900 hover:text-blue-600'
                    }`} title={post.title}>
                      {post.title}
                      {post.tags && post.tags.length > 0 && (
                        <span className="text-blue-500 ml-2 text-sm">[{post.tags.length}]</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-left hidden md:table-cell">
                    {post.board_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center hidden sm:table-cell">
                    {post.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {formatDate(post.created_at)}
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