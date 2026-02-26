'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import MatchHeader from './MatchHeader';
import TabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { MatchHeaderSkeleton } from '@/domains/livescore/components/common/HeadersUI';
import AdBanner from '@/shared/components/AdBanner';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import { AllPlayerStatsResponse } from '@/domains/livescore/types/lineup';
import { MatchInfoSection } from './sidebar/MatchSidebar';
import { type SidebarData } from '@/domains/livescore/actions/match/sidebarData';
import { scrollToTop } from '@/shared/utils/scroll';

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

// 선수 한글명 매핑 타입
export type PlayerKoreanNames = Record<number, string | null>;

interface MatchPageClientProps {
  matchId: string;
  initialTab: MatchTabType;
  initialData: MatchFullDataResponse;
  initialPowerData?: HeadToHeadTestData;
  // 통합된 선수 통계 데이터 (평점, 주장, 전체 통계 포함)
  allPlayerStats?: AllPlayerStatsResponse | null;
  sidebarData?: SidebarData | null;
  playerKoreanNames?: PlayerKoreanNames;
}

export default function MatchPageClient({
  matchId,
  initialTab,
  initialData,
  initialPowerData,
  allPlayerStats,
  sidebarData,
  playerKoreanNames = {},
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

  // 탭 변경 후 스크롤 (useEffect로 DOM 업데이트 완료 후 실행)
  useEffect(() => {
    scrollToTop('auto');
  }, [currentTab]);

  return (
    <div className="flex gap-4">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 매치 헤더 - 초기 데이터 전달 */}
        <Suspense fallback={<MatchHeaderSkeleton />}>
          <MatchHeader
            initialData={initialData}
            playerKoreanNames={playerKoreanNames}
            teamLogoUrls={initialData.teamLogoUrls}
            leagueLogoUrl={initialData.leagueLogoUrl}
            leagueLogoDarkUrl={initialData.leagueLogoDarkUrl}
          />
        </Suspense>

        {/* 모바일용 경기 상세정보 - 헤더와 탭 사이에 배치 */}
        <div className="xl:hidden mb-4">
          <MatchInfoSection
            showOnlyMatchInfo={true}
            initialData={initialData.matchData}
            sidebarData={sidebarData}
            teamLogoUrls={initialData.teamLogoUrls}
          />
        </div>

        {/* 배너 광고 */}
        <div className="mb-4">
          <AdBanner />
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
          allPlayerStats={allPlayerStats}
          relatedPosts={sidebarData?.relatedPosts}
          playerKoreanNames={playerKoreanNames}
        />
      </div>

      {/* 사이드바 - 데스크탑에서만 표시 */}
      <aside className="hidden xl:block w-[300px] shrink-0">
        <MatchInfoSection
          initialData={initialData.matchData}
          sidebarData={sidebarData}
          teamLogoUrls={initialData.teamLogoUrls}
        />
      </aside>
    </div>
  );
}
