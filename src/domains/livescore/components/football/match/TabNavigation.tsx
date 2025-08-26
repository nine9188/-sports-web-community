'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMatchData } from './context/MatchDataContext';
import Tabs, { TabItem } from '@/shared/ui/tabs';

// 모바일 체크 훅
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
}

interface TabNavigationProps {
  activeTab?: string | null;
}

/**
 * 매치 탭 네비게이션 컴포넌트
 * 이벤트, 라인업, 통계, 순위, 응원 탭을 제공합니다.
 */
export default function TabNavigation({ activeTab }: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentTab, setCurrentTab } = useMatchData();
  const isMobile = useIsMobile();
  
  // 기본 탭을 디바이스에 따라 결정
  const defaultTab = activeTab || (isMobile ? 'support' : 'power');
  
  // 현재 활성화된 탭 표시를 위한 상태
  const [currentTabUI, setCurrentTabUI] = useState(defaultTab);
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'support', label: '응원', mobileOnly: true },
    { id: 'power', label: '전력' },
    { id: 'events', label: '이벤트' },
    { id: 'lineups', label: '라인업' },
    { id: 'stats', label: '통계' },
    { id: 'standings', label: '순위' }
  ];
  
  // activeTab이 변경되면 currentTabUI와 isChangingTab 상태를 업데이트
  useEffect(() => {
    const tabToUse = activeTab || (isMobile ? 'support' : 'power');
    setCurrentTab(tabToUse);
    setCurrentTabUI(tabToUse);
    setIsChangingTab(false);
  }, [activeTab, setCurrentTab, isMobile]);
  
  // 탭 변경 처리 - useCallback으로 최적화
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이면 이동하지 않음
    if (tabId === currentTab || isChangingTab) return;
    
    // UI 먼저 업데이트
    setCurrentTabUI(tabId);
    setIsChangingTab(true);
    
    // 컨텍스트 상태 업데이트
    setCurrentTab(tabId);
    
    // 현재 URL 파라미터 복사
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    const defaultTabForDevice = isMobile ? 'support' : 'power';
    if (tabId === defaultTabForDevice) {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', tabId);
    }
    
    // URL 변경
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false }); // scroll: false로 불필요한 스크롤 방지
    
    // 로딩 상태는 페이지 전환 완료 후 자동으로 해제됨
  }, [router, pathname, searchParams, currentTab, setCurrentTab, isChangingTab, isMobile]);
  
  return (
    <Tabs
      tabs={tabs}
      activeTab={currentTabUI}
      onTabChange={handleTabChange}
      isChangingTab={isChangingTab}
    />
  );
} 