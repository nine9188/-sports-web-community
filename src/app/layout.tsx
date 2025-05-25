import './globals.css';
import { Inter } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';
import { getHeaderUserData, getBoardsForNavigation } from '@/domains/layout/actions';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import { fetchStandingsData } from '@/domains/sidebar/actions/football';
import LeagueStandings from '@/domains/sidebar/components/league/LeagueStandings';
import { RightSidebar } from '@/domains/sidebar/components';
import { Suspense } from 'react';

// 로딩 스켈레톤 컴포넌트
function RightSidebarSkeleton() {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="h-full pt-4">
        <div className="mb-4 bg-white rounded-lg border animate-pulse">
          <div className="px-3 py-2 border-b">
            <div className="h-5 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="px-3 py-2 border-b">
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center py-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// 동적 렌더링 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Inter 폰트 정의를 전역 CSS 클래스로 사용
const inter = Inter({ subsets: ['latin'] });

// 메타데이터 설정
export const metadata = {
  title: 'SPORTS 커뮤니티',
  description: '스포츠 팬들을 위한 커뮤니티 플랫폼',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 헤더 컴포넌트를 위한 사용자 데이터 가져오기
  const headerUserData = await getHeaderUserData();
  
  // 게시판 데이터 가져오기 (헤더 네비게이션용)
  const boardsResult = await getBoardsForNavigation();
  
  // AuthSection 컴포넌트 생성 - 이제 서버 컴포넌트이므로 props 불필요
  const authSection = <AuthSection />;
  
  // 서버 컴포넌트에서 BoardNavigation 생성
  const boardNav = <BoardNavigation />;

  // 서버 컴포넌트에서 축구 순위 데이터 가져오기
  const standingsData = await fetchStandingsData('premier').catch(error => {
    console.error('축구 순위 데이터 가져오기 실패:', error);
    return null;
  });

  // 리그 순위 컴포넌트 생성
  const leagueStandingsComponent = <LeagueStandings initialLeague="premier" initialStandings={standingsData} />;

  return (
    <html lang="ko" className={`w-full h-full ${inter.className}`} suppressHydrationWarning>
      <head />
      <body className="w-full h-full overflow-x-hidden">
        <RootLayoutClient 
          boardNavigation={boardNav}
          rightSidebar={
            <Suspense fallback={<RightSidebarSkeleton />}>
              <RightSidebar />
            </Suspense>
          }
          authSection={authSection}
          leagueStandingsComponent={leagueStandingsComponent}
          headerUserData={headerUserData}
          boardsData={boardsResult.boardData || []}
        >
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}