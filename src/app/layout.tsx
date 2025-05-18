import './globals.css';
import { Inter } from 'next/font/google';
import RightSidebar from './components/RightSidebar';
import RootLayoutClient from './RootLayoutClient';
import { getUserProfile, getHeaderUserData } from '@/app/actions/auth-actions';
import BoardNavigation from '@/domains/sidebar/components/board/BoardNavigation';
import AuthSection from '@/domains/sidebar/components/auth/AuthSection';
import { fetchStandingsData } from '@/domains/sidebar/actions/football';
import LeagueStandings from '@/domains/sidebar/components/league/LeagueStandings';

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
  // 서버 컴포넌트에서 사용자 정보 가져오기
  const { user, profile } = await getUserProfile();
  
  // 헤더 컴포넌트를 위한 사용자 데이터 가져오기
  const headerUserData = await getHeaderUserData();
  
  // AuthSection 컴포넌트 생성 
  const authSection = <AuthSection userData={user} profileData={profile} />;
  
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
          rightSidebar={<RightSidebar />}
          authSection={authSection}
          headerUserData={headerUserData}
          leagueStandingsComponent={leagueStandingsComponent}
        >
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}