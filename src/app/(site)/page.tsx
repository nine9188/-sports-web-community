import React, { Suspense } from 'react';
import Script from 'next/script';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget } from '@/domains/widgets/components';
import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget/index';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';

// 병렬 fetch를 위한 데이터 함수들 import (above-fold 위젯만)
import { fetchLiveScoreData } from '@/domains/widgets/components/live-score-widget/LiveScoreWidgetV2Server';
import { fetchBoardCollectionData } from '@/domains/widgets/components/board-collection-widget/BoardCollectionWidget';

export async function generateMetadata() {
  return buildMetadata({
    title: '4590 Football - 실시간 축구 스코어, 경기 일정, 팀·선수 정보, 축구 커뮤니티',
    description: '프리미어리그(EPL), 라리가, 세리에A, 챔피언스리그 등 주요 리그의 실시간 라이브스코어와 경기 일정, 팀·선수 통계 정보를 제공하며 축구 팬들과 소통할 수 있는 플랫폼입니다.',
    path: '/',
    titleOnly: true,
  });
}

// 메인 페이지 컴포넌트 - above-fold만 await, below-fold는 Suspense 스트리밍
export default async function HomePage() {
  // above-fold 위젯만 병렬 fetch (LiveScore + BoardCollection)
  // below-fold 위젯(AllPosts, News)은 Suspense로 자체 fetch → 스트리밍
  const [liveScoreData, boardCollectionData] = await Promise.all([
    fetchLiveScoreData(),
    fetchBoardCollectionData(),
  ]);

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main className="bg-transparent space-y-4 overflow-visible">
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {/* 게시판 바로가기 아이콘 - 라이브스코어 상단 */}
      <div className="bg-transparent overflow-visible">
        <BoardQuickLinksWidget />
      </div>
      {/* LiveScore 위젯 V2 - 새로운 디자인 */}
      <LiveScoreWidgetV2 initialData={liveScoreData} />

      {/* 게시판 모음 위젯 */}
      <BoardCollectionWidget initialData={boardCollectionData} />

      {/* 게시글 리스트 위젯 - Suspense 스트리밍 (below fold) */}
      <Suspense>
        <AllPostsWidget />
      </Suspense>

      {/* 뉴스 위젯 - Suspense 스트리밍 (below fold) */}
      <Suspense>
        <NewsWidget />
      </Suspense>
    </main>
  );
}
