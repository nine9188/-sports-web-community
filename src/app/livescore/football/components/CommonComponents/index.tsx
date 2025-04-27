import { memo } from 'react';

// 로딩 상태 표시 공통 컴포넌트
export const LoadingState = memo(({ message = '데이터를 불러오는 중...' }: { message?: string }) => {
  return (
    <div className="mb-4 bg-white rounded-lg border p-4">
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

// 에러 상태 표시 공통 컴포넌트
export const ErrorState = memo(({ message = '오류가 발생했습니다.' }: { message?: string }) => {
  return (
    <div className="mb-4 bg-white rounded-lg border p-4">
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-red-500 mb-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">오류 발생</p>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
});

ErrorState.displayName = 'ErrorState';

// 데이터 없음 상태 표시 공통 컴포넌트
export const EmptyState = memo(({ title = '데이터가 없습니다', message = '현재 이 정보를 제공할 수 없습니다.' }: { title?: string; message?: string }) => {
  return (
    <div className="mb-4 bg-white rounded-lg border p-4">
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-gray-400 mb-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// 플레이어 프로필 로딩 컴포넌트 (애니메이션 추가)
export const PlayerProfileLoadingState = memo(() => {
  return (
    <div className="animate-pulse bg-white rounded-lg border overflow-hidden mt-4 md:mt-0 mb-4">
      <div className="flex flex-col md:flex-row items-stretch p-4 md:p-6">
        <div className="flex flex-row items-center gap-4 md:gap-6 md:w-1/3">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="flex-1 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-8">
          <div className="h-5 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden">
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

PlayerProfileLoadingState.displayName = 'PlayerProfileLoadingState'; 