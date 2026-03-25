import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { fetchPosts, PostsResponse } from '@/domains/boards/actions';
import PostList from '@/domains/boards/components/post/PostList';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

/**
 * 최신 게시글 데이터를 가져오는 함수 (병렬 fetch용)
 * page.tsx에서 Promise.all로 호출 가능
 */
export async function fetchAllPostsData(): Promise<PostsResponse> {
  return fetchPosts({
    limit: 10,
    page: 1
    // boardIds를 지정하지 않으면 모든 게시판에서 가져옴
  });
}

interface AllPostsWidgetProps {
  /** 미리 fetch된 데이터 (병렬 fetch 시 사용) */
  initialData?: PostsResponse;
}

// 서버 컴포넌트로 변경 - 직접 데이터 로드
export default async function AllPostsWidget({ initialData }: AllPostsWidgetProps = {}) {
  try {
    // initialData가 제공되면 바로 사용, 없으면 자체 fetch
    const postsData = initialData ?? await fetchAllPostsData();

    // LCP 최적화: 게시글이 없으면 렌더링하지 않음
    if (!postsData.data || postsData.data.length === 0) {
      return null;
    }

    // 헤더 컨텐츠 렌더링 - 오른쪽에 > 아이콘 추가
    const headerContent = (
      <div className="w-full h-full flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">최신 게시글</h3>
        <Link
          href="/boards/all"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="더 많은 게시글 보기"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    );

    return (
      <div className="h-full">
        <PostList
          posts={postsData.data}
          loading={false} // 로딩 상태는 항상 false (서버 컴포넌트에서 데이터 로드 완료 후 렌더링)
          emptyMessage="아직 게시글이 없습니다."
          headerContent={headerContent}
          showBoard={true}
          // 🔧 높이 제한 완전 제거 - 모든 게시글이 완전히 보이도록
          currentBoardId="all" // 모든 게시판을 의미하는 ID
          className="h-full"
        />
      </div>
    );
  } catch (error) {
    console.error('AllPostsWidget 데이터 로딩 오류:', error);

    // 오류 발생 시 기본 UI 표시
    return (
      <Container className="h-full bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>최신 게시글</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="text-center">
          <p className="text-gray-500 dark:text-gray-400">게시글을 불러오는 중 오류가 발생했습니다.</p>
        </ContainerContent>
      </Container>
    );
  }
} 