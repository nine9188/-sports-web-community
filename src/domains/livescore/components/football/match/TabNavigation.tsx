'use client';

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { TabList, type TabItem } from '@/shared/components/ui';

interface TabNavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabIntent?: (tabId: string) => void;
}

export default function TabNavigation({ activeTab = 'power', onTabChange, onTabIntent }: TabNavigationProps) {
  const pathname = usePathname();
  const tabs = useMemo<TabItem[]>(() => [
    { id: 'support', label: '\uC751\uC6D0', mobileOnly: true, href: `${pathname}?tab=support` },
    { id: 'power', label: '\uC804\uB825', href: pathname },
    { id: 'events', label: '\uC774\uBCA4\uD2B8', href: `${pathname}?tab=events` },
    { id: 'lineups', label: '\uB77C\uC778\uC5C5', href: `${pathname}?tab=lineups` },
    { id: 'stats', label: '\uD1B5\uACC4', href: `${pathname}?tab=stats` },
    { id: 'standings', label: '\uC21C\uC704', href: `${pathname}?tab=standings` }
  ], [pathname]);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    onTabChange?.(tabId);
  }, [activeTab, onTabChange]);

  return (
    <TabList
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onTabIntent={onTabIntent}
    />
  );
}
