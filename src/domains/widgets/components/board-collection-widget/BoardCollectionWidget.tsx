import BoardTabButtonsClient from './BoardTabButtonsClient';
import BoardPostItem from './BoardPostItem';
import { getBoardSettings, getBoardsWithPosts, getPostsMetadata } from './actions';
import { formatBoardPosts } from './utils';
import { BoardCollectionData } from './types';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

const POSTS_PER_PAGE = 10;

/**
 * 게시판 모음 데이터를 가져오는 함수 (병렬 fetch용)
 * page.tsx에서 Promise.all로 호출 가능
 */
export async function fetchBoardCollectionData(): Promise<BoardCollectionData[] | null> {
  // 1. 설정된 게시판 ID 목록 가져오기
  const boardIds = await getBoardSettings();
  if (boardIds.length === 0) {
    return null;
  }

  // 2. 게시판 정보 + 게시글 가져오기 (최적화된 쿼리)
  const boardsWithPosts = await getBoardsWithPosts(boardIds);
  if (boardsWithPosts.length === 0) {
    return null;
  }

  // 3. 메타데이터 가져오기 (댓글 수, 로고 등)
  const allPostIds = boardsWithPosts.flatMap(b => b.posts.map(p => p.id));
  const allBoardIds = [
    ...new Set(
      boardsWithPosts
        .flatMap(b => b.posts.map(p => p.board_id))
        .filter((id): id is string => id !== null)
    )
  ];
  const metadata = await getPostsMetadata(allPostIds, allBoardIds);

  // 4. 최종 데이터 포맷팅
  return boardsWithPosts.map(({ board, posts }) => ({
    board,
    recentPosts: formatBoardPosts(posts, board, metadata),
    popularPosts: [], // deprecated
    featuredImages: [] // deprecated
  }));
}

interface BoardCollectionWidgetProps {
  /** 미리 fetch된 데이터 (병렬 fetch 시 사용) */
  initialData?: BoardCollectionData[] | null;
}

/**
 * 빈 게시글 목록 컴포넌트
 */
function EmptyPostList() {
  return (
    <div className="flex justify-center items-center h-32 text-center">
      <p className="text-gray-500 dark:text-gray-400">아직 게시글이 없습니다.</p>
    </div>
  );
}

/**
 * 데스크톱 게시글 목록 (2열)
 */
function DesktopPostList({ posts }: { posts: BoardCollectionData['recentPosts'] }) {
  if (posts.length === 0) {
    return <EmptyPostList />;
  }

  const leftPosts = posts.slice(0, POSTS_PER_PAGE);
  const rightPosts = posts.slice(POSTS_PER_PAGE, POSTS_PER_PAGE * 2);

  return (
    <div className="grid grid-cols-2">
      {/* 왼쪽 열: 1~10번 */}
      <div className="flex flex-col border-r border-black/5 dark:border-white/10">
        {leftPosts.map((post, index) => (
          <BoardPostItem
            key={post.id}
            post={post}
            isLast={index === leftPosts.length - 1}
          />
        ))}
      </div>

      {/* 오른쪽 열: 11~20번 */}
      <div className="flex flex-col">
        {rightPosts.map((post, index) => (
          <BoardPostItem
            key={post.id}
            post={post}
            isLast={index === rightPosts.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 모바일 게시글 목록 (1열)
 */
function MobilePostList({ posts }: { posts: BoardCollectionData['recentPosts'] }) {
  if (posts.length === 0) {
    return <EmptyPostList />;
  }

  const displayPosts = posts.slice(0, POSTS_PER_PAGE);

  return (
    <div className="flex flex-col">
      {displayPosts.map((post, index) => (
        <BoardPostItem
          key={post.id}
          post={post}
          isLast={index === displayPosts.length - 1}
        />
      ))}
    </div>
  );
}

/**
 * 게시판 모음 위젯 (서버 컴포넌트)
 *
 * LCP 최적화 구조:
 * - 모든 탭 콘텐츠가 서버에서 렌더링됨 (클라이언트 경계 밖)
 * - 첫 번째 탭은 CSS로 즉시 표시 (하이드레이션 불필요)
 * - 클라이언트는 탭 버튼 + data-attribute 토글만 담당
 *
 * 결과: LCP가 JS 번들/하이드레이션과 무관하게 빠르게 확정됨
 */
export default async function BoardCollectionWidget({ initialData }: BoardCollectionWidgetProps = {}) {
  // initialData가 제공되면 바로 사용, 없으면 자체 fetch
  const boardsData = initialData !== undefined ? initialData : await fetchBoardCollectionData();

  // 데이터가 없으면 렌더링 안 함
  if (!boardsData || boardsData.length === 0) {
    return null;
  }

  // LCP 최적화: 첫 번째 게시판에 게시글이 없으면 렌더링하지 않음
  const firstBoardHasPosts = boardsData[0]?.recentPosts?.length > 0;
  if (!firstBoardHasPosts) {
    return null;
  }

  // 탭 정보 (클라이언트에 전달)
  const tabsInfo = boardsData.map((data) => ({
    id: data.board.id,
    name: data.board.name,
  }));

  return (
    <>
      {/* 데스크톱 버전 */}
      <Container className="hidden md:block bg-white dark:bg-[#1D1D1D]" data-board-collection="desktop">
        <ContainerHeader className="justify-between">
          <ContainerTitle>게시판</ContainerTitle>
        </ContainerHeader>

        {/* 탭 버튼 (클라이언트에서 렌더링 + onClick 전환) */}
        <BoardTabButtonsClient tabs={tabsInfo} variant="desktop" />

        {/* 모든 탭 콘텐츠 - 서버에서 렌더링, CSS로 show/hide */}
        {boardsData.map((data, index) => (
          <div
            key={data.board.id}
            data-tab-content={index}
            className={index === 0 ? 'block' : 'hidden'}
          >
            <DesktopPostList posts={data.recentPosts} />
          </div>
        ))}
      </Container>

      {/* 모바일 버전 */}
      <Container className="md:hidden bg-white dark:bg-[#1D1D1D]" data-board-collection="mobile">
        <ContainerHeader className="justify-between">
          <ContainerTitle>게시판</ContainerTitle>
        </ContainerHeader>

        {/* 탭 버튼 (클라이언트에서 렌더링 + onClick 전환) */}
        <BoardTabButtonsClient tabs={tabsInfo} variant="mobile" />

        {/* 모든 탭 콘텐츠 - 서버에서 렌더링, CSS로 show/hide */}
        {boardsData.map((data, index) => (
          <div
            key={data.board.id}
            data-tab-content={index}
            className={index === 0 ? 'block' : 'hidden'}
          >
            <MobilePostList posts={data.recentPosts} />
          </div>
        ))}
      </Container>
    </>
  );
}
