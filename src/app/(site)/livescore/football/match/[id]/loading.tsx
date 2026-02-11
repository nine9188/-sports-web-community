import { MatchHeaderSkeleton } from '@/domains/livescore/components/common/HeadersUI';

export default function Loading() {
  return (
    <div
      className="container opacity-0"
      style={{ animation: 'fadeIn 0.3s ease-in 0.7s forwards' }}
    >
      <div className="flex gap-4">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <MatchHeaderSkeleton />
          {/* 모바일용 경기 정보 스켈레톤 */}
          <div className="xl:hidden mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
                  <div className="h-4 w-32 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* 탭 네비게이션 스켈레톤 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm mb-4 animate-pulse">
            <div className="flex gap-1 p-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 flex-1 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
              ))}
            </div>
          </div>
          {/* 콘텐츠 영역 스켈레톤 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* 사이드바 스켈레톤 - 데스크탑에서만 표시 */}
        <aside className="hidden xl:block w-[300px] shrink-0 space-y-4">
          {/* 경기 정보 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-5 w-24 bg-[#F5F5F5] dark:bg-[#262626] rounded mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-16 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
                  <div className="h-4 w-28 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
                </div>
              ))}
            </div>
          </div>
          {/* 승무패 예측 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-5 w-28 bg-[#F5F5F5] dark:bg-[#262626] rounded mb-3" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 flex-1 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
              ))}
            </div>
          </div>
          {/* 관련 게시글 */}
          <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-5 w-24 bg-[#F5F5F5] dark:bg-[#262626] rounded mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#F5F5F5] dark:bg-[#262626] rounded" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
