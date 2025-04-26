'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, use } from 'react';
import PlayerHeader from '../components/PlayerHeader';
import PlayerHeaderSkeleton from '../components/PlayerHeaderSkeleton';
import PlayerTabNavigation from './PlayerTabNavigation';
import TabContent from './TabContent';

// 플레이스홀더 로딩 컴포넌트
function ContentLoading() {
  return (
    <div className="p-4 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
    </div>
  );
}

// 플레이스홀더 로딩 컴포넌트
function PlayerHeaderWrapper({ playerId }: { playerId: string }) {
  return (
    <Suspense fallback={<PlayerHeaderSkeleton />}>
      <PlayerHeader playerId={playerId} />
    </Suspense>
  );
}

// Next.js 14에서는 params가 Promise로 변경됨
export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  // params promise에서 값 추출
  const resolvedParams = use(params) as { id: string };
  const playerId = resolvedParams.id;
  
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';
  
  return (
    <div className="container">
      {/* PlayerHeader 컴포넌트 */}
      <PlayerHeaderWrapper playerId={playerId} />
      
      {/* 탭 네비게이션 */}
      <PlayerTabNavigation activeTab={tab} />
      
      {/* 탭 컨텐츠 */}
      <Suspense fallback={<ContentLoading />}>
        <TabContent tab={tab} playerId={playerId} />
      </Suspense>
    </div>
  );
} 