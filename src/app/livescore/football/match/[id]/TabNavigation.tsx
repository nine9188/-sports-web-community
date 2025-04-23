'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TabType } from '../types';

interface TabItem {
  id: TabType;
  label: string;
}

const tabs: TabItem[] = [
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' }
];

export default function TabNavigation({ matchId }: { matchId: string }) {
  const pathname = usePathname();
  
  // 현재 경로에서 활성화된 탭 추출
  const [currentTab, setCurrentTab] = useState<TabType>('events');
  
  // 첫 렌더링 시 URL에서 현재 탭을 결정
  useEffect(() => {
    if (pathname.includes('/events')) {
      setCurrentTab('events');
    } else if (pathname.includes('/lineups')) {
      setCurrentTab('lineups');
    } else if (pathname.includes('/stats')) {
      setCurrentTab('stats');
    } else if (pathname.includes('/standings')) {
      setCurrentTab('standings');
    } else {
      setCurrentTab('events');
    }
  }, [pathname]);
  
  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: TabType) => {
    if (tabId === currentTab) return;
    
    // 로컬 스토리지에 선택한 탭 저장
    localStorage.setItem('activeMatchTab', tabId);
    
    // 클라이언트 사이드 전체 페이지 이동
    window.location.href = `/livescore/football/match/${matchId}/${tabId}`;
  }, [matchId, currentTab]);
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
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
        })}
      </div>
    </div>
  );
} 