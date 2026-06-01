import React from 'react';
import { AllPostsWidget, BoardCollectionWidget, HomeActionWidget, HomeLinkWidget, NewsWidget } from '@/domains/widgets/components';
import AdBanner from '@/shared/components/AdBanner';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';
import { LiveScoreWidgetV2, transformToWidgetLeagues } from '@/domains/widgets/components/live-score-widget';
import { fetchTodayMatches } from '@/domains/livescore/actions/footballApi';
import { getCurrentUser } from '@/domains/auth/actions';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { fetchAllPostsWidgetData } from '@/domains/widgets/components/AllPostsWidget';
import { fetchNewsData } from '@/domains/widgets/components/news-widget';
import { fetchBoardCollectionData } from '@/domains/widgets/components/board-collection-widget/BoardCollectionWidget';

export const dynamic = 'force-dynamic';

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
  url: siteConfig.url,
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
      { '@type': 'ListItem', position: 1, name: '해외축구', url: `${siteConfig.url}/boards/soccer` },
      { '@type': 'ListItem', position: 2, name: '국내축구', url: `${siteConfig.url}/boards/k-league` },
      { '@type': 'ListItem', position: 3, name: '프리미어리그', url: `${siteConfig.url}/boards/premier` },
      { '@type': 'ListItem', position: 4, name: '라리가', url: `${siteConfig.url}/boards/laliga` },
      { '@type': 'ListItem', position: 5, name: '세리에A', url: `${siteConfig.url}/boards/serie-a` },
      { '@type': 'ListItem', position: 6, name: '분데스리가', url: `${siteConfig.url}/boards/bundesliga` },
      { '@type': 'ListItem', position: 7, name: '축구 소식', url: `${siteConfig.url}/boards/news` },
      { '@type': 'ListItem', position: 8, name: '경기 데이터분석', url: `${siteConfig.url}/boards/data-analysis` },
      { '@type': 'ListItem', position: 9, name: '자유게시판', url: `${siteConfig.url}/boards/free` },
      { '@type': 'ListItem', position: 10, name: '라이브스코어', url: `${siteConfig.url}/livescore/football` },
    ],
  },
};

const HOME_SECONDARY_LINKS = [
  { key: 'soccer', label: '해외축구 게시판', href: '/boards/soccer', ariaLabel: '해외축구 게시판' },
  { key: 'notice', label: '공지사항', href: '/boards/notice', ariaLabel: '공지사항 보기' },
  { key: 'data-center', label: '팀·리그 찾기', href: '/livescore/football/leagues', ariaLabel: '팀·리그 찾기' },
];

export default async function HomePage() {
  const [liveScoreData, boardCollectionData, latestPosts, news, currentUser] = await Promise.all([
    fetchTodayMatches().then(transformToWidgetLeagues),
    fetchBoardCollectionData(),
    fetchAllPostsWidgetData(),
    fetchNewsData(),
    getCurrentUser(),
  ]);

  return (
    <>
      <DaumWebmasterHints
        title={siteConfig.ogTitle || siteConfig.name}
        content={siteConfig.description}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <main className="bg-transparent space-y-4 overflow-visible">
        <HomeActionWidget isLoggedIn={Boolean(currentUser.user)} />
        <h1 className="sr-only">4590 Football - 실시간 축구 스코어 커뮤니티</h1>
        <AdBanner />
        <LiveScoreWidgetV2 leagues={liveScoreData} />
        <HomeLinkWidget items={HOME_SECONDARY_LINKS} ariaLabel="홈 보조 이동" />
        <BoardCollectionWidget data={boardCollectionData} />
        <AllPostsWidget posts={latestPosts} />
        <div className="hidden md:flex justify-center">
          <KakaoAd adUnit={KAKAO.POST_PC_BANNER} adWidth={728} adHeight={90} />
        </div>
        <div className="md:hidden flex justify-center">
          <KakaoAd adUnit={KAKAO.MOBILE_BANNER} adWidth={320} adHeight={100} />
        </div>
        <NewsWidget news={news} />
      </main>
    </>
  );
}
