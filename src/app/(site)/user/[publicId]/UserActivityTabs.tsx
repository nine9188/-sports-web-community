'use client';

import { useRouter } from 'next/navigation';
import { FileText, MessageSquare } from 'lucide-react';
import { Pagination } from '@/shared/components/ui/pagination';
import { TabList, type TabItem } from '@/shared/components/ui/tabs';
import PostList from '@/domains/boards/components/post/postlist/PostListMain';
import type { Post } from '@/domains/boards/components/post/postlist/types';

const ITEMS_PER_PAGE = 20;

type ActivityTab = 'posts' | 'comments';

interface UserActivityTabsProps {
  publicId: string;
  activeTab: ActivityTab;
  currentPage: number;
  posts: Post[];
  totalCount: number;
  initialPostCount?: number;
  initialCommentCount?: number;
}

export default function UserActivityTabs({
  publicId,
  activeTab,
  currentPage,
  posts,
  totalCount,
  initialPostCount = 0,
  initialCommentCount = 0,
}: UserActivityTabsProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const tabs: TabItem[] = [
    {
      id: 'posts',
      label: '작성글',
      icon: <FileText className="h-3 w-3" aria-hidden="true" />,
      count: initialPostCount,
      href: `/user/${publicId}`,
    },
    {
      id: 'comments',
      label: '댓글',
      icon: <MessageSquare className="h-3 w-3" aria-hidden="true" />,
      count: initialCommentCount,
      href: `/user/${publicId}?tab=comments`,
    },
  ];
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;

    const tab = tabs.find((item) => item.id === tabId);
    if (tab?.href) {
      router.push(tab.href);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-b-lg md:border md:border-black/7 md:dark:border-0 md:border-t-0 overflow-hidden">
        <TabList
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="contained"
          showCount
          className="mb-0"
        />

        <PostList
          posts={posts}
          showBoard={true}
          currentBoardId=""
          currentPage={currentPage}
          emptyMessage={
            activeTab === 'posts'
              ? '작성한 게시글이 없습니다.'
              : '댓글 단 게시글이 없습니다.'
          }
          className="!bg-transparent border-0 rounded-none"
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        mode="url"
        withMargin={true}
      />
    </>
  );
}
