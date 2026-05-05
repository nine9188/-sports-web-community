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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://4590football.com/#faq',
  url: 'https://4590football.com/',
  name: '4590 Football 자주 묻는 질문',
  mainEntity: [
    {
      '@type': 'Question',
      name: '4590은 무슨 뜻인가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        name: '4590의 의미',
        text: '축구 경기는 전반 45분, 후반 45분으로 이루어집니다. 4590은 그 90분의 모든 순간을 함께한다는 의미입니다.',
      },
    },
    {
      '@type': 'Question',
      name: '무료인가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        name: '무료 이용 안내',
        text: '네. 주요 기능은 무료로 이용할 수 있습니다. 가입하면 다른 팬들과 바로 소통할 수 있습니다.',
      },
    },
    {
      '@type': 'Question',
      name: 'AI 예측은 어떻게 작동하나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        name: 'AI 예측 작동 방식',
        text: '과거 경기 데이터, 팀 및 맞대결 기록 등을 AI 모델이 분석하여 승률과 예상 스코어를 제공합니다.',
      },
    },
    {
      '@type': 'Question',
      name: '어떤 리그를 지원하나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        name: '지원 리그 안내',
        text: '유럽 주요 리그, 챔피언스리그, K리그, J리그, MLS 등 다양한 리그와 국제 대회를 지원합니다.',
      },
    },
    {
      '@type': 'Question',
      name: '다른 축구 커뮤니티와 무엇이 다른가요?',
      acceptedAnswer: {
        '@type': 'Answer',
        name: '4590 Football의 차별점',
        text: '4590 Football은 실시간 라이브스코어, AI 경기 분석, 팀·선수 데이터를 커뮤니티와 통합한 플랫폼입니다. 리그별·팀별 게시판과 경기 데이터 기반 분석 게시판을 함께 운영합니다.',
      },
    },
  ],
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
        className="flex items-center justify-center"
        style={{ minHeight }}
      >
        <p className="text-[13px] text-gray-500 dark:text-gray-400">불러오는 중...</p>
      </ContainerContent>
    </Container>
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="bg-transparent space-y-4 overflow-visible">
        <div className="bg-transparent overflow-visible">
          <h1 className="sr-only">4590 Football - 실시간 축구 스코어 커뮤니티</h1>
          <BoardQuickLinksWidget />
        </div>
        <AdBanner />
        <Suspense fallback={<HomeWidgetLoading title="라이브스코어" minHeight={120} />}>
          <LiveScoreWidgetStreaming />
        </Suspense>
        <Suspense fallback={<HomeWidgetLoading title="데이터분석" minHeight={164} />}>
          <BoardCollectionWidget />
        </Suspense>
        <Suspense fallback={<HomeWidgetLoading title="최신 게시글" minHeight={220} />}>
          <AllPostsWidget />
        </Suspense>
        <div className="hidden md:flex justify-center">
          <KakaoAd adUnit={KAKAO.POST_PC_BANNER} adWidth={728} adHeight={90} />
        </div>
        <div className="md:hidden flex justify-center">
          <KakaoAd adUnit={KAKAO.MOBILE_BANNER} adWidth={320} adHeight={100} />
        </div>
        <Suspense fallback={<HomeWidgetLoading title="축구 소식" minHeight={260} />}>
          <NewsWidget />
        </Suspense>
      </main>
    </>
  );
}
