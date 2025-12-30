'use client';

import { useCallback, ReactNode } from 'react';

// 탭 아이템 타입 정의
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  mobileOnly?: boolean;
  icon?: ReactNode;
}

// 탭 컴포넌트 Props
export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isChangingTab?: boolean;
  className?: string;
  showCount?: boolean;
  variant?: 'default' | 'minimal';
}

/**
 * 공통 탭 UI 컴포넌트
 * 프로젝트 전체에서 일관된 탭 UI를 제공합니다.
 */
export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  isChangingTab = false,
  className = '',
  showCount = false,
  variant = 'default'
}: TabsProps) {
  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled || isChangingTab) return;
    onTabChange(tabId);
  }, [tabs, isChangingTab, onTabChange]);

  // 화면 크기에 따라 표시할 탭 필터링
  const visibleTabs = tabs.filter(() => {
    // mobileOnly 탭은 CSS로 제어
    return true;
  });

  const baseClasses = variant === 'minimal'
    ? 'flex border-b border-black/7 dark:border-white/10'
    : 'bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-0 overflow-hidden flex sticky top-0 z-10 overflow-x-auto';

  return (
    <div className={`mb-4 ${className}`}>
      <div className={baseClasses}>
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          // 탭 라벨 구성
          const tabLabel = (
            <>
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
              {showCount && tab.count !== undefined && (
                <span className="ml-1">({tab.count.toLocaleString()})</span>
              )}
            </>
          );

          const buttonClasses = variant === 'minimal'
            ? `py-2 px-3 ${isActive
                ? 'border-b-2 border-slate-800 dark:border-white font-medium text-gray-900 dark:text-[#F0F0F0]'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              } ${tab.mobileOnly ? 'xl:hidden' : ''}`
            : `h-12 px-3 flex items-center justify-center text-xs font-medium flex-1 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-semibold border-b-2 border-slate-800 dark:border-white'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              } ${tab.mobileOnly ? 'xl:hidden' : ''} ${
                tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={buttonClasses}
              aria-current={isActive ? 'page' : undefined}
              disabled={tab.disabled || isChangingTab}
            >
              {tabLabel}
              {isChangingTab && isActive && (
                <span className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 탭 컨텐츠 컴포넌트
export interface TabContentProps {
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabContent({ activeTab, children, className = '' }: TabContentProps) {
  return (
    <div className={`tab-content ${className}`} data-tab={activeTab}>
      {children}
    </div>
  );
}

// 탭 패널 컴포넌트
export interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ tabId, activeTab, children, className = '' }: TabPanelProps) {
  if (tabId !== activeTab) return null;
  
  return (
    <div className={`tab-panel ${className}`} role="tabpanel" aria-labelledby={`tab-${tabId}`}>
      {children}
    </div>
  );
} 