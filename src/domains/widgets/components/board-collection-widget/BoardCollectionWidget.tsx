import React from 'react';
import BoardCollectionWidgetClient from './BoardCollectionWidgetClient';
import { getBoardSettings, getBoardsWithPosts, getPostsMetadata } from './actions';
import { formatBoardPosts } from './utils';
import { BoardCollectionData } from './types';

/**
 * 게시판 모음 위젯 (서버 컴포넌트)
 *
 * 설정된 게시판들의 최신 게시글을 보여줍니다.
 * - 각 게시판당 최대 20개 게시글
 * - 댓글 수, 팀/리그 로고 포함
 */
export default async function BoardCollectionWidget() {
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
  const boardsData: BoardCollectionData[] = boardsWithPosts.map(({ board, posts }) => ({
    board,
    recentPosts: formatBoardPosts(posts, board, metadata),
    popularPosts: [], // deprecated
    featuredImages: [] // deprecated
  }));

  return <BoardCollectionWidgetClient boardsData={boardsData} />;
}
