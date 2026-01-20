import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function SearchLoading() {
  return (
    <div className="container mx-auto">
      {/* 검색 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-4 sm:px-6">
          <div className={`${skeletonBase} w-48 h-6 rounded mb-2`} />
          <div className={`${skeletonText} w-64`} />
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-3 flex gap-2">
          <div className={`${skeletonBase} w-16 h-8 rounded-full`} />
          <div className={`${skeletonBase} w-12 h-8 rounded-full`} />
          <div className={`${skeletonBase} w-16 h-8 rounded-full`} />
          <div className={`${skeletonBase} w-12 h-8 rounded-full`} />
        </div>
      </div>

      {/* 검색 결과 목록 */}
      <div className={skeletonCard}>
        {/* 섹션 헤더 */}
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>

        {/* 결과 아이템들 */}
        <div className={skeletonDivider}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-3/4`} />
                <div className={`${skeletonText} w-1/2 opacity-70`} />
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
