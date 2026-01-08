'use client';

import { useState } from 'react';
import { Pagination } from '@/shared/components/ui/pagination';
import { useUserPosts, useUserComments } from '@/domains/user/hooks';
import PostList from '@/domains/boards/components/post/postlist/PostListMain';
import { FileText, MessageSquare } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';

interface UserActivityTabsProps {
  publicId: string;
}

export default function UserActivityTabs({ publicId }: UserActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');

  // 훅으로 데이터 페칭 - 활성 탭만 로드
  const postsData = useUserPosts(publicId, activeTab === 'posts');
  const commentsData = useUserComments(publicId, activeTab === 'comments');

  // 현재 탭에 따른 데이터 선택
  const currentData = activeTab === 'posts' ? postsData : commentsData;

  return (
    <>
      {/* 탭 + 리스트 컨테이너 */}
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-b-lg md:border md:border-black/7 md:dark:border-0 md:border-t-0 overflow-hidden">
        {/* 탭 */}
        <div className="flex h-12">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 h-12 text-xs flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'posts'
                ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>작성글</span>
            {postsData.totalCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({postsData.totalCount})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 h-12 text-xs flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'comments'
                ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-slate-800 dark:border-white'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>댓글</span>
            {commentsData.totalCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({commentsData.totalCount})
              </span>
            )}
          </button>
        </div>
        {/* 탭-콘텐츠 구분선 */}
        <div className="border-b-2 border-black/5 dark:border-white/10" />

        {/* 탭 콘텐츠 - PostList */}
        {currentData.loading && currentData.posts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <PostList
            posts={currentData.posts}
            loading={currentData.loading}
            showBoard={true}
            currentBoardId=""
            emptyMessage={activeTab === 'posts' ? '작성한 게시글이 없습니다.' : '댓글 단 게시글이 없습니다.'}
            className="!bg-transparent border-0 rounded-none"
          />
        )}
      </div>

      {/* Pagination - 컨테이너 밖 */}
      <Pagination
        currentPage={currentData.currentPage}
        totalPages={currentData.totalPages}
        onPageChange={currentData.setPage}
        mode="button"
      />
    </>
  );
}
