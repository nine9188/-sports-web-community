// 서버 컴포넌트 및 클라이언트 컴포넌트 구분
import { Suspense } from 'react';
import BoardNavigationClient from './BoardNavigationClient';
import { getCachedBoardsData } from '@/app/lib/caching.server';

// 서버 컴포넌트 (기본 내보내기)
export default async function BoardNavigation() {
  // 서버 측에서 데이터 가져오기 (ISR 적용)
  const initialData = await getCachedBoardsData();
  
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
          <div className="h-7 bg-gray-100 animate-pulse rounded"></div>
        </div>
      </div>
    }>
      <BoardNavigationClient initialData={initialData} />
    </Suspense>
  );
} 