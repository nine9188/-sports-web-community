import { skeletonBase, skeletonCard, skeletonText } from '@/shared/styles';

export default function TeamLoading() {
  return (
    <div className="container mx-auto w-full">
      {/* 팀 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="flex flex-col md:flex-row items-start">
          {/* 팀 로고 및 기본 정보 */}
          <div className="flex items-center p-2 md:p-4 md:w-96 flex-shrink-0">
            <div className={`${skeletonBase} w-16 h-16 md:w-20 md:h-20 rounded-lg mr-3 md:mr-4 flex-shrink-0`} />
            <div className="flex flex-col justify-center">
              <div className={`${skeletonBase} w-32 h-6 rounded mb-2`} />
              <div className={`${skeletonText} w-20 mb-1`} />
              <div className="flex items-center gap-2">
                <div className={`${skeletonText} w-24`} />
                <div className={`${skeletonBase} w-10 h-5 rounded`} />
              </div>
            </div>
          </div>

          {/* 홈구장 정보 */}
          <div className="border-t md:border-t-0 md:border-l border-black/5 dark:border-white/10 p-2 md:p-4 flex-1 w-full">
            <div className="flex gap-3">
              <div className={`${skeletonBase} w-24 h-16 md:w-36 md:h-24 rounded flex-shrink-0`} />
              <div className="flex-1">
                <div className={`${skeletonBase} w-32 h-5 rounded mb-2`} />
                <div className={`${skeletonText} w-40 mb-1`} />
                <div className={`${skeletonText} w-28`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 - 개요 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 최근 경기 */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-20`} />
          </div>
          <div className="p-4 space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
                <div className={`${skeletonText} w-10`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
            ))}
          </div>
        </div>

        {/* 리그 순위 */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-20`} />
          </div>
          <div className="p-4 space-y-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} flex-1`} />
                <div className={`${skeletonText} w-8`} />
                <div className={`${skeletonText} w-8`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
