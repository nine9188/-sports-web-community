import { skeletonCard, skeletonHeader, skeletonText } from '@/shared/styles';

export default function ShopLoading() {
  return (
    <div className="container mx-auto">
      {/* 상점 헤더 스켈레톤 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto flex items-center gap-2">
            <div className={`${skeletonText} w-20`} />
            <div className={`${skeletonText} w-16`} />
          </div>
        </div>
      </div>

      {/* 카테고리 탭 스켈레톤 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="p-4 flex gap-2 overflow-hidden">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-[#F5F5F5] dark:bg-[#262626] rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* 아이템 그리드 스켈레톤 */}
      <div className={skeletonCard}>
        <div className={skeletonHeader} />
        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] animate-pulse" />
              <div className={`${skeletonText} w-12`} />
              <div className={`${skeletonText} w-10 opacity-60`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
