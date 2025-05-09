'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMatchData, TabType } from './context/MatchDataContext';

interface TabNavigationProps {
  activeTab?: string;
}

interface TabItem {
  id: TabType;
  label: string;
}

// 탭 목록
const tabs: TabItem[] = [
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' }
];

export default function TabNavigation({ activeTab = 'events' }: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentTab, setCurrentTab, tabsData } = useMatchData();
  
  // 현재 활성화된 탭 확인
  const currentTabValue = activeTab || 'events';
  
  // 이전 URL을 추적하는 ref
  const prevUrlRef = useRef<string>('');
  
  // 탭 변경 중 여부를 추적하는 ref
  const isChangingTabRef = useRef<boolean>(false);
  
  // URL을 통한 탭 초기화 (외부에서 URL이 변경된 경우)
  useEffect(() => {
    // 현재 URL 생성
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // 이전 URL과 다르고, 탭 변경 중이 아니면 컨텍스트 상태 업데이트
    if (prevUrlRef.current !== currentUrl && !isChangingTabRef.current) {
      setCurrentTab(activeTab);
      prevUrlRef.current = currentUrl;
    }
    
    // 탭 변경 중 플래그 리셋
    isChangingTabRef.current = false;
  }, [activeTab, pathname, searchParams, setCurrentTab]);
  
  // 탭 변경 처리 - useCallback으로 최적화
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이면 아무 작업도 하지 않음
    if (tabId === currentTab) return;
    
    // 탭 변경 중 플래그 설정
    isChangingTabRef.current = true;
    
    // 먼저 컨텍스트 상태 업데이트
    setCurrentTab(tabId);
    
    // 현재 URL 파라미터 복사
    const params = new URLSearchParams(searchParams.toString());
    
    if (tabId === 'events') {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', tabId);
    }
    
    // URL 변경
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    prevUrlRef.current = newUrl; // 이전 URL 업데이트
    router.push(newUrl, { scroll: false }); // scroll: false로 불필요한 스크롤 방지
    
    // 데이터 로드는 이제 TabContent 컴포넌트에서 처리되므로 여기서는 제거
  }, [router, pathname, searchParams, currentTab, setCurrentTab]);
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = currentTabValue === tab.id;
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
              } ${isLoaded ? 'loaded-tab' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              data-loaded={isLoaded ? 'true' : 'false'}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
} 