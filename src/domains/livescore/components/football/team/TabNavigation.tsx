'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

interface TabNavigationProps {
  teamId: string;
  activeTab?: string;
}

interface TabItem {
  id: string;
  label: string;
}

// 탭 목록
const tabs: TabItem[] = [
  { id: 'overview', label: '개요' },
  { id: 'standings', label: '순위' },
  { id: 'squad', label: '선수단' },
  { id: 'stats', label: '통계' }
];

export default function TabNavigation({ teamId, activeTab = 'overview' }: TabNavigationProps) {
  const router = useRouter();
  
  // 현재 활성화된 탭 표시를 위한 상태
  const [currentTabUI, setCurrentTabUI] = useState(activeTab);
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // 현재 활성화된 탭 확인
  const currentTab = activeTab || 'overview';
  
  // activeTab이 변경되면 currentTabUI와 isChangingTab 상태를 업데이트
  useEffect(() => {
    setCurrentTabUI(activeTab);
    setIsChangingTab(false);
  }, [activeTab]);
  
  // 탭 변경 처리 - useCallback으로 최적화
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이면 이동하지 않음
    if (tabId === currentTab || isChangingTab) return;
    
    // UI 먼저 업데이트
    setCurrentTabUI(tabId);
    setIsChangingTab(true);
    
    // 페이지 전환
    if (tabId === 'overview') {
      router.push(`/livescore/football/team/${teamId}`);
    } else {
      router.push(`/livescore/football/team/${teamId}?tab=${tabId}`);
    }
    
    // 로딩 상태는 페이지 전환 완료 후 자동으로 해제됨
  }, [router, teamId, currentTab, isChangingTab]);
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10">
        {tabs.map((tab) => {
          const isActive = currentTabUI === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex-1 ${
                isActive
                  ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={isChangingTab}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
} 