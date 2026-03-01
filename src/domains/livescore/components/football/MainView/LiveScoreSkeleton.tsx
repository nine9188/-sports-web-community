/** 라이브스코어 로딩 스켈레톤 — 3개 리그 × 3경기 */
export default function LiveScoreSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-white dark:bg-[#1D1D1D] md:rounded-lg overflow-hidden border border-black/7 dark:border-0">
          {/* 리그 헤더 스켈레톤 */}
          <div className="h-12 px-4 flex items-center gap-3 bg-[#F5F5F5] dark:bg-[#262626]">
            <div className="w-5 h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
          </div>

          {/* 매치 카드 스켈레톤 */}
          {[1, 2, 3].map((match, idx) => (
            <div key={match} className={`h-12 px-4 flex items-center ${idx !== 2 ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
              {/* 시간 */}
              <div className="w-14 flex-shrink-0 flex items-center">
                <div className="w-10 h-5 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
              </div>

              {/* 홈팀 */}
              <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                <div className="h-3 w-20 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-[#F5F5F5] dark:bg-[#262626] rounded-full animate-pulse flex-shrink-0"></div>
              </div>

              {/* 스코어 */}
              <div className="px-2 flex-shrink-0">
                <div className="w-12 h-4 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
              </div>

              {/* 원정팀 */}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 bg-[#F5F5F5] dark:bg-[#262626] rounded-full animate-pulse flex-shrink-0"></div>
                <div className="h-3 w-20 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
