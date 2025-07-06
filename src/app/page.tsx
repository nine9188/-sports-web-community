import React from 'react';
import { AllPostsWidget, NewsWidget, LiveScoreWidget, BannerWidget } from '@/domains/widgets/components';
import NavBoardSelector from '@/domains/widgets/navigation/NavBoardSelector';

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
export default function HomePage() {
  return (
    <main>
      <div className="mb-4 hidden md:block">
        <NavBoardSelector />
      </div>

      {/* 배너 위젯 - 메인 상단 */}
      <BannerWidget position="main_top" />

      {/* LiveScore 위젯 - 즉시 렌더링 */}
      <LiveScoreWidget />

      {/* 게시글 리스트 위젯 - 즉시 렌더링 */}
      <AllPostsWidget />

      {/* 뉴스 위젯 - 즉시 렌더링 */}
      <NewsWidget />

      {/* 배너 위젯 - 메인 하단 */}
      <BannerWidget position="main_bottom" />
    </main>
  );
}
