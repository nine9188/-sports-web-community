import { skeletonBase, skeletonCard, skeletonText } from '@/shared/styles';

export default function MatchLoading() {
  return (
    <div className="container mx-auto">
      {/* 경기 헤더 */}
      <div className="mb-4 bg-white dark:bg-[#1D1D1D] p-4 rounded-lg border border-black/7 dark:border-0">
        {/* 리그 정보 + 날짜 */}
        <div className="flex items-center gap-2 justify-between mb-3 border-b border-black/5 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
            <div className={`${skeletonBase} h-4 w-20 rounded`} />
          </div>
          <div className="flex flex-col items-center">
            <div className={`${skeletonBase} h-5 w-16 rounded mb-1`} />
            <div className={`${skeletonBase} h-3 w-24 rounded`} />
          </div>
          <div className="w-20" />
        </div>

        {/* 팀 vs 팀 */}
        <div className="flex justify-between items-center py-2">
          {/* 홈팀 */}
          <div className="w-1/3 flex flex-col items-center">
            <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
            <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
          </div>
          {/* 스코어 */}
          <div className="flex flex-col items-center">
            <div className={`${skeletonBase} h-8 w-20 rounded mb-2`} />
          </div>
          {/* 원정팀 */}
          <div className="w-1/3 flex flex-col items-center">
            <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
            <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-3 flex gap-4">
          {['개요', '라인업', '통계', '순위'].map((_, i) => (
            <div key={i} className={`${skeletonBase} w-16 h-8 rounded`} />
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className={skeletonCard}>
        <div className="p-4 space-y-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonText} ${i % 2 === 0 ? 'w-full' : 'w-3/4'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
