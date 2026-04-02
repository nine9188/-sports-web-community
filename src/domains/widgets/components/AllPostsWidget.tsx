import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { fetchPosts, PostsResponse } from '@/domains/boards/actions';
import { getNotices } from '@/domains/boards/actions/posts/notices';
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
    // getNotices()는 포맷팅된 데이터 반환 (board_slug, author_nickname 등 포함)
    const [postsData, globalNotices] = await Promise.all([
      initialData ? Promise.resolve(initialData) : fetchAllPostsData(),
      getNotices(),  // 전체 공지 (포맷팅된 데이터)
    ]);

    // LCP 최적화: 게시글이 없으면 렌더링하지 않음
    if (!postsData.data || postsData.data.length === 0) {
      return null;
    }

    // show_in_widget이 true인 공지만 필터링
    const allNoticeData = globalNotices as Array<Record<string, unknown>>;
    const noticeData = allNoticeData.filter(notice => notice.show_in_widget === true);
    const noticePosts = noticeData.map(notice => ({
      id: notice.id as string,
      title: notice.title as string,
      board_id: (notice.board_id as string) || '',
      board_name: (notice.board_name as string) || '공지',
      board_slug: (notice.board_slug as string) || '',
      post_number: (notice.post_number as number) || 0,
      created_at: (notice.created_at as string) || '',
      views: (notice.views as number) || 0,
      likes: (notice.likes as number) || 0,
      author_nickname: (notice.author_nickname as string) || '관리자',
      author_id: (notice.user_id as string) || '',
      author_public_id: (notice.author_public_id as string | null) || null,
      author_level: (notice.author_level as number) || 1,
      author_icon_url: (notice.author_icon_url as string | null) || null,
      comment_count: (notice.comment_count as number) || 0,
      formattedDate: (notice.formattedDate as string) || '',
      is_notice: true,
      notice_type: (notice.notice_type as 'global' | 'board' | null) || 'global',
      is_must_read: (notice.is_must_read as boolean) || false,
    }));

    // 공지 + 게시글 합침 (공지가 앞, 중복 제거)
    const noticeIds = new Set(noticePosts.map(n => n.id));
    const filteredPosts = postsData.data.filter(post => !noticeIds.has(post.id));
    const combinedPosts = [...noticePosts, ...filteredPosts];

    // 헤더 컨텐츠 렌더링
    const headerContent = (
      <div className="w-full h-full flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">최신 게시글</h2>
        <Link
          href="/boards/all"
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5"
        >
          전체글 보기
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );

    return (
      <div className="h-full">
        <PostList
          posts={combinedPosts}
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