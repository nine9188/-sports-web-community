import './globals.css';
import { Inter } from 'next/font/google';
import RootLayoutClient from './RootLayoutClient';

import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import { fetchStandingsData } from '@/domains/sidebar/actions/football';
import LeagueStandings from '@/domains/sidebar/components/league/LeagueStandings';
import { RightSidebar } from '@/domains/sidebar/components';
import { getInitialSession } from '@/shared/api/supabaseServer';
import { getHeaderUserData, getBoardsForNavigation } from '@/domains/layout/actions';
import { fetchMultiDayMatches } from '@/domains/livescore/actions/footballApi';
import { generatePageMetadata } from '@/shared/utils/metadata';
import { Suspense } from 'react';

// 로딩 스켈레톤 컴포넌트
function RightSidebarSkeleton() {
  return (
    <aside className="hidden xl:block w-[300px] shrink-0">
      <div className="h-full pt-4">
        <div className="bg-white rounded-lg border animate-pulse">
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

// 동적 메타데이터 생성
export async function generateMetadata() {
  return await generatePageMetadata('/', {
    title: 'SPORTS 커뮤니티',
    description: '스포츠 팬들을 위한 커뮤니티 플랫폼',
  });
}

// 뷰포트 설정 - 모바일에서 확대/축소 방지
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 초기 세션 가져오기 (SSR 지원)
  const initialSession = await getInitialSession();
  
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

  // 헤더 데이터 및 라이브스코어 데이터 가져오기
  const [headerUserData, headerBoardsData, liveScoreData] = await Promise.all([
    getHeaderUserData(),
    getBoardsForNavigation(),
    fetchMultiDayMatches().catch(() => ({ success: false, data: null }))
  ]);

  return (
    <html lang="ko" className={`w-full h-full ${inter.className}`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="4590" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
      </head>
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
          initialSession={initialSession}
          headerUserData={headerUserData}
          headerBoards={headerBoardsData.boardData}
          headerIsAdmin={headerBoardsData.isAdmin}
          liveScoreData={liveScoreData}
        >
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}