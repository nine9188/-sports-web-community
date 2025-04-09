'use client';

import { useState } from 'react';
import TabSelector from './TabSelector';

// 클라이언트 컴포넌트 래퍼
interface TabSelectorWrapperProps {
  tabComponents: { [key: string]: React.ReactNode };
}

export default function TabSelectorWrapper({ tabComponents }: TabSelectorWrapperProps) {
  const [activeTab, setActiveTab] = useState('events');

  return (
    <>
      <TabSelector onTabChange={setActiveTab} initialTab="events" />
      {tabComponents[activeTab]}
    </>
  );
} 