import React from 'react';
import { AllPostsWidget, NewsWidget, LiveScoreWidget, BannerWidget, BoardCollectionWidget } from '@/domains/widgets/components';

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
export default function HomePage() {
  return (
    <main style={{ overflow: 'visible' }}>
      {/* 배너 위젯 - 메인 상단 (상단 여백 없음, 하단 간격 최소화) */}
      <div className="mb-2" style={{ overflow: 'visible' }}>
        <BannerWidget position="main_top" />
      </div>

      {/* LiveScore 위젯 - 상단 여백 없음, 하단 mb-4 */}
      <div className="mb-2" style={{ overflow: 'visible' }}>
        <LiveScoreWidget />
      </div>

      {/* 게시판 모음 위젯 + 빈 컨테이너 */}
      <div className="mb-2 grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="md:col-span-3">
          <BoardCollectionWidget />
        </div>
        <div className="hidden md:flex md:flex-col gap-2">
          <div className="bg-white rounded-lg border p-4 flex-1">
            {/* 우측 상단 빈 공간 */}
          </div>
          <div className="bg-white rounded-lg border p-4 flex-1">
            {/* 우측 하단 빈 공간 */}
          </div>
        </div>
      </div>

      {/* 게시글 리스트 위젯 - 즉시 렌더링 */}
      <div className="mb-2">
        <AllPostsWidget />
      </div>

      {/* 뉴스 위젯 - 즉시 렌더링 */}
      <NewsWidget />
    </main>
  );
}
