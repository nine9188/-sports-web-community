'use client';

import { useState, useEffect } from 'react';
import { TabType } from '../types';

// 탭 정의
const tabs = [
  { id: 'events' as TabType, label: '이벤트' },
  { id: 'lineups' as TabType, label: '라인업' },
  { id: 'stats' as TabType, label: '통계' },
  { id: 'standings' as TabType, label: '순위' },
];

interface TabSelectorProps {
  onTabChange: (tabId: TabType) => void;
  initialTab?: TabType;
}

export default function TabSelector({ onTabChange, initialTab = 'events' }: TabSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // 로컬 스토리지에서 탭 상태 불러오기
  useEffect(() => {
    const savedTab = localStorage.getItem('activeMatchTab');
    if (savedTab && (savedTab === 'events' || savedTab === 'lineups' || 
                     savedTab === 'stats' || savedTab === 'standings')) {
      setActiveTab(savedTab as TabType);
      onTabChange(savedTab as TabType);
    }
  }, [onTabChange]);

  // 탭 변경 핸들러
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    localStorage.setItem('activeMatchTab', tabId);
    onTabChange(tabId);
  };

  return (
    <div className="mb-4 bg-white rounded-lg border flex">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-3 text-sm font-medium flex-1 ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-3 border-blue-600 font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
} 