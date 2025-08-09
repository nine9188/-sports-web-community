'use client';

import React, { memo } from 'react';
import BoardBreadcrumbs from '../common/BoardBreadcrumbs';
import BoardTeamInfo from '../board/BoardTeamInfo';
import LeagueInfo from '../board/LeagueInfo';
import ClientHoverMenu from '../common/ClientHoverMenu';
import PostList from '../post/PostList';
import BoardPagination from '../common/BoardPagination';
import { Breadcrumb } from '../../types/board/data';
import { Board } from '../../types/board';

// 여기에 Post 타입 정의
interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count: number;
  content?: string;
  team_id?: number | null;
  team_name?: string | null;
  team_logo?: string | null;
  league_id?: number | null;
  league_name?: string | null;
  league_logo?: string | null;
}

// HoverMenu 관련 타입 정의
interface TopBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface ChildBoard {
  id: string;
  name: string;
  display_order: number;
  slug?: string;
}

interface TeamData {
  team: {
    id: number;
    name: string;
    country: string;
    founded: number;
    logo: string;
  };
  venue: {
    name: string;
    city: string;
    capacity: number;
  };
}

interface LeagueData {
  id: number;
  name: string;
  country: string;
  logo: string;
  type: string;
}

// BoardDetailLayout에 posts 데이터를 추가합니다
interface BoardDetailLayoutProps {
  boardData: Board;
  breadcrumbs: Breadcrumb[];
  teamData: TeamData | null;
  leagueData: LeagueData | null;
  isLoggedIn: boolean;
  currentPage: number;
  slug: string;
  rootBoardId: string;
  rootBoardSlug?: string;
  // 서버에서 미리 로드한 게시글 데이터
  posts: Post[];
  // HoverMenu를 위한 데이터
  topBoards?: TopBoard[];
  hoverChildBoardsMap?: Record<string, ChildBoard[]>;
}

// 메모이제이션된 컴포넌트들
const MemoizedBoardBreadcrumbs = memo(BoardBreadcrumbs);
const MemoizedPostList = memo(PostList);
const MemoizedBoardPagination = memo(BoardPagination);
const MemoizedClientHoverMenu = memo(ClientHoverMenu);

export default function BoardDetailLayout({
  boardData,
  breadcrumbs,
  teamData,
  leagueData,
  isLoggedIn,
  currentPage,
  slug,
  rootBoardId,
  rootBoardSlug,
  posts,
  topBoards,
  hoverChildBoardsMap
}: BoardDetailLayoutProps) {
  // view_type이 타입에 없더라도 안전하게 읽어서 분기
  const viewType = (boardData as unknown as { view_type?: 'list' | 'image-table' })?.view_type;

  return (
    <div className="container mx-auto">
      <div className="sm:mt-0 mt-4">
        <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      {teamData && (
        <BoardTeamInfo 
          teamData={teamData} 
          boardId={boardData.id}
          boardSlug={slug}
          isLoggedIn={isLoggedIn}
          className="mb-4"
        />
      )}
      
      {leagueData && (
        <LeagueInfo 
          leagueData={leagueData}
          boardId={boardData.id}
          boardSlug={slug}
          isLoggedIn={isLoggedIn}
          className="mb-4"
        />
      )}

      {/* 호버 메뉴 - 클라이언트 컴포넌트로 전환 */}
      {topBoards && hoverChildBoardsMap && (
        <MemoizedClientHoverMenu
          currentBoardId={boardData.id}
          rootBoardId={rootBoardId}
          rootBoardSlug={rootBoardSlug}
          prefetchedData={{
            topBoards: topBoards,
            childBoardsMap: hoverChildBoardsMap,
            isServerFetched: true
          }}
        />
      )}

      <div className="mt-2 rounded-lg">
        {/* 게시판 유형(view_type)에 따라 PostList 렌더링 분기 - 초기 스켈레톤 없이 바로 렌더 */}
        <MemoizedPostList
          posts={posts}
          loading={false}
          currentBoardId={boardData.id}
          showBoard={true}
          className="mb-4"
          emptyMessage="아직 작성된 게시글이 없습니다."
          variant={viewType === 'image-table' ? 'image-table' : 'text'}
        />
        
        <div className="flex justify-center mt-2 mb-4">
          <MemoizedBoardPagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((boardData.views || 0) / 20)}
            boardSlug={slug}
          />
        </div>
      </div>
    </div>
  );
} 