'use client';

import { useCallback, useState, useEffect } from 'react';
import { TabList, type TabItem } from '@/shared/components/ui';

/**
 * ============================================
 * 탭 네비게이션 컴포넌트 (클라이언트 사이드 탭 전환 패턴)
 * ============================================
 *
 * 이 컴포넌트는 탭 UI만 담당합니다.
 * 실제 탭 상태 관리와 URL 업데이트는 부모 컴포넌트에서 처리합니다.
 *
 * ## Props
 *
 * - activeTab: 현재 활성화된 탭 ID
 * - onTabChange: 탭 변경 시 호출되는 콜백 (부모가 상태 관리)
 *
 * ## 사용 예시
 *
 * ```tsx
 * // 부모 컴포넌트
 * const [currentTab, setCurrentTab] = useState('stats');
 *
 * const handleTabChange = (tabId: string) => {
 *   setCurrentTab(tabId);
 *   // URL 업데이트 등 추가 로직
 * };
 *
 * <PlayerTabNavigation
 *   activeTab={currentTab}
 *   onTabChange={handleTabChange}
 * />
 * ```
 */

interface PlayerTabNavigationProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function PlayerTabNavigation({
  activeTab = 'stats',
  onTabChange,
}: PlayerTabNavigationProps) {
  // UI 상태 (탭 전환 애니메이션용)
  const [currentTabUI, setCurrentTabUI] = useState(activeTab);
  const [isChangingTab, setIsChangingTab] = useState(false);

  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'stats', label: '선수 통계' },
    { id: 'fixtures', label: '경기별 통계' },
    { id: 'rankings', label: '순위' },
    { id: 'transfers', label: '이적 기록' },
    { id: 'injuries', label: '부상 기록' },
    { id: 'trophies', label: '트로피' }
  ];

  // activeTab이 외부에서 변경되면 UI 동기화
  useEffect(() => {
    setCurrentTabUI(activeTab);
    setIsChangingTab(false);
  }, [activeTab]);

  // 탭 변경 처리
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이면 무시
    if (tabId === activeTab || isChangingTab) return;

    // UI 먼저 업데이트 (빠른 반응)
    setCurrentTabUI(tabId);
    setIsChangingTab(true);

    // 부모에게 탭 변경 알림
    onTabChange?.(tabId);

    // 짧은 지연 후 로딩 상태 해제 (애니메이션용)
    setTimeout(() => {
      setIsChangingTab(false);
    }, 100);
  }, [activeTab, isChangingTab, onTabChange]);

  return (
    <TabList
      tabs={tabs}
      activeTab={currentTabUI}
      onTabChange={handleTabChange}
      isChangingTab={isChangingTab}
    />
  );
}
