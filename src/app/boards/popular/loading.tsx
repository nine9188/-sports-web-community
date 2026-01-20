import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function PopularPostsLoading() {
  return (
    <div className="container mx-auto">
      {/* 게시판 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
          <div className={`${skeletonText} w-32`} />
          <div className="ml-auto">
            <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
          </div>
        </div>
      </div>

      {/* 기간 필터 (오늘/이번주/이번달/전체) */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className={`${skeletonBase} w-12 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-12 h-8 rounded-md`} />
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

      {/* 게시글 목록 - 카드 스타일 (썸네일 포함) */}
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
