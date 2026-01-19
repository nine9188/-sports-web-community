'use client';

import * as React from "react"
import { useCallback, ReactNode } from 'react';
import { cn } from "@/shared/utils/cn"

// ============================================
// Primitive Components (조합형)
// ============================================

/**
 * Tabs - 탭 컨테이너 (Primitive)
 *
 * 탭 버튼들을 감싸는 컨테이너
 */
const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
))
Tabs.displayName = "Tabs"

/**
 * TabButton - 탭 버튼 (Primitive)
 *
 * 활성/비활성 상태에 따라 스타일이 자동으로 적용됩니다.
 *
 * variant 종류:
 * - underline: 하단 테두리로 활성 표시 (여백 있음)
 * - default: 배경색으로 활성 표시 (여백 있음, rounded)
 * - fill: 공간을 꽉 채우는 탭 (여백 없음, flex-1)
 */
interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  variant?: 'default' | 'underline' | 'fill'
}

const TabButton = React.forwardRef<
  HTMLButtonElement,
  TabButtonProps
>(({ className, active = false, variant = 'default', ...props }, ref) => {
  const underlineClasses = cn(
    "text-sm flex-shrink-0",
    active
      ? "text-gray-900 dark:text-[#F0F0F0] border-b-2 border-gray-900 dark:border-[#F0F0F0] pb-1"
      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] pb-1"
  );

  const fillClasses = cn(
    "flex-1 text-xs",
    active
      ? "bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] border-b-2 border-[#262626] dark:border-[#F0F0F0]"
      : "bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
  );

  const defaultClasses = cn(
    "text-sm flex-shrink-0",
    active
      ? "bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] px-3 py-1.5 rounded"
      : "bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-3 py-1.5 rounded"
  );

  return (
    <button
      ref={ref}
      className={cn(
        "font-medium transition-colors whitespace-nowrap",
        variant === 'underline' ? underlineClasses : variant === 'fill' ? fillClasses : defaultClasses,
        className
      )}
      {...props}
    />
  );
})
TabButton.displayName = "TabButton"

// ============================================
// Full-Featured Components (배열 기반)
// ============================================

/**
 * TabItem - 탭 아이템 타입 정의
 */
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  mobileOnly?: boolean;
  icon?: ReactNode;
}

/**
 * TabList Props
 */
export interface TabListProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isChangingTab?: boolean;
  className?: string;
  showCount?: boolean;
  variant?: 'default' | 'minimal' | 'contained';
}

/**
 * TabList - 탭 목록 컴포넌트 (Full-Featured)
 *
 * tabs 배열을 받아서 전체 탭 UI를 렌더링합니다.
 *
 * @example
 * ```tsx
 * <TabList
 *   tabs={[{ id: 'tab1', label: '탭 1' }]}
 *   activeTab="tab1"
 *   onTabChange={(id) => setActiveTab(id)}
 * />
 * ```
 */
function TabList({
  tabs,
  activeTab,
  onTabChange,
  isChangingTab = false,
  className = '',
  showCount = false,
  variant = 'default'
}: TabListProps) {
  // 탭 변경 핸들러
  const handleTabChange = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled || isChangingTab) return;
    onTabChange(tabId);
  }, [tabs, isChangingTab, onTabChange]);

  // variant별 컨테이너 스타일
  const containerClasses = {
    default: 'bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-0 overflow-hidden flex overflow-x-auto no-scrollbar',
    minimal: 'flex border-b border-black/7 dark:border-white/10 overflow-x-auto no-scrollbar',
    contained: 'flex border-b border-black/5 dark:border-white/10 overflow-x-auto no-scrollbar'
  };

  // variant별 버튼 스타일
  const getButtonClasses = (isActive: boolean, tab: TabItem) => {
    const baseButton = 'transition-colors';
    const mobileClass = tab.mobileOnly ? 'xl:hidden' : '';
    const disabledClass = tab.disabled ? 'opacity-50 cursor-not-allowed' : '';

    if (variant === 'minimal') {
      return `${baseButton} py-2 px-3 ${isActive
        ? 'border-b-2 border-[#262626] dark:border-[#F0F0F0] font-medium text-gray-900 dark:text-[#F0F0F0]'
        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
      } ${mobileClass}`;
    }

    if (variant === 'contained') {
      return `${baseButton} py-2 px-2 h-auto flex items-center justify-center text-xs flex-1 whitespace-nowrap ${isActive
        ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-medium border-b-2 border-[#262626] dark:border-[#F0F0F0]'
        : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
      } ${mobileClass} ${disabledClass}`;
    }

    // default
    return `${baseButton} h-12 px-3 flex items-center justify-center text-xs font-medium flex-1 whitespace-nowrap ${isActive
      ? 'bg-white dark:bg-[#1D1D1D] text-gray-900 dark:text-[#F0F0F0] font-semibold border-b-2 border-[#262626] dark:border-[#F0F0F0]'
      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
    } ${mobileClass} ${disabledClass}`;
  };

  return (
    <div className={cn('mb-4', className)}>
      <div className={containerClasses[variant]}>
        {tabs.map((tab) => {
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

          const buttonClasses = getButtonClasses(isActive, tab);

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
                <span className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full bg-[#D1D1D1] dark:bg-[#4A4A4A]"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * TabContent - 탭 컨텐츠 컨테이너
 */
export interface TabContentProps {
  activeTab: string;
  children: ReactNode;
  className?: string;
}

function TabContent({ activeTab, children, className = '' }: TabContentProps) {
  return (
    <div className={`tab-content ${className}`} data-tab={activeTab}>
      {children}
    </div>
  );
}

/**
 * TabPanel - 개별 탭 패널
 */
export interface TabPanelProps {
  tabId: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

function TabPanel({ tabId, activeTab, children, className = '' }: TabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <div className={`tab-panel ${className}`} role="tabpanel" aria-labelledby={`tab-${tabId}`}>
      {children}
    </div>
  );
}

export {
  // Primitives
  Tabs,
  TabButton,
  // Full-featured
  TabList,
  TabContent,
  TabPanel
}
