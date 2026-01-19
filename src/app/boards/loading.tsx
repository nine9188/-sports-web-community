import { skeletonCard, skeletonHeader, skeletonText } from '@/shared/styles';

export default function BoardsLoading() {
  return (
    <div className="container mx-auto">
      {/* 게시판 목록 스켈레톤 */}
      <div className={skeletonCard}>
        <div className={skeletonHeader} />
        <div className="p-4 space-y-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-[#F5F5F5] dark:bg-[#262626] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-1/3`} />
                <div className={`${skeletonText} w-1/2 opacity-60`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
