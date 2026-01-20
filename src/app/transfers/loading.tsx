import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function TransfersLoading() {
  return (
    <div className="min-h-screen">
      {/* 헤더 섹션 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
          <div className="flex items-center gap-2">
            <div className={`${skeletonBase} w-2 h-2 rounded-full`} />
            <div className={`${skeletonText} w-24`} />
          </div>
        </div>
        <div className="px-4 py-3 bg-white dark:bg-[#1D1D1D]">
          <div className={`${skeletonText} w-64`} />
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className={`${skeletonCard} mt-4`}>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          <div className={`${skeletonBase} w-28 h-9 rounded-lg`} />
          <div className={`${skeletonBase} w-28 h-9 rounded-lg`} />
          <div className={`${skeletonBase} w-24 h-9 rounded-lg`} />
          <div className={`${skeletonBase} w-20 h-9 rounded-lg`} />
        </div>
      </div>

      {/* 이적 목록 */}
      <div className={`${skeletonCard} mt-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-28`} />
        </div>

        <div className={skeletonDivider}>
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              {/* 선수 사진 */}
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />

              {/* 선수 정보 */}
              <div className="flex-1 min-w-0">
                <div className={`${skeletonText} w-24 mb-1`} />
                <div className="flex items-center gap-2">
                  <div className={`${skeletonBase} w-5 h-5 rounded`} />
                  <div className={`${skeletonText} w-20`} />
                  <span className="text-gray-400">→</span>
                  <div className={`${skeletonBase} w-5 h-5 rounded`} />
                  <div className={`${skeletonText} w-20`} />
                </div>
              </div>

              {/* 이적료/날짜 */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className={`${skeletonText} w-16 mb-1`} />
                <div className={`${skeletonText} w-20 opacity-70`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10 rounded`} />
        ))}
      </div>
    </div>
  );
}
