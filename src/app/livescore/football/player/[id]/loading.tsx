import { skeletonBase, skeletonCard, skeletonText } from '@/shared/styles';

export default function PlayerLoading() {
  return (
    <div className="container">
      {/* 선수 헤더 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* 선수 사진 */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
              <div className={`${skeletonBase} w-full h-full rounded-full`} />
              {/* 팀 배지 */}
              <div className={`${skeletonBase} absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full`} />
            </div>

            {/* 선수 정보 */}
            <div className="flex-1 min-w-0">
              <div className={`${skeletonBase} w-32 h-6 rounded mb-2`} />
              <div className="flex items-center gap-2 mb-1">
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-24`} />
              </div>
              <div className={`${skeletonText} w-16`} />
            </div>
          </div>

          {/* 추가 정보 (생년월일, 국적, 키/체중 등) */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className={`${skeletonText} w-12 mb-1 opacity-70`} />
                <div className={`${skeletonText} w-20`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
            <div className={`${skeletonBase} w-14 h-7 rounded-md`} />
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 - 통계 */}
      <div className={skeletonCard}>
        <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-24`} />
        </div>

        {/* 시즌 통계 테이블 */}
        <div className="p-4">
          {/* 테이블 헤더 */}
          <div className="flex items-center gap-4 mb-3 pb-2 border-b border-black/5 dark:border-white/10">
            <div className={`${skeletonText} w-16`} />
            <div className={`${skeletonText} w-12`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-10`} />
          </div>

          {/* 테이블 행들 */}
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="flex items-center gap-2 w-32">
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
              <div className={`${skeletonText} w-8`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
