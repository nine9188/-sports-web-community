import React, { Suspense } from 'react';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget } from '@/domains/widgets/components';
import AdBanner from '@/shared/components/AdBanner';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';
import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget/index';
import { buildMetadata } from '@/shared/utils/metadataNew';


// above-fold 위젯 데이터 함수 import (LiveScore만 blocking)
import { fetchMultiDayMatches } from '@/domains/livescore/actions/footballApi';
import { transformToWidgetLeagues } from '@/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server';
import LiveScoreCacheSeeder from '@/shared/components/LiveScoreCacheSeeder';

export async function generateMetadata() {
  return buildMetadata({
    title: '4590 Football - 실시간 축구 스코어, 경기 일정, 팀·선수 정보, 축구 커뮤니티',
    description: '프리미어리그(EPL), 라리가, 세리에A, 챔피언스리그 등 주요 리그의 실시간 라이브스코어와 경기 일정, 팀·선수 통계 정보를 제공하며 축구 팬들과 소통할 수 있는 플랫폼입니다.',
    path: '/',
    titleOnly: true,
  });
}

// 메인 페이지 컴포넌트 - LiveScore만 blocking, 나머지는 Suspense 스트리밍
export default async function HomePage() {
  // LiveScore만 above-fold blocking (LCP 후보)
  // BoardCollection은 Suspense로 스트리밍 → LCP 경로에서 제외
  const multiDayData = await fetchMultiDayMatches();

  // raw 데이터 → 위젯용 League[] 변환 (빅매치 리그 필터링)
  const liveScoreData = transformToWidgetLeagues(multiDayData);

  return (
    <main className="bg-transparent space-y-4 overflow-visible">
      <h1 className="sr-only">4590 Football - 실시간 축구 스코어, 커뮤니티</h1>
      {/* 서버 데이터를 React Query 캐시에 주입 (헤더/모달이 API 호출 없이 사용) */}
      <LiveScoreCacheSeeder data={multiDayData} />
      {/* 게시판 바로가기 아이콘 - 라이브스코어 상단 */}
      <div className="bg-transparent overflow-visible">
        <BoardQuickLinksWidget />
      </div>
      {/* 배너 광고 */}
      <AdBanner />
      {/* LiveScore 위젯 V2 - 새로운 디자인 */}
      <LiveScoreWidgetV2 initialData={liveScoreData} />

      {/* 게시판 모음 위젯 - Suspense 스트리밍 (LCP 경로에서 제외) */}
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
