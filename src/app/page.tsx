import React from 'react';
import { AllPostsWidget, NewsWidget, LiveScoreWidget, BannerWidget } from '@/domains/widgets/components';

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
export default function HomePage() {
  return (
    <main style={{ overflow: 'visible' }}>
      {/* 배너 위젯 - 메인 상단 */}
      <div style={{ overflow: 'visible' }}>
        <BannerWidget position="main_top" />
      </div>

      {/* LiveScore 위젯 - 즉시 렌더링 */}
      <div style={{ overflow: 'visible' }}>
        <LiveScoreWidget />
      </div>

      {/* 게시글 리스트 위젯 - 즉시 렌더링 */}
      <AllPostsWidget />

      {/* 뉴스 위젯 - 즉시 렌더링 */}
      <NewsWidget />

      {/* 배너 위젯 - 메인 하단 */}
      <div style={{ overflow: 'visible' }}>
        <BannerWidget position="main_bottom" />
      </div>
    </main>
  );
}
