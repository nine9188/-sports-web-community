import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import LeagueStandings from '@/domains/sidebar/components/league/LeagueStandings';
import { RightSidebar } from '@/domains/sidebar/components';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import { getFullUserData } from '@/shared/actions/user';
import SiteLayoutClient from './SiteLayoutClient';
import { siteConfig } from '@/shared/config';

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
  // 서버 컴포넌트에서 데이터 fetch (DB만, 외부 API 제거)
  const [fullUserData, headerBoardsData] = await Promise.all([
    getFullUserData(),
    getBoardsForNavigation({ includeTotalPostCount: true }),
  ]);

  // 컴포넌트 생성
  const boardNav = <BoardNavigation />;
  const authSection = <AuthSection userData={fullUserData} />;
  const leagueStandingsComponent = <LeagueStandings initialLeague="premier" />;

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
        rightSidebar={<RightSidebar />}
        authSection={authSection}
        leagueStandingsComponent={leagueStandingsComponent}
        fullUserData={fullUserData}
        headerBoards={headerBoardsData.boardData}
        headerIsAdmin={headerBoardsData.isAdmin}
        headerTotalPostCount={headerBoardsData.totalPostCount}
      >
        {children}
      </SiteLayoutClient>
    </>
  );
}
