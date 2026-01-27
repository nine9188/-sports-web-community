'use client';

import { useState, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import MatchHeader from './MatchHeader';
import TabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { MatchHeaderSkeleton } from '@/domains/livescore/components/common/HeadersUI';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { PlayerRatingsAndCaptains } from '@/domains/livescore/actions/match/playerStats';
import { MatchPlayerStatsResponse } from '@/domains/livescore/actions/match/matchPlayerStats';
import { MatchInfoSection } from './sidebar/MatchSidebar';
import { type SidebarData } from '@/domains/livescore/actions/match/sidebarData';

/**
 * ============================================
 * 클라이언트 사이드 탭 전환 패턴
 * ============================================
 *
 * Player, Team 페이지와 동일한 패턴 적용
 *
 * ## 핵심 원리
 *
 * 1. **서버 컴포넌트 (page.tsx)**
 *    - 모든 탭 데이터를 미리 로드
 *    - URL에서 초기 탭 결정
 *    - 클라이언트 컴포넌트에 데이터 전달
 *
 * 2. **클라이언트 래퍼 (이 컴포넌트)**
 *    - useState로 현재 탭 상태 관리
 *    - 탭 변경 시 shallow URL 업데이트 (페이지 리로드 없음)
 *    - 초기 데이터로 즉시 렌더링
 */

// 매치 탭 타입
export type MatchTabType = 'power' | 'events' | 'lineups' | 'stats' | 'standings' | 'support';

// 유효한 탭 목록
const VALID_TABS: MatchTabType[] = ['power', 'events', 'lineups', 'stats', 'standings', 'support'];

// 기본 탭
const DEFAULT_TAB: MatchTabType = 'power';

interface MatchPageClientProps {
  matchId: string;
  initialTab: MatchTabType;
  initialData: MatchFullDataResponse;
  initialPowerData?: HeadToHeadTestData;
  initialPlayerRatings?: PlayerRatingsAndCaptains;
  initialMatchPlayerStats?: MatchPlayerStatsResponse;
  sidebarData?: SidebarData | null;
}

export default function MatchPageClient({
  matchId,
  initialTab,
  initialData,
  initialPowerData,
  initialPlayerRatings,
  initialMatchPlayerStats,
  sidebarData,
}: MatchPageClientProps) {
  // 클라이언트에서 탭 상태 관리
  const [currentTab, setCurrentTab] = useState<MatchTabType>(initialTab);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * 탭 변경 핸들러
   *
   * 1. 클라이언트 상태 즉시 업데이트 (빠른 UI 반응)
   * 2. URL을 shallow로 업데이트 (페이지 리로드 없이 히스토리만 변경)
   * 3. 이미 로드된 데이터로 즉시 렌더링
   */
  const handleTabChange = useCallback((tabId: string) => {
    const newTab = tabId as MatchTabType;

    // 유효하지 않은 탭이면 무시
    if (!VALID_TABS.includes(newTab)) return;

    // 같은 탭이면 무시
    if (newTab === currentTab) return;

    // 1. 클라이언트 상태 즉시 업데이트
    setCurrentTab(newTab);

    // 2. URL 업데이트 (shallow - 페이지 리로드 없음)
    const params = new URLSearchParams(searchParams?.toString() || '');

    if (newTab === DEFAULT_TAB) {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', newTab);
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

    // window.history.replaceState로 shallow 업데이트
    // router.push는 서버 컴포넌트 리렌더링을 트리거할 수 있음
    window.history.replaceState(null, '', newUrl);
  }, [currentTab, pathname, searchParams]);

  return (
    <div className="flex gap-4">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 매치 헤더 - 초기 데이터 전달 */}
        <Suspense fallback={<MatchHeaderSkeleton />}>
          <MatchHeader
            initialData={initialData}
          />
        </Suspense>

        {/* 모바일용 경기 상세정보 - 헤더와 탭 사이에 배치 */}
        <div className="xl:hidden mb-4">
          <MatchInfoSection
            showOnlyMatchInfo={true}
            initialData={initialData.matchData}
            sidebarData={sidebarData}
          />
        </div>

        {/* 탭 네비게이션 - onTabChange 콜백 전달 */}
        <TabNavigation
          activeTab={currentTab}
          onTabChange={handleTabChange}
        />

        {/* 탭 컨텐츠 - 초기 데이터 전달 */}
        <TabContent
          matchId={matchId}
          currentTab={currentTab}
          initialData={initialData}
          initialPowerData={initialPowerData}
          initialPlayerRatings={initialPlayerRatings}
          initialMatchPlayerStats={initialMatchPlayerStats}
          relatedPosts={sidebarData?.relatedPosts}
        />
      </div>

      {/* 사이드바 - 데스크탑에서만 표시 */}
      <aside className="hidden xl:block w-[300px] shrink-0">
        <MatchInfoSection
          initialData={initialData.matchData}
          sidebarData={sidebarData}
        />
      </aside>
    </div>
  );
}
