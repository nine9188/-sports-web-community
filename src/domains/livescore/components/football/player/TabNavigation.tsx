'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();

  const tabs: TabItem[] = useMemo(() => [
    { id: 'stats', label: '\uC120\uC218 \uD1B5\uACC4', href: pathname },
    { id: 'fixtures', label: '\uACBD\uAE30\uBCC4 \uD1B5\uACC4', href: `${pathname}?tab=fixtures` },
    { id: 'rankings', label: '\uC21C\uC704', href: `${pathname}?tab=rankings` },
    { id: 'transfers', label: '\uC774\uC801 \uAE30\uB85D', href: `${pathname}?tab=transfers` },
    { id: 'injuries', label: '\uBD80\uC0C1 \uAE30\uB85D', href: `${pathname}?tab=injuries` },
    { id: 'trophies', label: '\uD2B8\uB85C\uD53C', href: `${pathname}?tab=trophies` },
  ], [pathname]);

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
      onTabIntent={onTabIntent}
    />
  );
}
