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

// 탭 목록 - 상수로 분리
const TABS: TabItem[] = [
  { id: 'overview', label: '개요' },
  { id: 'standings', label: '순위' },
  { id: 'squad', label: '선수단' },
  { id: 'stats', label: '통계' }
];

// 타입 정의
type TabId = 'overview' | 'standings' | 'squad' | 'stats';

export default function TabNavigation({ teamId, activeTab = 'overview' }: TabNavigationProps) {
  const router = useRouter();
  
  // 로딩 상태를 위한 하나의 상태로 단순화
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // activeTab이 변경되면 로딩 상태 초기화
  useEffect(() => {
    setIsChangingTab(false);
  }, [activeTab]);
  
  // 탭 변경 처리 함수
  const handleTabChange = useCallback((tabId: TabId) => {
    // 같은 탭이거나 이미 탭 변경 중이면 무시
    if (tabId === activeTab || isChangingTab) return;
    
    // 탭 변경 상태 설정
    setIsChangingTab(true);
    
    // 경로 결정 - 개요 탭은 쿼리 파라미터 없이 기본 경로 사용
    const path = tabId === 'overview'
      ? `/livescore/football/team/${teamId}`
      : `/livescore/football/team/${teamId}?tab=${tabId}`;
    
    // 페이지 전환
    router.push(path);
  }, [router, teamId, activeTab, isChangingTab]);
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabId)}
              className={`
                px-4 py-3 text-sm font-medium flex-1 transition-colors
                ${isActive 
                  ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
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