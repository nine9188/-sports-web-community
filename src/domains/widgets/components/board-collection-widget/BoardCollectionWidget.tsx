import BoardCollectionWidgetClient from './BoardCollectionWidgetClient';
import { getBoardSettings, getBoardsWithPosts, getPostsMetadata } from './actions';
import { formatBoardPosts } from './utils';
import { BoardCollectionData } from './types';

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
 * 게시판 모음 위젯 (서버 컴포넌트)
 *
 * 설정된 게시판들의 최신 게시글을 보여줍니다.
 * - 각 게시판당 최대 20개 게시글
 * - 댓글 수, 팀/리그 로고 포함
 * - LCP 최적화: 게시글이 없으면 렌더링하지 않음
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

  return <BoardCollectionWidgetClient boardsData={boardsData} />;
}
