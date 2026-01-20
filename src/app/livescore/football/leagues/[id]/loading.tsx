import { skeletonBase, skeletonCard, skeletonText } from '@/shared/styles';

export default function LeagueDetailLoading() {
  return (
    <div className="min-h-screen space-y-4">
      {/* 리그 헤더 */}
      <div className={skeletonCard}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className={`${skeletonBase} w-16 h-16 rounded-lg`} />
            <div className="flex-1">
              <div className={`${skeletonBase} w-40 h-6 rounded mb-2`} />
              <div className={`${skeletonText} w-24`} />
            </div>
          </div>
        </div>
      </div>

      {/* 순위 테이블 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>

        {/* 테이블 헤더 */}
        <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center gap-4">
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-32`} />
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-8`} />
          <div className={`${skeletonText} w-10`} />
          <div className={`${skeletonText} w-8`} />
        </div>

        {/* 테이블 행들 */}
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center gap-4">
            <div className={`${skeletonText} w-6`} />
            <div className="flex items-center gap-2 w-32">
              <div className={`${skeletonBase} w-6 h-6 rounded`} />
              <div className={`${skeletonText} w-20`} />
            </div>
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-8`} />
          </div>
        ))}
      </div>
    </div>
  );
}
