import React, { memo } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import BoardBreadcrumbs from "../common/BoardBreadcrumbs";
import BoardTeamInfo from "../board/BoardTeamInfo";
import LeagueInfo from "../board/LeagueInfo";
import BoardDescriptionHeader from "../board/BoardDescriptionHeader";
import BoardPopularPosts from "../board/BoardPopularPosts";
import ClientHoverMenu from "../common/ClientHoverMenu";
import PostList from "../post/PostList";
import PopularPostList from "../post/PopularPostList";
import { Container, Pagination } from "@/shared/components/ui";
import { NoticeList, type NoticeListPost } from "../notice";
import { StoreFilterMenu } from "../hotdeal";
import BoardSearchBar from "../board/BoardSearchBar";
import { isHotdealBoard } from "../../utils/hotdeal";
import { Breadcrumb } from "../../types/board/data";
import { Board } from "../../types/board";
import ResponsiveKakaoAd from "@/shared/components/ResponsiveKakaoAd";
import { KAKAO } from "@/shared/constants/ad-constants";
import type { LayoutPost, PopularPost } from "@/domains/boards/types/post";
import RecentlyVisitedBoardEffect from "./RecentlyVisitedBoardEffect";

// LayoutPost를 Post로 alias (기존 코드 호환)
type Post = LayoutPost;

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
  isAdmin?: boolean;
  canWrite?: boolean;
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
    weekPosts: PopularPost[];
    monthPosts: PopularPost[];
  };
  // 공지사항 데이터
  notices?: NoticeListPost[];
  // 커스텀 필터 컴포넌트 (인기글 기간 필터 등)
  filterComponent?: React.ReactNode;
  // 리스트 스타일 타입 (기본: text, 카드형: card)
  listVariant?: "text" | "card";
  // 뷰 타입 (DB의 view_type)
  viewType?: "text" | "image-table" | "list";
  // 검색어 (검색 모드일 때)
  searchQuery?: string;
  // 4590 표준: 이미지 Storage URL
  teamLogoUrl?: string;
  leagueLogoUrl?: string;
  leagueLogoUrlDark?: string;
}

// 메모이제이션된 컴포넌트들
const MemoizedBoardBreadcrumbs = memo(BoardBreadcrumbs);
const MemoizedPostList = memo(PostList);
const MemoizedClientHoverMenu = memo(ClientHoverMenu);
const MemoizedPagination = memo(Pagination);
const MemoizedBoardPopularPosts = memo(BoardPopularPosts);
const MemoizedNoticeList = memo(NoticeList);

