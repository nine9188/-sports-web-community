import { memo } from 'react';
import React from 'react';

// 로딩 상태 표시 공통 컴포넌트
export const LoadingState = memo(({ message = '데이터를 불러오는 중...' }: { message?: string }) => {
  return (
    <div className="flex justify-center items-center py-8 bg-white rounded-lg border p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

// 에러 상태 표시 공통 컴포넌트
export const ErrorState = memo(({ message = '오류가 발생했습니다.' }: { message?: string }) => {
  return (
    <div className="text-center py-8 bg-white rounded-lg border border-red-100 p-4">
      <div className="text-red-500 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1">오류 발생</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
});

ErrorState.displayName = 'ErrorState';

// 데이터 없음 상태 표시 공통 컴포넌트
export const EmptyState = memo(({ title = '데이터가 없습니다', message = '현재 이 정보를 제공할 수 없습니다.' }: { title?: string; message?: string }) => {
  return (
    <div className="text-center py-8 bg-white rounded-lg border p-4">
      <div className="text-gray-500 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// 플레이어 프로필 로딩 컴포넌트 (애니메이션 추가)
export const PlayerProfileLoadingState = memo(() => {
  return (
    <div className="animate-pulse bg-white rounded-lg border overflow-hidden mt-4 md:mt-0">
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

/**
 * 확인 액션 대기 컴포넌트
 * @param {() => void} onConfirm - 확인 버튼 클릭 시 콜백
 * @param {() => void} onCancel - 취소 버튼 클릭 시 콜백
 * @param {string} title - 표시할 제목
 * @param {string} message - 표시할 메시지
 */
export function ConfirmAction({ 
  onConfirm, 
  onCancel, 
  title = '정말 진행하시겠습니까?', 
  message = '이 작업은 되돌릴 수 없습니다.'
}: {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div className="text-center py-6 bg-white rounded-lg border p-4 mb-4">
      <div className="text-yellow-500 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      
      <div className="flex justify-center space-x-3">
        <button 
          onClick={onCancel} 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          취소
        </button>
        <button 
          onClick={onConfirm} 
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          확인
        </button>
      </div>
    </div>
  );
} 