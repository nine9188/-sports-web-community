'use client';

import TabSelector from './TabSelector';
import { TabType } from '../types';

// 클라이언트 컴포넌트 래퍼
interface TabSelectorWrapperProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabSelectorWrapper({ activeTab, onTabChange }: TabSelectorWrapperProps) {
  return (
    <TabSelector onTabChange={onTabChange} initialTab={activeTab} />
  );
} 