import React from 'react';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget } from '@/domains/widgets/components';
import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget/index';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '4590 Football - 실시간 축구 스코어, 경기 일정, 팀·선수 정보, 축구 커뮤니티',
    description: '프리미어리그(EPL), 라리가, 세리에A, 챔피언스리그 등 주요 리그의 실시간 라이브스코어와 경기 일정, 팀·선수 통계 정보를 제공하며 축구 팬들과 소통할 수 있는 플랫폼입니다.',
    path: '/',
    titleOnly: true,
  });
}

// 메인 페이지 컴포넌트
export default function HomePage() {
  return (
    <main className="bg-transparent space-y-4 overflow-visible">
      {/* 게시판 바로가기 아이콘 - 라이브스코어 상단 */}
      <div className="bg-transparent overflow-visible">
        <BoardQuickLinksWidget />
      </div>
      {/* LiveScore 위젯 V2 - 새로운 디자인 */}
      <LiveScoreWidgetV2 />

      {/* 게시판 모음 위젯 */}
      <BoardCollectionWidget />

      {/* 게시글 리스트 위젯 */}
      <AllPostsWidget />

      {/* 뉴스 위젯 */}
      <NewsWidget />
    </main>
  );
}
