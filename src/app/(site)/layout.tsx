import React, { Suspense } from 'react';
import { headers } from 'next/headers';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import { RightSidebar } from '@/domains/sidebar/components';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import TotalPostCountValue from '@/domains/layout/components/TotalPostCountValue';
import SiteLayoutClient from './SiteLayoutClient';
import { TeamLeagueProvider } from '@/shared/context/TeamLeagueContext';
import { getAllTeams, getAllLeagues } from '@/domains/livescore/actions/teamLeagueData';

/**
 * Suspense fallback: 우측 사이드바 (CLS 방지용 빈 영역)
 */
function RightSidebarSkeleton() {
  return <aside className="hidden xl:block w-[300px] shrink-0" />;
}

/**
 * 전체글 개수 스트리밍 슬롯
 *
 * 레이아웃 blocking await 경로에서 분리됨.
 * - fallback: 간단한 placeholder dash
 * - 실제 count가 도착하면 그 자리를 교체 (스트리밍)
 */
function TotalPostCountStreamingSlot() {
  return (
    <Suspense fallback={<span aria-hidden>…</span>}>
      <TotalPostCountValue />
    </Suspense>
  );
}

/**
 * (site) Route Group Layout
 *
 * 메인 사이트 레이아웃 - 헤더, 사이드바, 푸터 포함
 *
 * 성능 전략:
 * - 게시판 계층 구조는 getCachedAllBoards() (unstable_cache 7일)로 사실상 즉시 반환
 * - 전체글 개수는 Suspense 스트리밍으로 분리 → 레이아웃 블로킹 제거
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // User-Agent로 모바일 감지 (RightSidebar는 xl:1280px+ 에서만 보이므로 모바일에서 fetch 스킵)
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobilePhone = /iPhone|Android.*Mobile|Windows Phone/i.test(userAgent);
  // 봇이면 RightSidebar 스킵 (API-Sports 쿼타 보호 - 미들웨어에서 설정)
  const isBot = headersList.get('x-is-bot') === '1';

  // 캐시 히트 시 < 1ms — 블로킹 비용 거의 없음
  const [headerBoardsData, teams, leagues] = await Promise.all([
    getBoardsForNavigation(),
    getAllTeams(),
    getAllLeagues(),
  ]);

  // 헤더/모바일 메뉴/사이드바에서 공유하는 count 스트리밍 슬롯
  const totalPostCountSlot = <TotalPostCountStreamingSlot />;

  // 사이드바용 BoardNavigation — 내부의 '전체글' 옆 카운트 자리를 슬롯으로 주입
  const boardNav = (
    <BoardNavigation
      boardData={headerBoardsData.boardData}
      totalPostCountSlot={totalPostCountSlot}
    />
  );

  return (
    <TeamLeagueProvider teams={teams} leagues={leagues}>
      <SiteLayoutClient
        boardNavigation={boardNav}
        rightSidebar={
          isMobilePhone || isBot ? (
            <RightSidebarSkeleton />
          ) : (
            <Suspense fallback={<RightSidebarSkeleton />}>
              <RightSidebar />
            </Suspense>
          )
        }
        headerBoards={headerBoardsData.boardData}
        headerTotalPostCountSlot={totalPostCountSlot}
        isMobilePhone={isMobilePhone}
      >
        {children}
      </SiteLayoutClient>
    </TeamLeagueProvider>
  );
}
