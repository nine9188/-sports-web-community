'use client';

import { usePathname } from 'next/navigation';

// 현재 선택된 탭에 따라 컨텐츠를 렌더링하는 클라이언트 컴포넌트
function TabContent({ 
  overview, 
  squad, 
  standings, 
  stats,
  pathname
}: { 
  overview: React.ReactNode;
  squad: React.ReactNode;
  standings: React.ReactNode;
  stats: React.ReactNode;
  pathname: string;
}) {
  // 현재 활성화된 탭 확인
  const currentTab = pathname.includes('/squad') 
    ? 'squad'
    : pathname.includes('/standings')
    ? 'standings'
    : pathname.includes('/stats')
    ? 'stats'
    : 'overview';

  return (
    <>
      {currentTab === 'overview' && overview}
      {currentTab === 'squad' && squad}
      {currentTab === 'standings' && standings}
      {currentTab === 'stats' && stats}
    </>
  );
}

export default function TabContentWrapper({
  overview,
  squad,
  standings,
  stats
}: {
  overview: React.ReactNode;
  squad: React.ReactNode;
  standings: React.ReactNode;
  stats: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <TabContent
      overview={overview}
      squad={squad}
      standings={standings}
      stats={stats}
      pathname={pathname}
    />
  );
} 