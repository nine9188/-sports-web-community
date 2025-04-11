'use client';

import dynamic from 'next/dynamic';

// 서버 컴포넌트를 클라이언트에서 사용하기 위해 동적 임포트 사용
const TopicTabs = dynamic(() => import('./rsidebar/TopicTabs'), {
  ssr: false,
  loading: () => (
    <div className="mb-4 bg-white rounded-lg border">
      <div className="px-3 py-2 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold">인기글</h3>
          <span className="text-xs text-gray-500">최근 24시간 기준</span>
        </div>
      </div>
      <div className="p-2 space-y-2">
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
});

export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0">
      <div className="h-full pt-4">
        <TopicTabs />
      </div>
    </aside>
  );
} 