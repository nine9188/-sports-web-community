import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

/**
 * 핫딜 게시판용 로딩 스켈레톤 (image-table 타입)
 *
 * 이 라우트 그룹 내의 모든 핫딜 게시판에서 사용됩니다:
 * - hotdeal
 * - hotdeal-food
 * - hotdeal-apptech
 * - hotdeal-beauty
 * - hotdeal-appliance
 * - hotdeal-living
 * - hotdeal-sale
 * - hotdeal-mobile
 */
export default function HotdealBoardLoading() {
  return (
    <div className="container mx-auto">
      {/* 브레드크럼 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <div className={`${skeletonText} w-8`} />
            <div className={`${skeletonBase} w-3.5 h-3.5 rounded`} />
            <div className={`${skeletonText} w-16`} />
            <div className={`${skeletonBase} w-3.5 h-3.5 rounded`} />
            <div className={`${skeletonText} w-20`} />
          </div>
        </div>
      </div>

      {/* 게시판 헤더 + 공지 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-24`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
        {/* 공지사항 영역 */}
        <div className="px-4 py-2 border-b border-black/5 dark:border-white/10">
          <div className={`${skeletonText} w-48`} />
        </div>
      </div>

      {/* 인기글 위젯 - 모바일 (탭 전환) */}
      <div className={`${skeletonCard} mb-4 md:hidden`}>
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className={`${skeletonBase} w-4 h-4 rounded`} />
            <div className={`${skeletonText} w-20`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`${skeletonText} w-8`} />
            <div className={`${skeletonBase} w-6 h-6 rounded`} />
          </div>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="px-3 py-1.5 flex items-center gap-2">
              <div className={`${skeletonText} w-4`} />
              <div className={`${skeletonText} flex-1`} />
            </div>
          ))}
        </div>
      </div>

      {/* 인기글 위젯 - PC (오늘 BEST / 이번주 BEST) */}
      <div className={`${skeletonCard} mb-4 hidden md:block`}>
        <div className="grid grid-cols-2">
          {/* 오늘 BEST */}
          <div className="border-r border-black/5 dark:border-white/10">
            <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonBase} w-4 h-4 rounded`} />
              <div className={`${skeletonText} w-20`} />
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2">
                  <div className={`${skeletonText} w-4`} />
                  <div className={`${skeletonText} flex-1`} />
                </div>
              ))}
            </div>
          </div>
          {/* 이번주 BEST */}
          <div>
            <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonBase} w-4 h-4 rounded`} />
              <div className={`${skeletonText} w-24`} />
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="px-3 py-1.5 flex items-center gap-2">
                  <div className={`${skeletonText} w-4`} />
                  <div className={`${skeletonText} flex-1`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 호버 메뉴 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 게시글 목록 - image-table 타입 스켈레톤 */}
      <div className={skeletonCard}>
        <div className={skeletonDivider}>
          {Array(15).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2">
              {/* 추천 수 (데스크톱) */}
              <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-4 h-4 rounded`} />
              </div>

              {/* 썸네일 이미지 */}
              <div className={`${skeletonBase} w-20 h-14 sm:w-24 sm:h-16 rounded-lg flex-shrink-0`} />

              {/* 게시글 정보 */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* 제목 */}
                <div className={`${skeletonText} w-full max-w-[300px]`} />
                {/* 메타 정보 */}
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-16`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-10`} />
                    <div className={`${skeletonText} w-12`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10`} />
        ))}
      </div>
    </div>
  );
}
