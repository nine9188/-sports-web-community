import React, { Suspense } from 'react';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget, TransferBannerWidget } from '@/domains/widgets/components';
import AdBanner from '@/shared/components/AdBanner';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';
import { LiveScoreWidgetStreaming } from '@/domains/widgets/components/live-score-widget/index';
import LiveScoreSkeleton from '@/domains/livescore/components/football/MainView/LiveScoreSkeleton';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '4590 Football - 실시간 축구 스코어, 경기 일정, 팀·선수 정보, 축구 커뮤니티',
    description: '프리미어리그(EPL), 라리가, 세리에A, 챔피언스리그 등 주요 리그의 실시간 라이브스코어와 경기 일정, 팀·선수 통계 정보를 제공하며 축구 팬들과 소통할 수 있는 플랫폼입니다.',
    path: '/',
    titleOnly: true,
  });
}

// 메인 페이지 컴포넌트 - 모든 데이터를 Suspense 스트리밍으로 처리
// blocking await 없음 → 즉시 HTML 스트리밍 시작 (TTFB 최적화)
export default function HomePage() {
  return (
    <main className="bg-transparent space-y-4 overflow-visible">
      {/* 게시판 바로가기 아이콘 - 즉시 렌더 (서버 컴포넌트, 데이터 fetch 없음) */}
      <div className="bg-transparent overflow-visible">
        <h1 className="sr-only">4590 Football - 실시간 축구 스코어, 커뮤니티</h1>
        <BoardQuickLinksWidget />
      </div>
      {/* 배너 광고 */}
      <AdBanner />
      {/* LiveScore 위젯 - Suspense 스트리밍 (오늘 경기만 SSR, 어제/내일은 클라이언트) */}
      <Suspense fallback={<LiveScoreSkeleton />}>
        <LiveScoreWidgetStreaming />
      </Suspense>
      {/* 이적시장 배너 슬라이드 */}
      <Suspense>
        <TransferBannerWidget />
      </Suspense>

      {/* 게시판 모음 위젯 - Suspense 스트리밍 */}
      <Suspense>
        <BoardCollectionWidget />
      </Suspense>

      {/* 게시글 리스트 위젯 - Suspense 스트리밍 (below fold) */}
      <Suspense>
        <AllPostsWidget />
      </Suspense>

      {/* 카카오 배너 광고 */}
      <div className="hidden md:flex justify-center">
        <KakaoAd adUnit={KAKAO.POST_PC_BANNER} adWidth={728} adHeight={90} />
      </div>
      <div className="md:hidden flex justify-center">
        <KakaoAd adUnit={KAKAO.MOBILE_BANNER} adWidth={320} adHeight={100} />
      </div>

      {/* 뉴스 위젯 - Suspense 스트리밍 (below fold) */}
      <Suspense>
        <NewsWidget />
      </Suspense>
    </main>
  );
}
