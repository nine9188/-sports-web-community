'use client';

import { useCallback } from 'react';
import { TabList, type TabItem } from '@/shared/components/ui';

interface TabNavigationProps {
  teamId: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

/**
 * 팀 탭 네비게이션 컴포넌트
 * 개요, 경기, 순위, 선수단, 통계 탭을 제공합니다.
 *
 * ## 클라이언트 사이드 탭 전환
 *
 * onTabChange 콜백을 통해 부모 컴포넌트(TeamPageClient)에서
 * 탭 상태와 URL을 관리합니다. 이를 통해:
 * - 서버 리로드 없이 즉시 탭 전환
 * - URL 업데이트로 북마크/공유 가능
 */
export default function TabNavigation({
  teamId,
  activeTab = 'overview',
  onTabChange,
}: TabNavigationProps) {
  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'overview', label: '개요' },
    { id: 'fixtures', label: '경기' },
    { id: 'standings', label: '순위' },
    { id: 'squad', label: '선수단' },
    { id: 'stats', label: '통계' }
  ];

  // 탭 변경 처리 함수
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이면 무시
    if (tabId === activeTab) return;

    // 부모에게 탭 변경 알림 (URL 업데이트는 부모가 처리)
    onTabChange?.(tabId);
  }, [activeTab, onTabChange]);

  return (
    <TabList
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  );
} 