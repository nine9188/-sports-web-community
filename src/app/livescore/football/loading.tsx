import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function FootballLivescoreLoading() {
  return (
    <div className="min-h-screen">
      {/* 날짜 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-14 flex items-center justify-center gap-2 px-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} w-12 h-10 rounded-lg`} />
          ))}
        </div>
      </div>

      {/* 리그별 경기 목록 */}
      {Array(3).fill(0).map((_, leagueIdx) => (
        <div key={leagueIdx} className={`${skeletonCard} mb-4`}>
          {/* 리그 헤더 */}
          <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
            <div className={`${skeletonText} w-32`} />
          </div>
          {/* 경기 목록 */}
          <div className={skeletonDivider}>
            {Array(3).fill(0).map((_, matchIdx) => (
              <div key={matchIdx} className="px-4 py-3 flex items-center">
                <div className={`${skeletonText} w-12`} />
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className={`${skeletonText} w-20`} />
                  <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                  <div className={`${skeletonText} w-10`} />
                  <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                  <div className={`${skeletonText} w-20`} />
                </div>
                <div className={`${skeletonText} w-12`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
