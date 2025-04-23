'use client';

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
  
  // 현재 활성화된 탭 확인
  const currentTab = pathname.includes('/squad') 
    ? 'squad'
    : pathname.includes('/standings')
    ? 'standings'
    : pathname.includes('/stats')
    ? 'stats'
    : pathname.includes('/overview')
    ? 'overview'
    : 'overview';
  
  // 탭 변경 처리
  const handleTabChange = (tabId: string) => {
    router.push(`/livescore/football/team/${teamId}/${tabId}`);
  };
  
  return (
    <div className="mb-4">
      <div className="mb-4 bg-white rounded-lg border overflow-hidden flex">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex-1 ${
                isActive
                  ? 'text-blue-600 border-b-3 border-blue-600 font-semibold'
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