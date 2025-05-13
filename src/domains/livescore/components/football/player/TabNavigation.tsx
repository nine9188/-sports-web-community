'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { usePlayerData, TabType } from './context/PlayerDataContext';

interface PlayerTabNavigationProps {
  activeTab?: string;
}

interface TabItem {
  id: TabType;
  label: string;
}

// 탭 목록
const tabs: TabItem[] = [
  { id: 'stats', label: '선수 통계' },
  { id: 'fixtures', label: '경기별 통계' },
  { id: 'rankings', label: '순위' },
  { id: 'transfers', label: '이적 기록' },
  { id: 'injuries', label: '부상 기록' },
  { id: 'trophies', label: '트로피' }
];

export default function PlayerTabNavigation({ activeTab = 'stats' }: PlayerTabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setCurrentTab, tabsData, loadPlayerData, playerId } = usePlayerData();
  
  // 현재 활성화된 탭 확인
  const currentTab = activeTab || 'stats';
  
  // 이전 URL을 추적하는 ref
  const prevUrlRef = useRef<string>('');
  
  // 탭 변경 중 여부를 추적하는 ref
  const isChangingTabRef = useRef<boolean>(false);
  
  // 탭 변경 진행 중 여부를 추적하는 ref
  const isTabChangeInProgressRef = useRef<boolean>(false);
  
  // URL을 통한 탭 초기화 (외부에서 URL이 변경된 경우)
  useEffect(() => {
    // 현재 URL 생성
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // 이전 URL과 다르고, 탭 변경 중이 아니면 컨텍스트 상태 업데이트
    if (prevUrlRef.current !== currentUrl && !isChangingTabRef.current) {
      // 현재 탭으로 설정하고 필요시 데이터 로드
      setCurrentTab(activeTab);
      
      // 이미 탭 변경 중이 아니고, 탭에 데이터가 없는 경우에만 데이터 로드
      if (playerId && !tabsData[activeTab as TabType]) {
        loadPlayerData(playerId, activeTab);
      }
      
      prevUrlRef.current = currentUrl;
    }
    
    // 탭 변경 중 플래그 리셋
    isChangingTabRef.current = false;
  }, [activeTab, pathname, searchParams, setCurrentTab, loadPlayerData, playerId, tabsData]);
  
  // 탭 변경 처리 - useCallback으로 최적화
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이면 아무 작업도 하지 않음
    if (tabId === currentTab) return;
    
    // 이미 탭 변경 중이면 추가 변경 요청 무시
    if (isTabChangeInProgressRef.current) return;
    
    // 탭 변경 진행 중 표시
    isTabChangeInProgressRef.current = true;
    
    console.log(`[TabNavigation] 탭 변경: ${currentTab} -> ${tabId}`);
    
    // 탭 변경 중 플래그 설정
    isChangingTabRef.current = true;
    
    // 먼저 컨텍스트 상태 업데이트
    setCurrentTab(tabId);
    
    // 현재 URL 파라미터 복사
    const params = new URLSearchParams(searchParams.toString());
    
    if (tabId === 'stats') {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', tabId);
    }
    
    // URL 변경
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    prevUrlRef.current = newUrl; // 이전 URL 업데이트
    
    // 현재 선수 ID가 있는 경우 새 탭의 데이터 로드
    // 해당 탭의 데이터가 없는 경우에만 로드
    if (playerId && !tabsData[tabId as TabType]) {
      console.log(`[TabNavigation] ${tabId} 탭 데이터 로드 요청`);
      loadPlayerData(playerId, tabId)
        .then(() => {
          console.log(`[TabNavigation] ${tabId} 탭 데이터 로드 완료`);
        })
        .catch(error => {
          console.error(`[TabNavigation] ${tabId} 탭 데이터 로드 실패:`, error);
        })
        .finally(() => {
          // 탭 변경 진행 완료
          isTabChangeInProgressRef.current = false;
        });
    } else {
      // 데이터가 이미 있는 경우 탭 변경 진행 완료 표시
      isTabChangeInProgressRef.current = false;
    }
    
    // URL 변경은 데이터 로드 여부와 관계없이 즉시 실행
    router.push(newUrl, { scroll: false }); // scroll: false로 불필요한 스크롤 방지
  }, [router, pathname, searchParams, currentTab, setCurrentTab, loadPlayerData, playerId, tabsData]);
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
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
                isTabChangeInProgressRef.current && isActive ? 'opacity-70' : ''
              }`}
              aria-current={isActive ? 'page' : undefined}
              data-loaded={isLoaded ? 'true' : 'false'}
              disabled={isTabChangeInProgressRef.current}
            >
              {tab.label}
              {isTabChangeInProgressRef.current && isActive && (
                <span className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full bg-blue-200"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 