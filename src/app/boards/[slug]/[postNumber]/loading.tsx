import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function PostDetailLoading() {
  return (
    <div className="container mx-auto">
      {/* 브레드크럼 */}
      <div className="flex gap-2 mb-4 py-2">
        <div className={`${skeletonBase} w-12 h-4 rounded`} />
        <span className="text-gray-300 dark:text-gray-600">&gt;</span>
        <div className={`${skeletonBase} w-16 h-4 rounded`} />
        <span className="text-gray-300 dark:text-gray-600">&gt;</span>
        <div className={`${skeletonBase} w-20 h-4 rounded`} />
      </div>

      {/* 게시글 컨테이너 */}
      <div className={`${skeletonCard} mb-4`}>
        {/* 게시글 헤더 */}
        <div className="p-4 sm:px-6 border-b border-black/5 dark:border-white/10">
          {/* 제목 */}
          <div className={`${skeletonBase} w-3/4 h-7 rounded mb-4`} />
          {/* 작성자 정보 */}
          <div className="flex items-center gap-3">
            <div className={`${skeletonBase} w-10 h-10 rounded-full`} />
            <div className="flex-1">
              <div className={`${skeletonBase} w-20 h-4 rounded mb-1`} />
              <div className="flex gap-3">
                <div className={`${skeletonBase} w-24 h-3 rounded`} />
                <div className={`${skeletonBase} w-16 h-3 rounded`} />
                <div className={`${skeletonBase} w-16 h-3 rounded`} />
              </div>
            </div>
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="p-4 sm:px-6 min-h-[200px]">
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className={`${skeletonText} ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'}`} />
            ))}
          </div>
        </div>

        {/* 좋아요/싫어요 버튼 */}
        <div className="p-4 sm:px-6 border-t border-black/5 dark:border-white/10">
          <div className="flex justify-center gap-4">
            <div className={`${skeletonBase} w-24 h-10 rounded-lg`} />
            <div className={`${skeletonBase} w-24 h-10 rounded-lg`} />
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 (PostFooter) */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center justify-around">
          <div className={`${skeletonBase} w-16 h-7 rounded`} />
          <div className={`${skeletonBase} w-16 h-7 rounded`} />
          <div className={`${skeletonBase} w-16 h-7 rounded`} />
        </div>
      </div>

      {/* 이전글/다음글 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonDivider}>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className={`${skeletonBase} w-16 h-4 rounded`} />
            <div className={`${skeletonText} flex-1`} />
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className={`${skeletonBase} w-16 h-4 rounded`} />
            <div className={`${skeletonText} flex-1`} />
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
        </div>
        <div className="p-4 space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className={`${skeletonBase} w-10 h-10 rounded-full flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`${skeletonText} w-16`} />
                  <div className={`${skeletonBase} w-20 h-3 rounded`} />
                </div>
                <div className={`${skeletonText} w-full`} />
              </div>
            </div>
          ))}
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

      {/* 관련 게시글 목록 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonDivider}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-16 hidden sm:block`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className={`${skeletonBase} w-10 h-10 rounded`} />
        ))}
      </div>
    </div>
  );
}
