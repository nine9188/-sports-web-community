'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PlayerTabNavigationProps {
  activeTab?: string;
}

export default function PlayerTabNavigation({ activeTab = 'stats' }: PlayerTabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 현재 활성화된 탭 확인
  const isActive = useCallback((tabId: string) => {
    return activeTab === tabId;
  }, [activeTab]);
  
  // 탭 클릭 핸들러
  const handleTabClick = (tabId: string) => {
    // 현재 URL 파라미터 복사
    const params = new URLSearchParams(searchParams);
    
    // tab 파라미터 설정
    if (tabId === 'stats') {
      params.delete('tab'); // 기본 탭은 파라미터 제거
    } else {
      params.set('tab', tabId);
    }
    
    // 새 URL로 이동
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <div className="mb-4">
      <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10 overflow-x-auto">
        <button
          onClick={() => handleTabClick('stats')}
          className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
            isActive('stats') || isActive('overview')
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          선수 통계
        </button>
        <button
          onClick={() => handleTabClick('fixtures')}
          className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
            isActive('fixtures')
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          경기별 통계
        </button>
        <button
          onClick={() => handleTabClick('rankings')}
          className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
            isActive('rankings')
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          순위
        </button>
        <button
          onClick={() => handleTabClick('transfers')}
          className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
            isActive('transfers')
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          이적 기록
        </button>
        <button
          onClick={() => handleTabClick('injuries')}
          className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
            isActive('injuries')
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          부상 기록
        </button>
        <button
          onClick={() => handleTabClick('trophies')}
          className={`px-4 py-3 text-sm font-medium flex-1 whitespace-nowrap ${
            isActive('trophies')
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          트로피
        </button>
      </div>
    </div>
  );
} 