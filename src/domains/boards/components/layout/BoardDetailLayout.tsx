'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import BoardBreadcrumbs from '../common/BoardBreadcrumbs';
import BoardTeamInfo from '../board/BoardTeamInfo';
import LeagueInfo from '../board/LeagueInfo';
import BoardPopularPosts from '../board/BoardPopularPosts';
import ClientHoverMenu from '../common/ClientHoverMenu';
import PostList from '../post/PostList';
import PopularPostList from '../post/PopularPostList';
import ShopPagination from '@/domains/shop/components/ShopPagination';
import { NoticeList } from '../notice';
import { Breadcrumb } from '../../types/board/data';
import { Board } from '../../types/board';
import type { Post as NoticePost } from '@/domains/boards/types/post';

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

// PopularPost 타입 정의
interface PopularPost {
  id: string;
  title: string;
  board_slug: string;
  board_name: string;
  post_number: number;
  likes: number;
  views: number;
  comment_count: number;
  author_nickname: string;
  author_id?: string;
  author_level?: number;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  created_at: string;
  formattedDate?: string;
  team_id?: string | number | null;
  league_id?: string | number | null;
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
  // 페이지네이션 메타
  pagination?: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
  };
  // 인기 게시글 데이터
  popularPosts?: {
    todayPosts: PopularPost[];
    weekPosts: PopularPost[];
  };
  // 공지사항 데이터
  notices?: NoticePost[];
  // 커스텀 필터 컴포넌트 (인기글 기간 필터 등)
  filterComponent?: React.ReactNode;
  // 리스트 스타일 타입 (기본: text, 카드형: card)
  listVariant?: 'text' | 'card';
}

// 메모이제이션된 컴포넌트들
const MemoizedBoardBreadcrumbs = memo(BoardBreadcrumbs);
const MemoizedPostList = memo(PostList);
const MemoizedClientHoverMenu = memo(ClientHoverMenu);
const MemoizedShopPagination = memo(ShopPagination);
const MemoizedBoardPopularPosts = memo(BoardPopularPosts);
const MemoizedNoticeList = memo(NoticeList);

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
  hoverChildBoardsMap,
  pagination,
  popularPosts,
  notices,
  filterComponent,
  listVariant = 'text'
}: BoardDetailLayoutProps) {
  // view_type이 타입에 없더라도 안전하게 읽어서 분기
  const viewType = (boardData as unknown as { view_type?: 'list' | 'image-table' })?.view_type;

  return (
    <div className="container mx-auto overflow-x-hidden" data-current-page={currentPage}>
      <div>
        <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      {teamData && (
        <div className="mb-4 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm overflow-hidden">
          <BoardTeamInfo
            teamData={teamData}
            boardId={boardData.id}
            boardSlug={slug}
            isLoggedIn={isLoggedIn}
            className=""
          />
          {/* 공지사항 - TeamInfo 바로 아래 붙임 */}
          {notices && notices.length > 0 && (
            <MemoizedNoticeList notices={notices} standalone={false} />
          )}
        </div>
      )}

      {leagueData && (
        <div className="mb-4 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm overflow-hidden">
          <LeagueInfo
            leagueData={leagueData}
            boardId={boardData.id}
            boardSlug={slug}
            isLoggedIn={isLoggedIn}
            className=""
          />
          {/* 공지사항 - LeagueInfo 바로 아래 붙임 */}
          {notices && notices.length > 0 && (
            <MemoizedNoticeList notices={notices} standalone={false} />
          )}
        </div>
      )}

      {/* 팀/리그 정보가 없는 게시판: 게시판 이름 + 공지사항 통합 */}
      {!teamData && !leagueData && (
        <div className="mb-4 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-0 rounded-lg shadow-sm overflow-hidden">
          {/* 게시판 헤더 */}
          <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <h2 className="text-sm font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{boardData.name}</h2>
            {isLoggedIn && (
              <Link
                href={`/boards/${slug}/create`}
                aria-label="글쓰기"
                title="글쓰기"
                className="p-2 rounded-full hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors flex-shrink-0"
              >
                <PenLine className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
              </Link>
            )}
          </div>

          {/* 공지사항 - 헤더 바로 아래 붙임 */}
          {notices && notices.length > 0 && (
            <MemoizedNoticeList notices={notices} standalone={false} />
          )}
        </div>
      )}

      {/* 커스텀 필터 컴포넌트 (예: 인기글 기간 필터) */}
      {filterComponent && (
        <div className="mb-4">
          {filterComponent}
        </div>
      )}

      {/* 인기 게시글 위젯 - 공지사항 아래 표시 */}
      {popularPosts && (popularPosts.todayPosts.length > 0 || popularPosts.weekPosts.length > 0) && (
        <MemoizedBoardPopularPosts
          todayPosts={popularPosts.todayPosts}
          weekPosts={popularPosts.weekPosts}
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

      {/* 게시글 목록 - listVariant에 따라 다른 컴포넌트 렌더링 */}
      {/* 공지사항 게시판은 NoticeList 사용 */}
      {(slug === 'notice' || slug === 'notices') ? (
        <MemoizedNoticeList
          notices={posts as unknown as NoticePost[]}
          showBoardName={true}
          emptyMessage="아직 공지사항이 없습니다."
        />
      ) : listVariant === 'card' ? (
        <PopularPostList
          posts={posts}
          loading={false}
          emptyMessage="아직 작성된 게시글이 없습니다."
        />
      ) : (
        <MemoizedPostList
          posts={posts}
          loading={false}
          currentBoardId={boardData.id}
          showBoard={true}
          className="mt-2 overflow-x-hidden"
          emptyMessage="아직 작성된 게시글이 없습니다."
          variant={viewType === 'image-table' ? 'image-table' : 'text'}
        />
      )}

      {/* 페이지네이션 & 글쓰기 버튼 영역 */}
      {(pagination && Math.ceil(pagination.totalItems / pagination.itemsPerPage) > 1) || isLoggedIn ? (
        <div className="flex items-center justify-between mt-4 px-4 sm:px-0">
          {/* 페이지네이션 (중앙) */}
          <div className="flex-1 flex justify-center">
            {pagination && Math.ceil(pagination.totalItems / pagination.itemsPerPage) > 1 && (
              <MemoizedShopPagination
                page={pagination.currentPage}
                pageSize={pagination.itemsPerPage}
                total={pagination.totalItems}
                withMargin={false}
              />
            )}
          </div>
          
          {/* 글쓰기 버튼 (오른쪽) */}
          {isLoggedIn && (
            <Link
              href={`/boards/${slug}/create`}
              className="flex items-center justify-center gap-1 px-3 py-2 border border-black/7 dark:border-0 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded text-sm transition-colors whitespace-nowrap ml-2 min-h-[36px]"
            >
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">글쓰기</span>
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
} 