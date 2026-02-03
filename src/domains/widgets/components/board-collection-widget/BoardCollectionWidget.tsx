import BoardTabToggleClient from './BoardTabToggleClient';
import BoardPostItem from './BoardPostItem';
import { getBoardSettings, getBoardsWithPosts, getPostsMetadata } from './actions';
import { formatBoardPosts } from './utils';
import { BoardCollectionData } from './types';

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

  return (
    <div className="grid grid-cols-2">
      {/* 왼쪽 열: 1~10번 */}
      <div className="flex flex-col border-r border-black/5 dark:border-white/10">
        {posts.slice(0, POSTS_PER_PAGE).map((post, index) => (
          <BoardPostItem
            key={post.id}
            post={post}
            isLast={index === POSTS_PER_PAGE - 1}
          />
        ))}
      </div>

      {/* 오른쪽 열: 11~20번 */}
      <div className="flex flex-col">
        {posts.slice(POSTS_PER_PAGE, POSTS_PER_PAGE * 2).map((post, index) => (
          <BoardPostItem
            key={post.id}
            post={post}
            isLast={index === POSTS_PER_PAGE - 1}
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

  return (
    <>
      {posts.slice(0, POSTS_PER_PAGE).map((post, index) => (
        <BoardPostItem
          key={post.id}
          post={post}
          isLast={index === POSTS_PER_PAGE - 1 || index === posts.length - 1}
        />
      ))}
    </>
  );
}

/**
 * 게시판 모음 위젯 (서버 컴포넌트)
 *
 * 구조:
 * - 서버: 모든 게시판의 게시글 목록 HTML 렌더링 (LCP 최적화)
 * - 클라이언트: 탭 전환 + 페이지네이션만 담당
 *
 * 렌더링 흐름:
 * 1. 서버에서 각 게시판별 게시글 목록 HTML 생성
 * 2. BoardTabToggleClient가 탭 전환 기능 제공
 * 3. 클라이언트는 서버 HTML을 그대로 show/hide만 처리
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

  // 서버에서 모든 탭 콘텐츠 사전 렌더링
  const tabs = boardsData.map((data) => ({
    id: data.board.id,
    name: data.board.name,
    desktopContent: <DesktopPostList posts={data.recentPosts} />,
    mobileContent: <MobilePostList posts={data.recentPosts} />,
  }));

  return <BoardTabToggleClient tabs={tabs} defaultTabIndex={0} />;
}
