import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import TopicTabToggleClient from './TopicTabToggleClient';
import TopicPostItem from './TopicPostItem';
import type { TopicPostsData, TopicPost, TabType } from '../types';

interface TopicTabsServerProps {
  postsData: TopicPostsData;
}

/**
 * 게시글 목록 서버 컴포넌트
 *
 * - 특정 탭의 게시글 목록을 서버에서 렌더링
 */
function PostList({ posts, tabType }: { posts: TopicPost[]; tabType: TabType }) {
  if (posts.length === 0) {
    return (
      <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
        게시글이 없습니다.
      </div>
    );
  }

  return (
    <ul>
      {posts.map((post, index) => (
        <TopicPostItem
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
 * 인기글 탭 서버 컴포넌트
 *
 * 구조:
 * - 서버: 4개 탭의 게시글 목록 HTML 렌더링 (LCP 최적화)
 * - 클라이언트: 탭 전환만 담당
 *
 * 렌더링 흐름:
 * 1. 서버에서 4개 탭(hot, views, likes, comments)의 HTML 생성
 * 2. TopicTabToggleClient가 탭 전환 기능 제공
 * 3. 클라이언트는 서버 HTML을 그대로 show/hide만 처리
 */
export default function TopicTabsServer({ postsData }: TopicTabsServerProps) {
  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      {/* 헤더 - 서버 렌더링 */}
      <ContainerHeader className="justify-between">
        <ContainerTitle>인기글</ContainerTitle>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {postsData.windowDays ? `최근 ${postsData.windowDays}일 기준` : '최근 24시간 기준'}
        </span>
      </ContainerHeader>

      {/* 탭 + 콘텐츠 */}
      <TopicTabToggleClient
        defaultTab="hot"
        hotContent={<PostList posts={postsData.hot || []} tabType="hot" />}
        viewsContent={<PostList posts={postsData.views || []} tabType="views" />}
        likesContent={<PostList posts={postsData.likes || []} tabType="likes" />}
        commentsContent={<PostList posts={postsData.comments || []} tabType="comments" />}
      />
    </Container>
  );
}
