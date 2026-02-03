import HotdealTabToggleClient from './HotdealTabToggleClient';
import HotdealPostItem from './HotdealPostItem';
import type { HotdealPostsData, HotdealSidebarPost, HotdealTabType } from '../types/hotdeal';

interface HotdealTabsServerProps {
  postsData: HotdealPostsData;
}

/**
 * 핫딜 게시글 목록 서버 컴포넌트
 *
 * - 특정 탭의 게시글 목록을 서버에서 렌더링
 */
function PostList({ posts, tabType }: { posts: HotdealSidebarPost[]; tabType: HotdealTabType }) {
  if (posts.length === 0) {
    return (
      <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
        핫딜이 없습니다.
      </div>
    );
  }

  return (
    <ul>
      {posts.map((post, index) => (
        <HotdealPostItem
          key={post.id}
          post={post}
          tabType={tabType}
          isLast={index === posts.length - 1}
        />
      ))}
    </ul>
  );
}

/**
 * 핫딜 탭 서버 컴포넌트
 *
 * 구조:
 * - 서버: 4개 탭의 게시글 목록 HTML 렌더링 (LCP 최적화)
 * - 클라이언트: pathname 체크 + 탭 전환만 담당
 *
 * 렌더링 흐름:
 * 1. 서버에서 4개 탭(hot, discount, likes, comments)의 HTML 생성
 * 2. HotdealTabToggleClient가 pathname 체크 + 탭 전환 기능 제공
 * 3. 클라이언트는 서버 HTML을 그대로 show/hide만 처리
 */
export default function HotdealTabsServer({ postsData }: HotdealTabsServerProps) {
  return (
    <HotdealTabToggleClient
      windowDays={postsData.windowDays}
      defaultTab="hot"
      hotContent={<PostList posts={postsData.hot || []} tabType="hot" />}
      discountContent={<PostList posts={postsData.discount || []} tabType="discount" />}
      likesContent={<PostList posts={postsData.likes || []} tabType="likes" />}
      commentsContent={<PostList posts={postsData.comments || []} tabType="comments" />}
    />
  );
}
