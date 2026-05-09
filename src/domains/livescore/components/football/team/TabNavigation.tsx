'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TabList, type TabItem } from '@/shared/components/ui';

interface TabNavigationProps {
  teamId: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function TabNavigation({
  teamId,
  activeTab = 'overview',
  onTabChange,
}: TabNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs: TabItem[] = useMemo(() => {
    const basePath = pathname || `/livescore/football/team/${teamId}`;

    return [
      { id: 'overview', label: '\uAC1C\uC694', href: basePath },
      { id: 'fixtures', label: '\uACBD\uAE30', href: `${basePath}?tab=fixtures` },
      { id: 'standings', label: '\uC21C\uC704', href: `${basePath}?tab=standings` },
      { id: 'squad', label: '\uC120\uC218\uB2E8', href: `${basePath}?tab=squad` },
      { id: 'transfers', label: '\uC774\uC801', href: `${basePath}?tab=transfers` },
      { id: 'stats', label: '\uD1B5\uACC4', href: `${basePath}?tab=stats` },
    ];
  }, [pathname, teamId]);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    if (onTabChange) {
      onTabChange(tabId);
      return;
    }

    const tab = tabs.find((item) => item.id === tabId);
    if (tab?.href) {
      router.push(tab.href);
    }
  }, [activeTab, onTabChange, router, tabs]);

  return (
    <TabList
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
}
