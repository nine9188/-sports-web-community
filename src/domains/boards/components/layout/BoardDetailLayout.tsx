'use client';

import React from 'react';
import BoardBreadcrumbs from '../common/BoardBreadcrumbs';
import BoardTeamInfo from '../board/BoardTeamInfo';
import LeagueInfo from '../board/LeagueInfo';
import ClientHoverMenu from '../common/ClientHoverMenu';
import PostList from '../post/PostList';
import BoardPagination from '../common/BoardPagination';
import { Breadcrumb } from '../../types/board/data';
import { Board, ChildBoardsMap } from '../../types/board';

// 여기에 Post 타입 정의
interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  comment_count: number;
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
  fromParam?: string;
  childBoardsMap: ChildBoardsMap;
  rootBoardId: string;
  rootBoardSlug?: string;
  // 서버에서 미리 로드한 게시글 데이터
  posts: Post[];
  // HoverMenu를 위한 데이터
  topBoards?: TopBoard[];
  hoverChildBoardsMap?: Record<string, ChildBoard[]>;
}

export default function BoardDetailLayout({
  boardData,
  breadcrumbs,
  teamData,
  leagueData,
  isLoggedIn,
  currentPage,
  slug,
  fromParam,
  rootBoardId,
  rootBoardSlug,
  posts,
  topBoards,
  hoverChildBoardsMap
}: BoardDetailLayoutProps) {
  return (
    <div className="container mx-auto">
      <div className="sm:mt-0 mt-2">
        <BoardBreadcrumbs breadcrumbs={breadcrumbs} />
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
        <ClientHoverMenu
          currentBoardId={boardData.id}
          rootBoardId={rootBoardId}
          rootBoardSlug={rootBoardSlug}
          currentBoardSlug={slug}
          fromParam={fromParam}
          prefetchedData={{
            topBoards: topBoards,
            childBoardsMap: hoverChildBoardsMap,
            isServerFetched: true
          }}
        />
      )}

      <div className="mt-2 rounded-lg">
        {/* 미리 로드된 게시글 데이터로 PostList 렌더링 */}
        <PostList
          posts={posts}
          loading={false}
          currentBoardId={boardData.id}
          showBoard={true}
          className="mb-4"
          emptyMessage="아직 작성된 게시글이 없습니다."
        />
        
        <div className="flex justify-center mt-2">
          <BoardPagination 
            currentPage={currentPage} 
            totalPages={Math.ceil((boardData.views || 0) / 20)}
            boardSlug={slug}
          />
        </div>
      </div>
    </div>
  );
} 