export default function BoardDetailLayout({
  boardData,
  breadcrumbs,
  teamData,
  leagueData,
  isLoggedIn,
  isAdmin = false,
  canWrite,
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
  listVariant = "text",
  viewType: propViewType,
  searchQuery,
  // 4590 표준: 이미지 Storage URL
  teamLogoUrl,
  leagueLogoUrl,
  leagueLogoUrlDark,
}: BoardDetailLayoutProps) {
  const viewType = propViewType || boardData.view_type;
  const canWritePost = canWrite ?? (isLoggedIn && (slug !== 'notice' || isAdmin));

  const hasBreadcrumbs = breadcrumbs.length > 0;

  const kakaoAdBanner = (
    <>
      <div className="hidden md:flex justify-center mb-4">
        <ResponsiveKakaoAd adUnit={KAKAO.POST_PC_BANNER} adWidth={728} adHeight={90} minWidth={768} />
      </div>
      <div className="md:hidden flex justify-center mb-4">
        <ResponsiveKakaoAd adUnit={KAKAO.MOBILE_BANNER} adWidth={320} adHeight={100} maxWidth={767} />
      </div>
    </>
  );

  return (
    <div className="container mx-auto" data-current-page={currentPage}>
      <RecentlyVisitedBoardEffect
        id={boardData.id}
        slug={boardData.slug || boardData.id}
        name={boardData.name}
      />
      {/* 1. 정보 헤더 통합 카드 (최상단 배치) */}
      {teamData && (
        <Container className="bg-white dark:bg-[#1D1D1D] mb-4 overflow-visible">
          {hasBreadcrumbs && (
            <div className="h-6 px-4 flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5]/30 dark:bg-[#262626]/30">
              <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} plain small />
            </div>
          )}
          <BoardTeamInfo
            teamData={teamData}
            boardId={boardData.id}
            boardSlug={slug}
            isLoggedIn={canWritePost}
            className=""
            teamLogoUrl={teamLogoUrl}
            description={boardData.description}
          />
        </Container>
      )}

      {leagueData && (
        <Container className="bg-white dark:bg-[#1D1D1D] mb-4 overflow-visible">
          {hasBreadcrumbs && (
            <div className="h-6 px-4 flex items-center border-b border-black/5 dark:border-white/10 bg-[#F5F5F5]/30 dark:bg-[#262626]/30">
              <MemoizedBoardBreadcrumbs breadcrumbs={breadcrumbs} plain small />
            </div>
          )}
          <LeagueInfo
            leagueData={leagueData}
            boardId={boardData.id}
            boardSlug={slug}
            isLoggedIn={canWritePost}
            className=""
            leagueLogoUrl={leagueLogoUrl}
            leagueLogoUrlDark={leagueLogoUrlDark}
            description={boardData.description}
          />
        </Container>
      )}

      {!teamData && !leagueData && (
        <Container className="bg-white dark:bg-[#1D1D1D] mb-4 overflow-visible">
          <BoardDescriptionHeader
            boardId={boardData.id}
            name={boardData.name}
            slug={slug}
            description={boardData.description}
            canWritePost={canWritePost}
            defaultCollapsed={false}
            breadcrumbs={breadcrumbs}
            plain={true}
          />
        </Container>
      )}

      {/* 2. 광고 배너 */}
      {hasBreadcrumbs && kakaoAdBanner}

      {/* 3. 커스텀 필터 컴포넌트 & 베스트 인기글 위젯 */}
      {filterComponent && <div className="mb-4">{filterComponent}</div>}
      {popularPosts && (
        <MemoizedBoardPopularPosts
          weekPosts={popularPosts.weekPosts}
          monthPosts={popularPosts.monthPosts}
          className="mb-4"
        />
      )}

      {/* 4. 공지사항 (독립된 카드 형태로 헤더/광고/베스트 뒤에 렌더링) */}
      {notices && notices.length > 0 && (
        <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
          <MemoizedNoticeList notices={notices} standalone={false} />
        </Container>
      )}

      {/* 5. 호버 메뉴 - 클라이언트 컴포넌트로 전환 (독립된 카드) */}
      {topBoards && hoverChildBoardsMap && (
        <MemoizedClientHoverMenu
          currentBoardId={boardData.id}
          rootBoardId={rootBoardId}
          rootBoardSlug={rootBoardSlug}
          prefetchedData={{
            topBoards: topBoards,
            childBoardsMap: hoverChildBoardsMap,
            isServerFetched: true,
          }}
        />
      )}

      {/* 쇼핑몰 필터 메뉴 - 핫딜 게시판일 때만 표시 */}
      {isHotdealBoard(slug) && <StoreFilterMenu />}

      {/* 게시글 목록 - listVariant에 따라 다른 컴포넌트 렌더링 */}
      {/* 공지사항 게시판 및 하부 게시판은 NoticeList 사용 */}
      {slug === "notice" || slug === "notices" || rootBoardSlug === "notice" || rootBoardSlug === "notices" ? (
        <MemoizedNoticeList
          notices={posts}
          showBoardName={true}
          emptyMessage="아직 공지사항이 없습니다."
        />
      ) : listVariant === "card" ? (
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
          variant={viewType === "image-table" ? "image-table" : "text"}
        />
      )}

      {/* 검색바 */}
      <div className="mt-4 px-4 sm:px-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-1/2">
          <BoardSearchBar slug={slug} />
        </div>
        {canWritePost && (
          <Link
            href={`/boards/${slug}/create`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded text-[13px] font-medium transition-colors whitespace-nowrap min-h-[36px] shadow-sm"
            prefetch={false}
          >
            <PenLine className="h-3.5 w-3.5 text-white" />
            <span className="inline">글쓰기</span>
          </Link>
        )}
      </div>

      {/* 검색 결과 표시 */}
      {searchQuery && (
        <div className="mt-2 px-4 sm:px-0 text-[13px] text-gray-600 dark:text-gray-400">
          <span className="font-medium">&apos;{searchQuery}&apos;</span> 검색
          결과: {pagination?.totalItems || 0}건
        </div>
      )}

      {/* 페이지네이션 영역 */}
      {pagination &&
      Math.ceil(pagination.totalItems / pagination.itemsPerPage) > 1 ? (
        <div className="flex items-center justify-center px-4 sm:px-0 mt-4">
          <MemoizedPagination
            currentPage={pagination.currentPage}
            totalPages={Math.ceil(
              pagination.totalItems / pagination.itemsPerPage,
            )}
            mode="url"
            withMargin={false}
          />
        </div>
      ) : null}
    </div>
  );
}
