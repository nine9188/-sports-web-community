import React from 'react';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget } from '@/domains/widgets/components';
import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget/index';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '4590 Football',
    description: '실시간 축구 경기 일정과 스코어, 팀·선수 정보를 확인하고, 축구 팬들과 함께 소통할 수 있는 커뮤니티 플랫폼',
    path: '/',
    titleOnly: true, // 홈페이지는 사이트 이름만
  });
}

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
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

      {/* 게시글 리스트 위젯 - 즉시 렌더링 */}
      <AllPostsWidget />

      {/* 뉴스 위젯 - 즉시 렌더링 */}
      <NewsWidget />
    </main>
  );
}
