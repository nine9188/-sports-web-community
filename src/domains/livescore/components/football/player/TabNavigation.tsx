'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { TabList, type TabItem } from '@/shared/components/ui';

interface PlayerTabNavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onTabIntent?: (tabId: string) => void;
}

export default function PlayerTabNavigation({
  activeTab = 'stats',
  onTabChange,
  onTabIntent,
}: PlayerTabNavigationProps) {
  const pathname = usePathname();
  const [currentTabUI, setCurrentTabUI] = useState(activeTab);
  const [isChangingTab, setIsChangingTab] = useState(false);

  const tabs: TabItem[] = [
    { id: 'stats', label: '\uC120\uC218 \uD1B5\uACC4', href: pathname },
    { id: 'fixtures', label: '\uACBD\uAE30\uBCC4 \uD1B5\uACC4', href: `${pathname}?tab=fixtures` },
    { id: 'rankings', label: '\uC21C\uC704', href: `${pathname}?tab=rankings` },
    { id: 'transfers', label: '\uC774\uC801 \uAE30\uB85D', href: `${pathname}?tab=transfers` },
    { id: 'injuries', label: '\uBD80\uC0C1 \uAE30\uB85D', href: `${pathname}?tab=injuries` },
    { id: 'trophies', label: '\uD2B8\uB85C\uD53C', href: `${pathname}?tab=trophies` },
  ];

  useEffect(() => {
    setCurrentTabUI(activeTab);
    setIsChangingTab(false);
  }, [activeTab]);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab || isChangingTab) return;

    setCurrentTabUI(tabId);
    setIsChangingTab(true);
    onTabChange?.(tabId);

    setTimeout(() => {
      setIsChangingTab(false);
    }, 100);
  }, [activeTab, isChangingTab, onTabChange]);

  return (
    <TabList
      tabs={tabs}
      activeTab={currentTabUI}
      onTabChange={handleTabChange}
      onTabIntent={onTabIntent}
      isChangingTab={isChangingTab}
    />
  );
}
