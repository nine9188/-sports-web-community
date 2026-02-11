import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import { RightSidebar } from '@/domains/sidebar/components';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import SiteLayoutClient from './SiteLayoutClient';
import { siteConfig } from '@/shared/config';

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

  // 서버 컴포넌트에서 게시판 데이터만 fetch (유저 데이터는 클라이언트에서 로드)
  const headerBoardsData = await getBoardsForNavigation({ includeTotalPostCount: true });

  // 컴포넌트 생성 - layout에서 가져온 데이터를 전달
  const boardNav = (
    <BoardNavigation
      boardData={headerBoardsData.boardData}
      totalPostCount={headerBoardsData.totalPostCount}
    />
  );
  // 서버에서 렌더링되는 로고 (LCP 최적화)
  const serverLogo = (
    <div
      id="server-logo-placeholder"
      className="fixed top-0 left-0 z-[60] bg-white dark:bg-[#1D1D1D] md:hidden"
    >
      <div className="h-16 px-4 flex items-center">
        <Link href="/">
          <Image
            src={siteConfig.logo}
            alt="로고"
            width={275}
            height={200}
            priority
            fetchPriority="high"
            className="h-10 w-auto dark:invert"
          />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {serverLogo}
      <SiteLayoutClient
        boardNavigation={boardNav}
        rightSidebar={
          isMobilePhone ? (
            <RightSidebarSkeleton />
          ) : (
            <Suspense fallback={<RightSidebarSkeleton />}>
              <RightSidebar />
            </Suspense>
          )
        }
        headerBoards={headerBoardsData.boardData}
        headerTotalPostCount={headerBoardsData.totalPostCount}
      >
        {children}
      </SiteLayoutClient>
    </>
  );
}
