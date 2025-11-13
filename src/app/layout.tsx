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
import { generatePageMetadata } from '@/shared/utils/metadataNew';
import { getUIThemeSettings } from '@/domains/ui-theme/actions';
import Script from 'next/script';

// 동적 렌더링 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Inter 폰트 정의를 전역 CSS 클래스로 사용
const inter = Inter({ subsets: ['latin'] });

// 동적 메타데이터 생성 (DB에서 설정값 가져옴)
export async function generateMetadata() {
  const metadata = await generatePageMetadata('/');

  return {
    ...metadata,
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    manifest: '/site.webmanifest',
    appleWebApp: {
      capable: true,
      title: '4590',
      statusBarStyle: 'black-translucent',
    },
  };
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

  // 헤더 데이터 및 라이브스코어 데이터, UI 테마 설정 가져오기
  const [headerUserData, headerBoardsData, liveScoreData, uiTheme] = await Promise.all([
    getHeaderUserData(),
    getBoardsForNavigation(),
    fetchMultiDayMatches().catch(() => undefined),
    getUIThemeSettings()
  ]);

  // Tailwind 클래스를 CSS Variable 값으로 변환
  const borderRadiusMap: Record<string, string> = {
    'rounded-none': '0',
    'rounded-sm': '0.125rem',
    'rounded': '0.25rem',
    'rounded-md': '0.375rem',
    'rounded-lg': '0.5rem',
    'rounded-xl': '0.75rem',
    'rounded-2xl': '1rem',
    'rounded-3xl': '1.5rem',
    'rounded-full': '9999px'
  };

  const desktopRadius = borderRadiusMap[uiTheme.borderRadiusDesktop] || '0.5rem';
  const mobileRadius = borderRadiusMap[uiTheme.borderRadiusMobile] || '0';

  return (
    <html lang="ko" className={`w-full h-full ${inter.className}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
      </head>
      <body className="w-full h-full overflow-x-hidden">
        {/* UI 테마 CSS Variables 적용 */}
        <Script
          id="ui-theme-vars"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.documentElement.style.setProperty('--border-radius-desktop', '${desktopRadius}');
              document.documentElement.style.setProperty('--border-radius-mobile', '${mobileRadius}');
            `
          }}
        />
        <RootLayoutClient
          boardNavigation={boardNav}
          rightSidebar={<RightSidebar />}
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