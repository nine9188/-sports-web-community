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
  // overview/* 경로도 처리하도록 수정
  const currentTabPath = pathname;
  
  // 현재 활성화된 탭 확인 (기본 경로와 /overview 경로 모두 처리)
  const currentTab = currentTabPath.includes('/squad') 
    ? 'squad'
    : currentTabPath.includes('/standings')
    ? 'standings'
    : currentTabPath.includes('/stats')
    ? 'stats'
    : 'overview'; // 기본값은 항상 overview

  // 탭 컨텐츠 렌더링 (삼항 연산자를 if문으로 풀어서 작성)
  if (currentTab === 'overview' && overview) {
    return <>{overview}</>;
  }
  
  if (currentTab === 'squad' && squad) {
    return <>{squad}</>;
  }
  
  if (currentTab === 'standings' && standings) {
    return <>{standings}</>;
  }
  
  if (currentTab === 'stats' && stats) {
    return <>{stats}</>;
  }
  
  // 아무 것도 매칭되지 않으면 오버뷰 보여주기
  return <>{overview}</>;
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