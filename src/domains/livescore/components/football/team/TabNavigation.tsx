'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Tabs, { TabItem } from '@/shared/ui/tabs';

interface TabNavigationProps {
  teamId: string;
  activeTab?: string;
}

/**
 * 팀 탭 네비게이션 컴포넌트
 * 개요, 순위, 선수단, 통계 탭을 제공합니다.
 */
export default function TabNavigation({ teamId, activeTab = 'overview' }: TabNavigationProps) {
  const router = useRouter();
  
  // 로딩 상태를 위한 하나의 상태로 단순화
  const [isChangingTab, setIsChangingTab] = useState(false);
  
  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'overview', label: '개요' },
    { id: 'standings', label: '순위' },
    { id: 'squad', label: '선수단' },
    { id: 'stats', label: '통계' }
  ];
  
  // activeTab이 변경되면 로딩 상태 초기화
  useEffect(() => {
    setIsChangingTab(false);
  }, [activeTab]);
  
  // 탭 변경 처리 함수
  const handleTabChange = useCallback((tabId: string) => {
    // 같은 탭이거나 이미 탭 변경 중이면 무시
    if (tabId === activeTab || isChangingTab) return;
    
    // 탭 변경 상태 설정
    setIsChangingTab(true);
    
    // 경로 결정 - 개요 탭은 쿼리 파라미터 없이 기본 경로 사용
    const path = tabId === 'overview'
      ? `/livescore/football/team/${teamId}`
      : `/livescore/football/team/${teamId}?tab=${tabId}`;
    
    // 페이지 전환
    router.push(path);
  }, [router, teamId, activeTab, isChangingTab]);
  
  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isChangingTab={isChangingTab}
    />
  );
} 