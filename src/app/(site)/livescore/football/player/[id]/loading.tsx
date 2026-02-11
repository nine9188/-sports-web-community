import { PlayerHeaderSkeleton } from '@/domains/livescore/components/common/HeadersUI';

export default function Loading() {
  return (
    <div
      className="opacity-0"
      style={{ animation: 'fadeIn 0.3s ease-in 0.7s forwards' }}
    >
      <PlayerHeaderSkeleton />
      {/* 탭 네비게이션 스켈레톤 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow-sm mb-4 animate-pulse">
        <div className="flex gap-1 p-1">
          {Array.from({ length: 5 }).map((_, i) => (
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
  );
}
