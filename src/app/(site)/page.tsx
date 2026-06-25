import React from 'react';
import { AllPostsWidget, BoardCollectionWidget, HomeActionWidget, HomeLinkWidget, NewsWidget } from '@/domains/widgets/components';
import AdBanner from '@/shared/components/AdBanner';
import ResponsiveKakaoAd from '@/shared/components/ResponsiveKakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';
import { LiveScoreWidgetV2, transformToWidgetLeagues } from '@/domains/widgets/components/live-score-widget';
import { fetchTodayMatches, fetchWorldCupSidebarMatches, fetchWorldCupWidgetMatches } from '@/domains/livescore/actions/footballApi';
import { getAuthenticatedUser } from '@/shared/actions/auth';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import DaumWebmasterHints from '@/shared/components/DaumWebmasterHints';
import { fetchAllPostsWidgetData } from '@/domains/widgets/components/AllPostsWidget';
import { fetchNewsData } from '@/domains/widgets/components/news-widget';
import { fetchBoardCollectionData } from '@/domains/widgets/components/board-collection-widget/BoardCollectionWidget';
import WorldCupSidebarCard from '@/domains/sidebar/components/WorldCupSidebarCard';

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
      '해외축구',
      '국내축구',
      '라이브스코어',
      '경기 일정',
      '축구 뉴스',
      'EPL',
      '챔피언스리그',
      'K리그',
    ],
  });
}

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteConfig.url}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const HOME_SECONDARY_LINKS = [
  { key: 'soccer', label: '해외축구 게시판', href: '/boards/soccer', ariaLabel: '해외축구 게시판' },
  { key: 'notice', label: '공지사항', href: '/boards/notice', ariaLabel: '공지사항 보기' },
  { key: 'data-center', label: '팀·리그 찾기', href: '/livescore/football/leagues', ariaLabel: '팀·리그 찾기' },
];

export default async function HomePage() {
  const [liveScoreData, worldCupSidebarMatches, boardCollectionData, latestPosts, news, currentUser] = await Promise.all([
    Promise.all([
      fetchTodayMatches(),
      fetchWorldCupWidgetMatches(),
    ]).then(([todayMatches, worldCupMatches]) => transformToWidgetLeagues(todayMatches, worldCupMatches)),
    fetchWorldCupSidebarMatches(),
    fetchBoardCollectionData(),
    fetchAllPostsWidgetData(),
    fetchNewsData(),
    getAuthenticatedUser(),
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
      <main className="flex flex-col gap-4 bg-transparent overflow-visible">
        <div className="hidden md:block">
          <HomeActionWidget isLoggedIn={Boolean(currentUser.data?.user)} />
        </div>
        <div className="flex flex-col gap-4 md:hidden">
          <HomeActionWidget isLoggedIn={Boolean(currentUser.data?.user)} />
          <WorldCupSidebarCard matches={worldCupSidebarMatches} />
        </div>
        <h1 className="sr-only">4590 Football - 실시간 축구 스코어 커뮤니티</h1>
        <AdBanner />
        <LiveScoreWidgetV2 leagues={liveScoreData} />
        <HomeLinkWidget items={HOME_SECONDARY_LINKS} ariaLabel="홈 보조 이동" />
        <BoardCollectionWidget data={boardCollectionData} />
        <AllPostsWidget posts={latestPosts} />
        <div className="hidden md:flex justify-center">
          <ResponsiveKakaoAd adUnit={KAKAO.BOTTOM_PC_BANNER} adWidth={728} adHeight={90} minWidth={768} />
        </div>
        <div className="md:hidden flex justify-center">
          <ResponsiveKakaoAd adUnit={KAKAO.BOTTOM_MOBILE_BANNER} adWidth={320} adHeight={100} maxWidth={767} />
        </div>
        <NewsWidget news={news} />
      </main>
    </>
  );
}
