'use client';

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TabType } from '../types';

interface TabItem {
  id: TabType;
  label: string;
}

interface TabNavigationProps {
  matchId: string;
  activeTab: TabType;
  onTabChange: Dispatch<SetStateAction<TabType>>;
}

// 탭 목록
const tabs: TabItem[] = [
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' }
];

export default function TabNavigation({ matchId, activeTab, onTabChange }: TabNavigationProps) {
  const router = useRouter();
  
  // 탭 변경 핸들러 - URL도 함께 업데이트
  const handleTabChange = useCallback((tabId: TabType) => {
    if (tabId === activeTab) return;
    
    // 클라이언트 상태 업데이트
    onTabChange(tabId);
    
    // URL 쿼리 파라미터 업데이트 (서버 새로고침 없음)
    router.push(`/livescore/football/match/${matchId}?tab=${tabId}`, { scroll: false });
  }, [matchId, activeTab, router, onTabChange]);
  
  // 탭 버튼 UI 메모이제이션
  const tabButtons = useMemo(() => {
    return tabs.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium flex-1 ${
            isActive
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          {tab.label}
        </button>
      );
    });
  }, [activeTab, handleTabChange]);
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10">
        {tabButtons}
      </div>
    </div>
  );
} 