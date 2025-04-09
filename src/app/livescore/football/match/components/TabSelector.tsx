'use client';

import { useState, useEffect } from 'react';

// 탭 정의
const tabs = [
  { id: 'events', label: '이벤트' },
  { id: 'lineups', label: '라인업' },
  { id: 'stats', label: '통계' },
  { id: 'standings', label: '순위' },
];

interface TabSelectorProps {
  onTabChange: (tabId: string) => void;
  initialTab?: string;
}

export default function TabSelector({ onTabChange, initialTab = 'events' }: TabSelectorProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // 로컬 스토리지에서 탭 상태 불러오기
  useEffect(() => {
    const savedTab = localStorage.getItem('activeMatchTab');
    if (savedTab) {
      setActiveTab(savedTab);
      onTabChange(savedTab);
    }
  }, [onTabChange]);

  // 탭 변경 핸들러
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('activeMatchTab', tabId);
    onTabChange(tabId);
  };

  return (
    <div className="flex mb-4 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === tab.id
              ? 'text-blue-500 border-b-2 border-blue-500'
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