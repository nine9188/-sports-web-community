/** 라이브스코어 로딩 스켈레톤 — 3개 리그 × 3경기 (실제 MatchCard 레이아웃과 동일) */
export default function LiveScoreSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-white dark:bg-[#1D1D1D] md:rounded-lg overflow-hidden border border-black/7 dark:border-0">
          {/* 리그 헤더 스켈레톤 */}
          <div className="h-12 px-4 flex items-center gap-3 bg-[#F5F5F5] dark:bg-[#262626]">
            <div className="w-5 h-5 bg-gray-200 dark:bg-[#3A3A3A] rounded-full animate-pulse" />
            <div className="h-4 w-28 sm:w-32 bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse" />
          </div>

          {/* 매치 카드 스켈레톤 — 실제 MatchCard: h-12 px-4 flex items-center */}
          {[1, 2, 3].map((match, idx) => (
            <div
              key={match}
              className={`h-12 px-4 flex items-center ${idx !== 2 ? 'border-b border-black/5 dark:border-white/10' : ''}`}
            >
              {/* 상태/시간 — w-14 flex-shrink-0 */}
              <div className="w-14 flex-shrink-0 flex items-center">
                <div className="w-10 h-4 bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse" />
              </div>

              {/* 홈팀 — flex-1 justify-end */}
              <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                <div className="h-3 w-12 sm:w-16 bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse" />
                <div className="w-6 h-6 bg-gray-200 dark:bg-[#3A3A3A] rounded-full animate-pulse flex-shrink-0" />
              </div>

              {/* 스코어 — px-2 */}
              <div className="px-2 flex-shrink-0">
                <div className="w-10 h-4 bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse" />
              </div>

              {/* 원정팀 — flex-1 */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <div className="w-6 h-6 bg-gray-200 dark:bg-[#3A3A3A] rounded-full animate-pulse flex-shrink-0" />
                <div className="h-3 w-12 sm:w-16 bg-gray-200 dark:bg-[#3A3A3A] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
