'use client';

import { useState, useCallback } from 'react';

interface TabInfo {
  id: string;
  name: string;
}

interface BoardTabButtonsClientProps {
  tabs: TabInfo[];
  variant: 'desktop' | 'mobile';
}

// 탭 버튼 스타일 상수
const TAB_ACTIVE_CLASS = 'flex-1 text-xs py-2 px-1 whitespace-nowrap transition-colors bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] font-medium text-gray-900 dark:text-[#F0F0F0]';
const TAB_INACTIVE_CLASS = 'flex-1 text-xs py-2 px-1 whitespace-nowrap transition-colors bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]';

/**
 * 게시판 탭 버튼 클라이언트 컴포넌트
 *
 * LCP 최적화:
 * - 탭 콘텐츠는 서버에서 렌더링됨 (이 컴포넌트 밖)
 * - 이 컴포넌트는 탭 버튼 렌더링 + 전환 로직만 담당
 * - onClick으로 data-tab-content 토글 (useEffect 불필요)
 */
export default function BoardTabButtonsClient({
  tabs,
  variant,
}: BoardTabButtonsClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 탭 전환: data-attribute 기반으로 콘텐츠 show/hide
  const switchTab = useCallback((newIndex: number) => {
    setSelectedIndex(newIndex);

    // 해당 variant의 컨테이너 찾기
    const container = document.querySelector(`[data-board-collection="${variant}"]`);
    if (!container) return;

    // 모든 탭 콘텐츠 토글
    container.querySelectorAll('[data-tab-content]').forEach((el, idx) => {
      el.classList.toggle('hidden', idx !== newIndex);
      el.classList.toggle('block', idx === newIndex);
    });
  }, [variant]);

  return (
    <div className="flex border-b border-black/5 dark:border-white/10">
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => switchTab(idx)}
          className={idx === selectedIndex ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
