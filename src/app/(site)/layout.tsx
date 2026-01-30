import React from 'react';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import LeagueStandings from '@/domains/sidebar/components/league/LeagueStandings';
import { RightSidebar } from '@/domains/sidebar/components';
import { getBoardsForNavigation } from '@/domains/layout/actions';
import { getFullUserData } from '@/shared/actions/user';
import SiteLayoutClient from './SiteLayoutClient';

/**
 * (site) Route Group Layout
 *
 * 메인 사이트의 헤더, 사이드바, 푸터를 포함하는 레이아웃입니다.
 * Supabase DB 쿼리만 수행하며, 외부 API는 호출하지 않습니다.
 *
 * 404나 에러 페이지는 이 레이아웃을 사용하지 않으므로 API 호출이 발생하지 않습니다.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // 서버 컴포넌트에서 데이터 fetch (Supabase만 - 외부 API 없음!)
  const [fullUserData, headerBoardsData] = await Promise.all([
    getFullUserData(),
    getBoardsForNavigation({ includeTotalPostCount: true }),
  ]);

  // 컴포넌트 생성
  const boardNav = <BoardNavigation />;
  const authSection = <AuthSection userData={fullUserData} />;
  const leagueStandingsComponent = <LeagueStandings initialLeague="premier" />;

  return (
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
  );
}
