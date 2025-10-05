import React from 'react';
import { AllPostsWidget, NewsWidget, LiveScoreWidget, BannerWidget } from '@/domains/widgets/components';

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
export default function HomePage() {
  return (
    <main style={{ overflow: 'visible' }}>
      {/* 배너 위젯 - 메인 상단 (상단 여백 없음, 하단 간격 최소화) */}
      <div className="mb-2" style={{ overflow: 'visible' }}>
        <BannerWidget position="main_top" />
      </div>

      {/* LiveScore 위젯 - 상단 여백 없음, 하단 mb-4 */}
      <div className="mb-4" style={{ overflow: 'visible' }}>
        <LiveScoreWidget />
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
