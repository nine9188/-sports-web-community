'use client';

import { useState } from 'react';
import { Pagination } from '@/shared/components/ui/pagination';
import { TabList, type TabItem } from '@/shared/components/ui';
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
        <TabList
          tabs={[
            { id: 'posts', label: '작성글', icon: <FileText className="w-4 h-4" />, count: postsData.totalCount },
            { id: 'comments', label: '댓글', icon: <MessageSquare className="w-4 h-4" />, count: commentsData.totalCount },
          ] as TabItem[]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'posts' | 'comments')}
          variant="contained"
          showCount
          className="mb-0"
        />

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
