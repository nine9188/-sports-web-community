'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { usePlayerData } from './context/PlayerDataContext';
import Tabs, { TabItem } from '@/shared/ui/tabs';

interface PlayerTabNavigationProps {
  activeTab?: string;
}

/**
 * 선수 탭 네비게이션 컴포넌트
 * 통계, 경기별 통계, 순위, 이적 기록, 부상 기록, 트로피 탭을 제공합니다.
 */
export default function PlayerTabNavigation({ activeTab = 'stats' }: PlayerTabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setCurrentTab } = usePlayerData();
  
  // 현재 활성화된 탭 표시를 위한 상태
  const [currentTabUI, setCurrentTabUI] = useState(activeTab);
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'stats', label: '선수 통계' },
    { id: 'fixtures', label: '경기별 통계' },
    { id: 'rankings', label: '순위' },
    { id: 'transfers', label: '이적 기록' },
    { id: 'injuries', label: '부상 기록' },
    { id: 'trophies', label: '트로피' }
  ];
  
  // 현재 활성화된 탭 확인
  const currentTab = activeTab || 'stats';
  
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
    
    // 현재 URL 파라미터 복사 - searchParams가 null일 수 있으므로 안전하게 처리
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (tabId === 'stats') {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', tabId);
    }
    
    // URL 변경
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false }); // scroll: false로 불필요한 스크롤 방지
    
    // 로딩 상태는 페이지 전환 완료 후 자동으로 해제됨
  }, [router, pathname, searchParams, currentTab, setCurrentTab, isChangingTab]);
  
  return (
    <Tabs
      tabs={tabs}
      activeTab={currentTabUI}
      onTabChange={handleTabChange}
      isChangingTab={isChangingTab}
    />
  );
} 