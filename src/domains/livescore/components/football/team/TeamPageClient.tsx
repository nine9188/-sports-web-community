'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import TeamHeader from './TeamHeader';
import TabNavigation from './TabNavigation';
import TabContent from './TabContent';
import Spinner from '@/shared/components/Spinner';
import { TeamFullDataResponse } from '@/domains/livescore/actions/teams/team';
import { scrollToTop } from '@/shared/utils/scroll';

/**
 * ============================================
 * 클라이언트 사이드 탭 전환 패턴
 * ============================================
 *
 * 이 패턴은 Player, Match, League 페이지에서도 동일하게 적용됩니다.
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
 *
 * 3. **TabNavigation**
 *    - onTabChange 콜백으로 부모에게 탭 변경 알림
 *    - URL 업데이트는 부모(이 컴포넌트)에서 처리
 *
 * 4. **TabContent**
 *    - 현재 탭에 따라 적절한 컴포넌트 렌더링
 *    - 이미 로드된 데이터 사용
 *
 * ## 장점
 *
 * - 탭 전환이 즉시 이루어짐 (서버 라운드트립 없음)
 * - 모든 데이터가 미리 로드되어 깜빡임 없음
 * - URL이 업데이트되어 북마크/공유 가능
 * - 브라우저 뒤로가기/앞으로가기 지원
 */

// 팀 탭 타입
export type TeamTabType = 'overview' | 'fixtures' | 'standings' | 'squad' | 'transfers' | 'stats';

// 유효한 탭 목록
const VALID_TABS: TeamTabType[] = ['overview', 'fixtures', 'standings', 'squad', 'transfers', 'stats'];

// 선수 한글명 타입
export type PlayerKoreanNames = Record<number, string | null>;

interface TeamPageClientProps {
  teamId: string;
  initialTab: TeamTabType;
  initialData: TeamFullDataResponse;
  playerKoreanNames?: PlayerKoreanNames;
}

export default function TeamPageClient({
  teamId,
  initialTab,
  initialData,
  playerKoreanNames = {},
}: TeamPageClientProps) {
  // 클라이언트에서 탭 상태 관리
  const [currentTab, setCurrentTab] = useState<TeamTabType>(initialTab);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * 탭 변경 핸들러
   *
   * 1. 클라이언트 상태 즉시 업데이트 (빠른 UI 반응)
   * 2. URL을 shallow로 업데이트 (페이지 리로드 없이 히스토리만 변경)
   * 3. 이미 로드된 데이터로 즉시 렌더링
   * 4. 페이지 최상단으로 스크롤
   */
  const handleTabChange = useCallback((tabId: string, subTab?: string) => {
    const newTab = tabId as TeamTabType;

    // 유효하지 않은 탭이면 무시
    if (!VALID_TABS.includes(newTab)) return;

    // 같은 탭이면 무시 (단, subTab이 있으면 허용)
    if (newTab === currentTab && !subTab) return;

    // 1. 클라이언트 상태 즉시 업데이트
    setCurrentTab(newTab);

    // 2. URL 업데이트 (shallow - 페이지 리로드 없음)
    const params = new URLSearchParams(searchParams?.toString() || '');

    if (newTab === 'overview') {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', newTab);
    }

    // subTab 파라미터 추가
    if (subTab) {
      params.set('subTab', subTab);
    } else {
      params.delete('subTab');
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
    <>
      {/* TeamHeader - 초기 데이터 전달 */}
      <Suspense fallback={
        <div className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg border dark:border-gray-700 p-4">
          <div className="flex justify-center items-center py-8">
            <Spinner size="xl" className="mx-auto" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">팀 정보를 불러오는 중...</span>
          </div>
        </div>
      }>
        <TeamHeader
          initialData={initialData.teamData}
          teamLogoUrl={initialData.teamLogoUrls?.[parseInt(teamId, 10)]}
          venueImageUrl={initialData.venueImageUrl}
        />
      </Suspense>

      {/* 탭 네비게이션 - onTabChange 콜백 전달 */}
      <TabNavigation
        teamId={teamId}
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />

      {/* 탭 컨텐츠 - 초기 데이터 전달 */}
      <TabContent
        teamId={teamId}
        tab={currentTab}
        initialData={initialData}
        onTabChange={handleTabChange}
        playerKoreanNames={playerKoreanNames}
      />
    </>
  );
}
