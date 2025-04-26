'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface TabItem {
  id: string;
  label: string;
}

// 탭 이름 순서 변경 (TeamTabs와 일치)
const tabs: TabItem[] = [
  { id: 'overview', label: '개요' },
  { id: 'standings', label: '순위' },
  { id: 'squad', label: '선수단' },
  { id: 'stats', label: '통계' }
];

export default function TabNavigation({ teamId }: { teamId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentTab, setCurrentTab] = useState('overview');
  
  // 첫 렌더링 및 pathname 변경 시 현재 탭 업데이트
  useEffect(() => {
    // 현재 활성화된 탭 확인
    const extractTabFromPathname = () => {
      if (pathname.includes('/squad')) return 'squad';
      if (pathname.includes('/standings')) return 'standings';
      if (pathname.includes('/stats')) return 'stats';
      if (pathname.includes('/overview')) return 'overview';
      return 'overview';
    };
    
    const tab = extractTabFromPathname();
    setCurrentTab(tab);
    
    // 네비게이션 상태 초기화
    setIsNavigating(false);
  }, [pathname]);
  
  // 탭 변경 처리 - 최적화
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === currentTab || isNavigating) return;
    
    // 중복 클릭 방지
    setIsNavigating(true);
    
    // Next.js 클라이언트 라우팅 사용
    router.push(`/livescore/football/team/${teamId}/${tabId}`);
  }, [teamId, currentTab, router, isNavigating]);
  
  // 탭 버튼 UI 메모이제이션
  const tabButtons = useMemo(() => {
    return tabs.map((tab) => {
      const isActive = currentTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={`px-4 py-3 text-sm font-medium flex-1 ${
            isActive
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          } ${isNavigating ? 'cursor-wait' : 'cursor-pointer'}`}
          aria-current={isActive ? 'page' : undefined}
          disabled={isNavigating}
        >
          {tab.label}
        </button>
      );
    });
  }, [currentTab, handleTabChange, isNavigating]);
  
  return (
    <div className="mb-4">
      <div className="mb-4 bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10">
        {tabButtons}
      </div>
    </div>
  );
} 