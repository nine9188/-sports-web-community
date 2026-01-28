'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PlayerHeader from './PlayerHeader';
import PlayerTabNavigation from './TabNavigation';
import TabContent from './TabContent';
import { LoadingState } from '@/domains/livescore/components/common/CommonComponents';
import { PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import type { PlayerTabType } from '@/domains/livescore/hooks';
import { playerKeys } from '@/shared/constants/queryKeys';
import { scrollToTop } from '@/shared/utils/scroll';

/**
 * ============================================
 * 클라이언트 사이드 탭 전환 패턴
 * ============================================
 *
 * 이 패턴은 Team, Match, League 페이지에서도 동일하게 적용됩니다.
 *
 * ## 핵심 원리
 *
 * 1. **서버 컴포넌트 (page.tsx)**
 *    - 초기 데이터만 로드
 *    - URL에서 초기 탭 결정
 *    - 클라이언트 컴포넌트에 데이터 전달
 *
 * 2. **클라이언트 래퍼 (이 컴포넌트)**
 *    - useState로 현재 탭 상태 관리
 *    - 탭 변경 시 shallow URL 업데이트 (페이지 리로드 없음)
 *    - React Query 캐시로 즉시 데이터 제공
 *
 * 3. **TabNavigation**
 *    - onTabChange 콜백으로 부모에게 탭 변경 알림
 *    - URL 업데이트는 부모(이 컴포넌트)에서 처리
 *
 * 4. **TabContent**
 *    - 현재 탭에 따라 React Query로 데이터 로드
 *    - 이미 로드된 탭은 캐시에서 즉시 제공
 *
 * ## 장점
 *
 * - 탭 전환이 즉시 이루어짐 (서버 라운드트립 없음)
 * - React Query 캐싱으로 중복 요청 방지
 * - URL이 업데이트되어 북마크/공유 가능
 * - 브라우저 뒤로가기/앞으로가기 지원
 *
 * ## 사용 예시
 *
 * ```tsx
 * // page.tsx (서버 컴포넌트)
 * export default async function PlayerPage({ params, searchParams }) {
 *   const { id } = await params;
 *   const { tab = 'stats' } = await searchParams;
 *   const initialData = await fetchPlayerFullData(id, { ... });
 *
 *   return (
 *     <PlayerPageClient
 *       playerId={id}
 *       initialTab={tab}
 *       initialData={initialData}
 *     />
 *   );
 * }
 * ```
 */

interface PlayerPageClientProps {
  playerId: string;
  initialTab: PlayerTabType;
  initialData: PlayerFullDataResponse;
}

export default function PlayerPageClient({
  playerId,
  initialTab,
  initialData,
}: PlayerPageClientProps) {
  // 클라이언트에서 탭 상태 관리
  const [currentTab, setCurrentTab] = useState<PlayerTabType>(initialTab);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // 서버에서 모든 탭 데이터를 미리 로드하므로 클라이언트 프리페치 불필요

  /**
   * 탭 변경 핸들러
   *
   * 1. 클라이언트 상태 즉시 업데이트 (빠른 UI 반응)
   * 2. URL을 shallow로 업데이트 (페이지 리로드 없이 히스토리만 변경)
   * 3. React Query가 캐시된 데이터 제공 또는 새로 fetch
   */
  const handleTabChange = useCallback((tabId: string) => {
    const newTab = tabId as PlayerTabType;

    // 같은 탭이면 무시
    if (newTab === currentTab) return;

    // 캐시 상태 확인 (디버깅용)
    const cacheKey = playerKeys[newTab as keyof typeof playerKeys];
    if (typeof cacheKey === 'function') {
      const cached = queryClient.getQueryData(cacheKey(playerId));
      console.log(`[TabChange] ${newTab} 캐시 상태:`, cached ? '있음' : '없음');
    }

    // 1. 클라이언트 상태 즉시 업데이트
    setCurrentTab(newTab);

    // 2. URL 업데이트 (shallow - 페이지 리로드 없음)
    const params = new URLSearchParams(searchParams?.toString() || '');

    if (newTab === 'stats') {
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
    <>
      {/* PlayerHeader - playerId와 초기 데이터 전달 */}
      <PlayerHeader
        playerId={playerId}
        initialData={initialData.playerData}
      />

      {/* 탭 네비게이션 - onTabChange 콜백 전달 */}
      <PlayerTabNavigation
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />

      {/* 탭 컨텐츠 - React Query로 데이터 관리 */}
      <Suspense fallback={<LoadingState message="데이터를 불러오는 중..." />}>
        <TabContent
          playerId={playerId}
          currentTab={currentTab}
          initialData={initialData}
        />
      </Suspense>
    </>
  );
}
