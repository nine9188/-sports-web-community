import React, { Suspense } from 'react';
import { headers } from 'next/headers';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import { RightSidebar } from '@/domains/sidebar/components';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import SiteLayoutClient from './SiteLayoutClient';

/**
 * Suspense fallback: 우측 사이드바 (CLS 방지용 빈 영역)
 * RightSidebar의 hidden xl:block w-[300px] 구조를 유지
 */
function RightSidebarSkeleton() {
  return <aside className="hidden xl:block w-[300px] shrink-0" />;
}

/**
 * (site) Route Group Layout
 *
 * 메인 사이트 레이아웃 - 헤더, 사이드바, 푸터 포함
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // User-Agent로 모바일 감지 (RightSidebar는 xl:1280px+ 에서만 보이므로 모바일에서 fetch 스킵)
  // 이미 getBoardsForNavigation()이 cookies()를 호출하여 dynamic이므로 headers() 추가 비용 없음
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobilePhone = /iPhone|Android.*Mobile|Windows Phone/i.test(userAgent);
  // 봇이면 RightSidebar 스킵 (API-Sports 쿼타 보호 - 미들웨어에서 설정)
  const isBot = headersList.get('x-is-bot') === '1';

  // 서버 컴포넌트에서 게시판 데이터만 fetch (유저 데이터는 클라이언트에서 로드)
  const headerBoardsData = await getBoardsForNavigation({ includeTotalPostCount: true });

  // 컴포넌트 생성 - layout에서 가져온 데이터를 전달
  const boardNav = (
    <BoardNavigation
      boardData={headerBoardsData.boardData}
      totalPostCount={headerBoardsData.totalPostCount}
    />
  );
  return (
    <>
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
        headerTotalPostCount={headerBoardsData.totalPostCount}
        isMobilePhone={isMobilePhone}
      >
        {children}
      </SiteLayoutClient>
    </>
  );
}
