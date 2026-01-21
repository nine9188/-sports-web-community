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
      <div className="space-y-4">
        {/* 1. 기본 정보 + 시즌 통계 (StatsCards) */}
        <div className={skeletonCard}>
          {/* 기본 정보 헤더 */}
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-16`} />
          </div>
          {/* 소제목 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 py-2 flex justify-center">
              <div className={`${skeletonText} w-14`} />
            </div>
            <div className="flex-1 py-2 flex justify-center">
              <div className={`${skeletonText} w-14`} />
            </div>
          </div>
          {/* 리그 정보 + 최근 5경기 */}
          <div className="flex items-center py-3">
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className={`${skeletonBase} w-6 h-6 rounded`} />
              <div className="space-y-1">
                <div className={`${skeletonText} w-20`} />
                <div className={`${skeletonText} w-16`} />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center gap-1">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={`${skeletonBase} w-6 h-6 rounded`} />
              ))}
            </div>
          </div>
          {/* 시즌 통계 헤더 */}
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] border-y border-black/5 dark:border-white/10">
            <div className={`${skeletonText} w-16`} />
          </div>
          {/* 시즌 통계 소제목 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="flex-1 py-2 flex justify-center">
                <div className={`${skeletonText} w-8`} />
              </div>
            ))}
          </div>
          {/* 시즌 통계 데이터 */}
          <div className="flex items-center py-3">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} className="flex-1 flex justify-center">
                <div className={`${skeletonText} w-6`} />
              </div>
            ))}
          </div>
          {/* 자세한 통계 보기 버튼 */}
          <div className="h-10 border-t border-black/5 dark:border-white/10 flex items-center justify-center">
            <div className={`${skeletonText} w-24`} />
          </div>
        </div>

        {/* 2. 리그 순위 (StandingsPreview) */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center gap-2 bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonBase} w-6 h-6 rounded`} />
            <div className={`${skeletonText} w-20`} />
          </div>
          {/* 테이블 헤더 */}
          <div className="flex items-center bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2">
            <div className={`${skeletonText} w-6`} />
            <div className={`${skeletonText} w-24 ml-3`} />
            <div className="flex-1" />
            <div className="flex gap-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className={`${skeletonText} w-6`} />
              ))}
            </div>
          </div>
          {/* 테이블 바디 */}
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center px-3 py-2 border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonText} w-6`} />
              <div className="flex items-center gap-2 ml-3">
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
              <div className="flex-1" />
              <div className="flex gap-3">
                {Array(4).fill(0).map((_, j) => (
                  <div key={j} className={`${skeletonText} w-6`} />
                ))}
              </div>
            </div>
          ))}
          {/* 전체 순위 보기 버튼 */}
          <div className="h-10 border-t border-black/5 dark:border-white/10 flex items-center justify-center">
            <div className={`${skeletonText} w-24`} />
          </div>
        </div>

        {/* 3. 최근 경기 (MatchItems) */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-16`} />
          </div>
          {/* 테이블 헤더 */}
          <div className="flex items-center bg-[#F5F5F5] dark:bg-[#262626] h-10 px-2">
            <div className={`${skeletonText} w-10`} />
            <div className={`${skeletonText} w-8 ml-2`} />
            <div className="flex-1 flex justify-center">
              <div className={`${skeletonText} w-10`} />
            </div>
            <div className={`${skeletonText} w-10`} />
          </div>
          {/* 테이블 바디 */}
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center h-12 px-2 border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonText} w-10`} />
              <div className={`${skeletonBase} w-5 h-5 rounded ml-2`} />
              <div className="flex-1 flex items-center justify-center gap-1">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-8`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-16`} />
              </div>
              <div className={`${skeletonBase} w-6 h-6 rounded`} />
            </div>
          ))}
        </div>

        {/* 4. 예정된 경기 (MatchItems) */}
        <div className={skeletonCard}>
          <div className="h-12 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626]">
            <div className={`${skeletonText} w-20`} />
          </div>
          {/* 테이블 헤더 */}
          <div className="flex items-center bg-[#F5F5F5] dark:bg-[#262626] h-10 px-2">
            <div className={`${skeletonText} w-14`} />
            <div className={`${skeletonText} w-8 ml-2`} />
            <div className="flex-1 flex justify-center">
              <div className={`${skeletonText} w-10`} />
            </div>
          </div>
          {/* 테이블 바디 */}
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center h-12 px-2 border-b border-black/5 dark:border-white/10">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonBase} w-5 h-5 rounded ml-2`} />
              <div className="flex-1 flex items-center justify-center gap-1">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-6`} />
                <div className={`${skeletonBase} w-5 h-5 rounded`} />
                <div className={`${skeletonText} w-16`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
