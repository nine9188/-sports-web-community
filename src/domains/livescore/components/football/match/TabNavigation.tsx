'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMatchData, TabType } from './context/MatchDataContext';

interface TabNavigationProps {
  activeTab?: string;
}

interface TabItem {
  id: TabType;
  label: string;
  mobileOnly?: boolean; // 모바일에서만 표시할 탭 표시
}

// 탭 목록
const tabs: TabItem[] = [
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' },
  { id: 'support', label: '응원', mobileOnly: true } // 모바일에서만 표시
];

export default function TabNavigation({ activeTab = 'events' }: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentTab, setCurrentTab, tabsData } = useMatchData();
  
  // 현재 활성화된 탭 표시를 위한 상태
  const [currentTabUI, setCurrentTabUI] = useState(activeTab);
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // activeTab이 변경되면 currentTabUI와 isChangingTab 상태를 업데이트
  useEffect(() => {
    setCurrentTab(activeTab);
    setCurrentTabUI(activeTab);
    setIsChangingTab(false);
  }, [activeTab, setCurrentTab]);
  
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
    
    if (tabId === 'events') {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', tabId);
    }
    
    // URL 변경
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false }); // scroll: false로 불필요한 스크롤 방지
    
    // 로딩 상태는 페이지 전환 완료 후 자동으로 해제됨
  }, [router, pathname, searchParams, currentTab, setCurrentTab, isChangingTab]);
  
  // 화면 크기에 따라 표시할 탭 필터링
  const visibleTabs = tabs.filter(tab => {
    // mobileOnly 탭은 xl 이하에서만 표시
    if (tab.mobileOnly) {
      return true; // CSS로 제어할 예정
    }
    return true;
  });
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const isActive = currentTabUI === tab.id;
          // 해당 탭이 이미 로드되었는지 확인 (tabsData에 데이터가 있으면 로드된 것으로 간주)
          const isLoaded = !!tabsData[tab.id];
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              } ${isLoaded ? 'loaded-tab' : ''} ${
                tab.mobileOnly ? 'xl:hidden' : ''
              }`}
              aria-current={isActive ? 'page' : undefined}
              data-loaded={isLoaded ? 'true' : 'false'}
              disabled={isChangingTab}
            >
              {tab.label}
              {isChangingTab && isActive && (
                <span className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full bg-blue-200"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 