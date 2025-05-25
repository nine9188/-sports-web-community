import React from 'react';
import { AllPostsWidget, NewsWidget, LiveScoreWidget } from '@/domains/widgets/components';
import NavBoardSelector from '@/domains/widgets/navigation/NavBoardSelector';

// 메인 페이지 컴포넌트 - 모든 로딩 제거하고 즉시 렌더링
export default function HomePage() {
  // 🔧 환경 변수 디버깅 (배포 환경에서만 확인용)
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 환경 변수 체크:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'
    });
  }

  return (
    <main>
      <div className="mb-4 hidden md:block">
        <NavBoardSelector />
      </div>

      {/* LiveScore 위젯 - 즉시 렌더링 */}
      <LiveScoreWidget />

      {/* 게시글 리스트 위젯 - 즉시 렌더링 */}
      <AllPostsWidget />

      {/* 뉴스 위젯 - 즉시 렌더링 */}
      <NewsWidget />
    </main>
  );
}
