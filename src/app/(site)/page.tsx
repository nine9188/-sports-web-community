import React, { Suspense } from 'react';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget } from '@/domains/widgets/components';
import AdBanner from '@/shared/components/AdBanner';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';
import { LiveScoreWidgetStreaming } from '@/domains/widgets/components/live-score-widget/index';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

export async function generateMetadata() {
  return buildMetadata({
    title: '4590 Football - 축구 커뮤니티 | 라이브스코어, 해외축구, 국내축구 게시판',
    description:
      '축구 커뮤니티 4590 Football. 해외축구, 국내축구 라이브스코어와 경기 일정, EPL·라리가·세리에A·K리그 팀·선수 정보를 확인하고 축구 커뮤니티에서 자유롭게 소통하세요.',
    path: '/',
    titleOnly: true,
    keywords: [
      '축구 커뮤니티',
      '4590',
      '4590football',
      '4590 Football',
      '라이브스코어',
      '해외축구',
      '국내축구',
      '실시간 스코어',
      '축구 경기결과',
      '오늘 축구 경기',
      'EPL 순위',
      '프리미어리그',
      '라리가',
      '세리에A',
      'K리그',
      '챔피언스리그',
      '해외축구 게시판',
      '국내축구 게시판',
      '축구 분석',
      '축구 이적',
      '축구 승부예측',
    ],
  });
}

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '4590 Football',
  url: 'https://4590football.com',
  description:
    '축구 팬을 위한 커뮤니티. 실시간 라이브스코어, 경기 분석, AI 예측, 팀·선수 데이터, 축구 소식을 한곳에서 제공합니다.',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    name: '4590 Football 무료 이용',
    price: '0',
    priceCurrency: 'KRW',
  },
  inLanguage: 'ko',
  audience: {
    '@type': 'Audience',
    name: '축구 팬',
    audienceType: '축구 팬',
  },
  featureList: [
    '실시간 라이브스코어와 경기 일정',
    '해외축구, 국내축구, 자유게시판, 유머, 이슈 커뮤니티',
    '팀별 전용 게시판과 리그별 게시판',
    'AI 기반 경기 분석과 승부 예측',
    '선수·팀 통계와 데이터',
    '축구 이적 시장 소식',
    '축구 뉴스와 팬 커뮤니티 콘텐츠',
  ],
  mainEntity: {
    '@type': 'ItemList',
    name: '주요 섹션',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '해외축구', url: 'https://4590football.com/boards/soccer' },
      { '@type': 'ListItem', position: 2, name: '국내축구', url: 'https://4590football.com/boards/k-league' },
      { '@type': 'ListItem', position: 3, name: '프리미어리그', url: 'https://4590football.com/boards/premier' },
      { '@type': 'ListItem', position: 4, name: '라리가', url: 'https://4590football.com/boards/laliga' },
      { '@type': 'ListItem', position: 5, name: '세리에A', url: 'https://4590football.com/boards/serie-a' },
      { '@type': 'ListItem', position: 6, name: '분데스리가', url: 'https://4590football.com/boards/bundesliga' },
      { '@type': 'ListItem', position: 7, name: '축구 소식', url: 'https://4590football.com/boards/news' },
      { '@type': 'ListItem', position: 8, name: '경기 데이터분석', url: 'https://4590football.com/boards/data-analysis' },
      { '@type': 'ListItem', position: 9, name: '자유게시판', url: 'https://4590football.com/boards/free' },
      { '@type': 'ListItem', position: 10, name: '라이브스코어', url: 'https://4590football.com/livescore/football' },
    ],
  },
};

function HomeWidgetLoading({
  title,
  minHeight = 96,
}: {
  title: string;
  minHeight?: number;
}) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent
        className="flex items-center justify-center py-0"
        style={{ minHeight }}
      >
        <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
      </ContainerContent>
    </Container>
  );
}

function BoardCollectionWidgetLoading() {
  const loadingBody = (
    <div className="h-12 px-3 flex items-center justify-center text-center">
      <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
    </div>
  );

  const sectionHeader = (title: string) => (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] px-4 py-2 border-b border-black/5 dark:border-white/10">
      <h3 className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{title}</h3>
    </div>
  );

  return (
    <div>
      <Container className="hidden md:block bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader className="justify-between">
          <ContainerTitle>데이터분석</ContainerTitle>
          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-0.5">
            분석 더보기
          </span>
        </ContainerHeader>

        <div className="grid grid-cols-2">
          <div className="border-r border-black/5 dark:border-white/10">
            {sectionHeader('해외축구 분석')}
            {loadingBody}
          </div>
          <div>
            {sectionHeader('국내축구 분석')}
            {loadingBody}
          </div>
        </div>
      </Container>

      <div className="md:hidden space-y-4">
        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader className="justify-between">
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">해외축구 분석</h3>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-0.5">
              분석 더보기
            </span>
          </ContainerHeader>
          {loadingBody}
        </Container>

        <Container className="bg-white dark:bg-[#1D1D1D]">
          <ContainerHeader className="justify-between">
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">국내축구 분석</h3>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-0.5">
              분석 더보기
            </span>
          </ContainerHeader>
          {loadingBody}
        </Container>
      </div>
    </div>
  );
}

function NewsWidgetLoading() {
  const sideLoadingCard = (
    <div className="h-[96px] bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
      <div className="h-full p-3 flex items-center justify-center text-center">
        <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          <div className="h-[320px] bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 overflow-hidden">
            <div className="h-full p-3 flex items-center justify-center text-center">
              <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
            </div>
          </div>
        </div>
        <div className="md:w-1/2 flex flex-col gap-4">
          {sideLoadingCard}
          {sideLoadingCard}
          {sideLoadingCard}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sideLoadingCard}
        {sideLoadingCard}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <main className="bg-transparent space-y-4 overflow-visible">
        <div className="bg-transparent overflow-visible">
          <h1 className="sr-only">4590 Football - 실시간 축구 스코어 커뮤니티</h1>
          <BoardQuickLinksWidget />
        </div>
        <AdBanner />
        <Suspense fallback={<HomeWidgetLoading title="빅매치" minHeight={48} />}>
          <LiveScoreWidgetStreaming />
        </Suspense>
        <Suspense fallback={<BoardCollectionWidgetLoading />}>
          <BoardCollectionWidget />
        </Suspense>
        <Suspense fallback={<HomeWidgetLoading title="최신 게시글" minHeight={48} />}>
          <AllPostsWidget />
        </Suspense>
        <div className="hidden md:flex justify-center">
          <KakaoAd adUnit={KAKAO.POST_PC_BANNER} adWidth={728} adHeight={90} />
        </div>
        <div className="md:hidden flex justify-center">
          <KakaoAd adUnit={KAKAO.MOBILE_BANNER} adWidth={320} adHeight={100} />
        </div>
        <Suspense fallback={<NewsWidgetLoading />}>
          <NewsWidget />
        </Suspense>
      </main>
    </>
  );
}
