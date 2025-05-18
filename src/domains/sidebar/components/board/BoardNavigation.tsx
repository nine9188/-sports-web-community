import { Suspense } from 'react';
import { getBoardsData } from '../../actions/boards';
import ClientBoardNavigation from './ClientBoardNavigation';

// 로딩 중 표시할 스켈레톤 UI
function BoardNavigationSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
        <div className="h-7 bg-gray-100 animate-pulse rounded mb-1.5"></div>
        <div className="h-7 bg-gray-100 animate-pulse rounded"></div>
      </div>
    </div>
  );
}

// 서버 컴포넌트 (기본 내보내기)
export default async function BoardNavigation() {
  try {
    // 서버 측에서 데이터 가져오기 (캐싱 적용)
    const initialData = await getBoardsData();
    
    return (
      <Suspense fallback={<BoardNavigationSkeleton />}>
        <ClientBoardNavigation initialData={initialData} />
      </Suspense>
    );
  } catch (error) {
    console.error('게시판 데이터 가져오기 오류:', error);
    // 에러 발생 시 스켈레톤 UI 대신 에러 메시지 표시
    return (
      <div className="rounded-md py-2">
        <p className="text-xs text-red-500">게시판 데이터를 불러오는데 실패했습니다.</p>
        <p className="text-xs text-gray-500 mt-1">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }
} 