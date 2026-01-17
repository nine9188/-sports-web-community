'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { POPULAR_STORES } from '../../types/hotdeal';

interface StoreFilterMenuProps {
  boardSlug: string;
}

/**
 * 핫딜 게시판 쇼핑몰 필터 메뉴 (다중 선택)
 * HoverMenu와 동일한 스타일
 */
export default function StoreFilterMenu({ boardSlug }: StoreFilterMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeParam = searchParams.get('store');

  // 현재 선택된 쇼핑몰들 (쉼표로 구분)
  const selectedStores = storeParam ? storeParam.split(',') : [];

  // 쇼핑몰 토글 (선택/해제)
  const toggleStore = (store: string) => {
    const params = new URLSearchParams(searchParams.toString());

    let newStores: string[];
    if (selectedStores.includes(store)) {
      // 이미 선택된 경우 제거
      newStores = selectedStores.filter(s => s !== store);
    } else {
      // 선택되지 않은 경우 추가
      newStores = [...selectedStores, store];
    }

    // URL 업데이트
    if (newStores.length === 0) {
      params.delete('store');
    } else {
      params.set('store', newStores.join(','));
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  // 전체 선택 (필터 초기화)
  const selectAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('store');
    router.push(pathname + (params.toString() ? `?${params.toString()}` : ''));
  };

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg mb-4 border border-black/7 dark:border-0 overflow-visible">
      <div className="px-4 py-2.5 relative overflow-visible">
        <nav className="flex items-center justify-between gap-2">
          {/* 전체 버튼 - 세로 중앙 정렬 */}
          <button
            onClick={selectAll}
            className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md flex items-center gap-1 transition-colors text-gray-700 dark:text-gray-300 flex-shrink-0 ${
              selectedStores.length === 0 ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            전체
          </button>

          {/* 쇼핑몰 필터 탭들 - flex-wrap */}
          <div className="flex items-center gap-1 flex-1 flex-wrap">
            {POPULAR_STORES.map((store) => {
              const isSelected = selectedStores.includes(store);

              return (
                <button
                  key={store}
                  onClick={() => toggleStore(store)}
                  className={`px-2 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md flex items-center gap-1 transition-colors text-gray-700 dark:text-gray-300 ${
                    isSelected ? 'bg-[#EAEAEA] dark:bg-[#333333]' : ''
                  }`}
                >
                  {store}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
