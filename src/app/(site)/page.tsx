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
    title: '4590 Football - 축구 커뮤니티 | 라이브스코어, 해외축구, 국내축구 게시판',
    description: '축구 커뮤니티 4590 Football. 해외축구, 국내축구 라이브스코어와 경기 일정, EPL·라리가·세리에A·K리그 팀·선수 정보를 확인하고 축구 커뮤니티에서 자유롭게 소통하세요.',
    path: '/',
    titleOnly: true,
    keywords: ['축구 커뮤니티', '4590', '4590football', '4590 Football', '라이브스코어', '해외축구', '국내축구', '실시간 스코어', '축구 경기결과', '오늘 축구 경기', 'EPL 순위', '프리미어리그', '라리가', '세리에A', 'K리그', '챔피언스리그', '해외축구 게시판', '국내축구 게시판', '축구 분석', '축구 이적', '축구 승부예측'],
  });
}

// 홈페이지 JSON-LD: 사이트 핵심 기능을 AI/검색엔진에 전달
const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '4590 Football',
  url: 'https://4590football.com',
  description: '축구 팬이 모이는 커뮤니티. 실시간 라이브스코어, 경기 분석, AI 예측, 팀·선수 데이터, 그리고 축구 팬들의 자유로운 소통 공간.',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KRW',
  },
  inLanguage: 'ko',
  audience: {
    '@type': 'Audience',
    audienceType: '축구 팬',
  },
  featureList: [
    '실시간 라이브스코어 (EPL, 라리가, 세리에A, 분데스리가, 리그앙, K리그 등)',
    '축구 커뮤니티 게시판 (해외축구, 국내축구, 자유게시판, 유머, 이슈)',
    '팀별 팬 게시판 (리버풀, 아스널, 바르셀로나, 레알 마드리드, 울산 등 100+ 팀)',
    'AI 기반 경기 분석 및 승부 예측',
    '선수·팀 통계 및 데이터',
    '이적 시장 소식',
    '핫딜 및 축구 용품 정보',
  ],
  mainEntity: {
    '@type': 'ItemList',
    name: '주요 게시판',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '해외 축구', url: 'https://4590football.com/boards/soccer' },
      { '@type': 'ListItem', position: 2, name: '국내 축구', url: 'https://4590football.com/boards/k-league' },
      { '@type': 'ListItem', position: 3, name: '프리미어리그', url: 'https://4590football.com/boards/premier' },
      { '@type': 'ListItem', position: 4, name: '라리가', url: 'https://4590football.com/boards/laliga' },
      { '@type': 'ListItem', position: 5, name: '세리에A', url: 'https://4590football.com/boards/serie-a' },
      { '@type': 'ListItem', position: 6, name: '분데스리가', url: 'https://4590football.com/boards/bundesliga' },
      { '@type': 'ListItem', position: 7, name: '축구 소식', url: 'https://4590football.com/boards/news' },
      { '@type': 'ListItem', position: 8, name: '경기 데이터 분석', url: 'https://4590football.com/boards/data-analysis' },
      { '@type': 'ListItem', position: 9, name: '자유게시판', url: 'https://4590football.com/boards/free' },
      { '@type': 'ListItem', position: 10, name: '라이브스코어', url: 'https://4590football.com/livescore/football' },
    ],
  },
};

// 메인 페이지 컴포넌트 - 모든 데이터를 Suspense 스트리밍으로 처리
// blocking await 없음 → 즉시 HTML 스트리밍 시작 (TTFB 최적화)
export default function HomePage() {
  return (
    <main className="bg-transparent space-y-4 overflow-visible">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
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
