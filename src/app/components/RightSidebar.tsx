'use client';

import TopicTabs from './rsidebar/TopicTabs'; // TopicTabs 임포트 (파일 이름 확인 필요)

// children prop 제거
export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="h-full pt-4">
        {/* TopicTabs 직접 렌더링 */}
        <TopicTabs />
      </div>
    </aside>
  );
} 