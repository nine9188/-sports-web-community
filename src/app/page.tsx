import React from 'react';
import { AllPostsWidget, NewsWidget, BoardCollectionWidget, BoardQuickLinksWidget } from '@/domains/widgets/components';
import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget/index';

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
export default function HomePage() {
  return (
    <main className="bg-transparent" style={{ overflow: 'visible' }}>
      {/* 게시판 바로가기 아이콘 - 라이브스코어 상단 */}
      <div className="mb-4 bg-transparent" style={{ overflow: 'visible' }}>
        <BoardQuickLinksWidget />
      </div>
      {/* LiveScore 위젯 V2 - 새로운 디자인 */}
      <div className="mb-4">
        <LiveScoreWidgetV2 />
      </div>

      {/* 게시판 모음 위젯 */}
      <div className="mb-4">
        <BoardCollectionWidget />
      </div>

      {/* 게시글 리스트 위젯 - 즉시 렌더링 */}
      <div className="mb-4">
        <AllPostsWidget />
      </div>

      {/* 뉴스 위젯 - 즉시 렌더링 */}
      <NewsWidget />
    </main>
  );
}
