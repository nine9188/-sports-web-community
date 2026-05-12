import Link from 'next/link';
import { FileText, MessageSquare } from 'lucide-react';
import { Pagination } from '@/shared/components/ui/pagination';
import PostList from '@/domains/boards/components/post/postlist/PostListMain';
import type { Post } from '@/domains/boards/components/post/postlist/types';
import { cn } from '@/shared/utils/cn';

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
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const tabs = [
    {
      id: 'posts' as const,
      label: '작성글',
      icon: FileText,
      count: initialPostCount,
      href: `/user/${publicId}`,
    },
    {
      id: 'comments' as const,
      label: '댓글',
      icon: MessageSquare,
      count: initialCommentCount,
      href: `/user/${publicId}?tab=comments`,
    },
  ];

  return (
    <>
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-b-lg md:border md:border-black/7 md:dark:border-0 md:border-t-0 overflow-hidden">
        <div className="flex border-b border-black/5 dark:border-white/10 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'transition-colors py-2 px-2 h-auto flex items-center justify-center text-xs flex-1 whitespace-nowrap',
                  isActive
                    ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-brand-primary dark:border-brand-primary-dark'
                    : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
                )}
              >
                <Icon className="w-4 h-4 mr-1" />
                {tab.label}
                <span className="ml-1">({tab.count.toLocaleString()})</span>
              </Link>
            );
          })}
        </div>

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
