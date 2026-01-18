'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMatchData, TabType } from './context/MatchDataContext';
import { TabList, type TabItem } from '@/shared/components/ui';

interface TabNavigationProps {
  activeTab?: string | null;
}

const tabs: TabItem[] = [
  { id: 'support', label: '응원', mobileOnly: true },
  { id: 'power', label: '전력' },
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' }
];

export default function TabNavigation({ activeTab }: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentTab, setCurrentTab } = useMatchData();

  // activeTab prop이 변경되면 컨텍스트 상태 동기화
  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab as TabType);
    }
  }, [activeTab, setCurrentTab]);

  // 탭 변경 처리
  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId as TabType);

    const params = new URLSearchParams(searchParams?.toString() || '');

    // power가 기본 탭이므로 power일 때는 파라미터 제거
    if (tabId === 'power') {
      params.delete('tab');
    } else {
      params.set('tab', tabId);
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false });
  };

  return (
    <TabList
      tabs={tabs}
      activeTab={currentTab}
      onTabChange={handleTabChange}
    />
  );
} 