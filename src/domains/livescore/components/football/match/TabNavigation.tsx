'use client';

import { useCallback } from 'react';
import { TabList, type TabItem } from '@/shared/components/ui';

interface TabNavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const tabs: TabItem[] = [
  { id: 'support', label: '응원', mobileOnly: true },
  { id: 'power', label: '전력' },
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' }
];

export default function TabNavigation({ activeTab = 'power', onTabChange }: TabNavigationProps) {
  // 탭 변경 처리 - 부모 컴포넌트에게 알림
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    onTabChange?.(tabId);
  }, [activeTab, onTabChange]);

  return (
    <TabList
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
} 