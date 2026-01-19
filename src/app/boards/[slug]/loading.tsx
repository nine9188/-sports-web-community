import { skeletonCard, skeletonHeader, skeletonText, skeletonDivider } from '@/shared/styles';

export default function BoardDetailLoading() {
  return (
    <div className="container mx-auto">
      {/* 게시판 헤더 스켈레톤 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonHeader} />
      </div>

      {/* 게시글 목록 스켈레톤 */}
      <div className={skeletonCard}>
        <div className={skeletonHeader} />
        <div className={skeletonDivider}>
          {Array(15).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              {/* 카테고리 */}
              <div className={`${skeletonText} w-14`} />
              {/* 제목 */}
              <div className={`${skeletonText} flex-1`} />
              {/* 작성자 */}
              <div className={`${skeletonText} w-16 hidden sm:block`} />
              {/* 날짜 */}
              <div className={`${skeletonText} w-20 hidden md:block`} />
              {/* 조회수 */}
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="w-10 h-10 rounded bg-[#F5F5F5] dark:bg-[#262626] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
