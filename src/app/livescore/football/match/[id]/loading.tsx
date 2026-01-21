import { skeletonBase, skeletonCard } from '@/shared/styles';

export default function MatchLoading() {
  return (
    <div className="container">
      <div className="flex gap-4">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 경기 헤더 */}
          <div className="mb-4 bg-white dark:bg-[#1D1D1D] p-4 rounded-lg border border-black/7 dark:border-0">
            {/* 리그 정보 + 날짜 */}
            <div className="flex items-center gap-2 justify-between mb-3 border-b border-black/5 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonBase} h-4 w-20 rounded`} />
              </div>
              <div className="flex flex-col items-center">
                <div className={`${skeletonBase} h-5 w-16 rounded mb-1`} />
                <div className={`${skeletonBase} h-3 w-24 rounded`} />
              </div>
              <div className="w-20" />
            </div>

            {/* 팀 vs 팀 */}
            <div className="flex justify-between items-center py-2">
              {/* 홈팀 */}
              <div className="w-1/3 flex flex-col items-center">
                <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
                <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
              </div>
              {/* 스코어 */}
              <div className="flex flex-col items-center">
                <div className={`${skeletonBase} h-8 w-20 rounded mb-2`} />
              </div>
              {/* 원정팀 */}
              <div className="w-1/3 flex flex-col items-center">
                <div className={`${skeletonBase} w-14 h-14 rounded-full mb-2`} />
                <div className={`${skeletonBase} h-4 w-20 rounded mb-1`} />
              </div>
            </div>
          </div>

          {/* 모바일용 경기 상세정보 스켈레톤 */}
          <div className="xl:hidden mb-4">
            <div className={skeletonCard}>
              <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
                <div className={`${skeletonBase} w-24 h-4 rounded`} />
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className={`${skeletonBase} w-12 h-4 rounded`} />
                    <div className={`${skeletonBase} w-24 h-4 rounded`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-4">
            <div className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-0 overflow-hidden flex">
              {/* 모바일에서만 보이는 응원 탭 */}
              <div className={`${skeletonBase} h-12 flex-1 xl:hidden`} />
              {/* 나머지 탭들: 전력, 이벤트, 라인업, 통계, 순위 */}
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className={`${skeletonBase} h-12 flex-1`} />
              ))}
            </div>
          </div>

          {/* 탭 콘텐츠 - Power 탭 스켈레톤 (기본 탭) */}

          {/* 1. 팀 비교 Container */}
          <div className={`${skeletonCard} mb-4`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-16 h-4 rounded`} />
            </div>
            <div className="p-4">
              {/* VS 행 */}
              <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1">
                <div className="flex items-center justify-end gap-2">
                  <div className={`${skeletonBase} w-20 h-5 rounded`} />
                  <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                </div>
                <div className="text-center">
                  <div className={`${skeletonBase} w-8 h-6 rounded mx-auto`} />
                </div>
                <div className="flex items-center justify-start gap-2">
                  <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                  <div className={`${skeletonBase} w-20 h-5 rounded`} />
                </div>
              </div>

              {/* 순위/전적 행 */}
              <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 mt-2">
                <div className="flex justify-end">
                  <div className={`${skeletonBase} w-28 h-3 rounded`} />
                </div>
                <div />
                <div className="flex justify-start">
                  <div className={`${skeletonBase} w-28 h-3 rounded`} />
                </div>
              </div>

              {/* 평균득점 행 */}
              <div className="mt-4 grid grid-cols-[3fr_1fr_3fr] items-center gap-1">
                <div className="flex items-center justify-end gap-2">
                  <div className={`${skeletonBase} h-2 flex-1 rounded`} />
                  <div className={`${skeletonBase} w-10 h-4 rounded`} />
                </div>
                <div className="text-center">
                  <div className={`${skeletonBase} w-14 h-3 rounded mx-auto`} />
                </div>
                <div className="flex items-center justify-start gap-2">
                  <div className={`${skeletonBase} w-10 h-4 rounded`} />
                  <div className={`${skeletonBase} h-2 flex-1 rounded`} />
                </div>
              </div>

              {/* 평균실점 행 */}
              <div className="mt-3 grid grid-cols-[3fr_1fr_3fr] items-center gap-1">
                <div className="flex items-center justify-end gap-2">
                  <div className={`${skeletonBase} h-2 flex-1 rounded`} />
                  <div className={`${skeletonBase} w-10 h-4 rounded`} />
                </div>
                <div className="text-center">
                  <div className={`${skeletonBase} w-14 h-3 rounded mx-auto`} />
                </div>
                <div className="flex items-center justify-start gap-2">
                  <div className={`${skeletonBase} w-10 h-4 rounded`} />
                  <div className={`${skeletonBase} h-2 flex-1 rounded`} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. 최근 경기 - 모바일 (Team A) */}
          <div className={`${skeletonCard} mb-4 md:hidden`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-24 h-4 rounded`} />
                <div className={`${skeletonBase} w-5 h-5 rounded-full`} />
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5 p-1">
                  <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                  <div className={`${skeletonBase} w-12 h-6 rounded`} />
                  <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* 3. 최근 경기 - 모바일 (Team B) */}
          <div className={`${skeletonCard} mb-4 md:hidden`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-24 h-4 rounded`} />
                <div className={`${skeletonBase} w-5 h-5 rounded-full`} />
              </div>
            </div>
            <div className="p-4 space-y-1.5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5 p-1">
                  <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                  <div className={`${skeletonBase} w-12 h-6 rounded`} />
                  <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* 4. 최근 경기 - 데스크탑 */}
          <div className={`${skeletonCard} mb-4 hidden md:block`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-20 h-4 rounded`} />
            </div>
            <div className="p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
                {/* Team A */}
                <div>
                  <div className={`${skeletonBase} w-20 h-3 rounded mx-auto mb-2`} />
                  <div className="space-y-1.5">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5 p-1">
                        <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                        <div className={`${skeletonBase} w-12 h-6 rounded`} />
                        <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* 구분선 */}
                <div className="w-px bg-black/5 dark:bg-white/10" />
                {/* Team B */}
                <div>
                  <div className={`${skeletonBase} w-20 h-3 rounded mx-auto mb-2`} />
                  <div className="space-y-1.5">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5 p-1">
                        <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                        <div className={`${skeletonBase} w-12 h-6 rounded`} />
                        <div className={`${skeletonBase} flex-1 h-4 rounded`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 최근 양팀 맞대결 Container */}
          <div className={`${skeletonCard} mb-4`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-28 h-4 rounded`} />
            </div>
            <div className="p-4">
              {/* 경기 결과 목록 */}
              <div className="space-y-1">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center p-2 border-b border-black/5 dark:border-white/10 last:border-b-0">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`${skeletonBase} w-16 h-4 rounded`} />
                      <div className={`${skeletonBase} w-4 h-4 rounded-full`} />
                      <div className={`${skeletonBase} w-6 h-4 rounded`} />
                    </div>
                    <div className="text-center space-y-1">
                      <div className={`${skeletonBase} w-14 h-3 rounded mx-auto`} />
                      <div className={`${skeletonBase} w-12 h-3 rounded mx-auto`} />
                    </div>
                    <div className="flex items-center justify-start gap-2">
                      <div className={`${skeletonBase} w-6 h-4 rounded`} />
                      <div className={`${skeletonBase} w-4 h-4 rounded-full`} />
                      <div className={`${skeletonBase} w-16 h-4 rounded`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 요약 통계 */}
              <div className="mt-4 pt-3 border-t space-y-3">
                {/* 승무패 통계 */}
                <div className="grid grid-cols-[3fr_1fr_3fr] gap-1">
                  <div className="flex justify-end gap-1">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className={`${skeletonBase} w-8 h-6 rounded`} />
                    ))}
                  </div>
                  <div className={`${skeletonBase} w-10 h-3 rounded mx-auto`} />
                  <div className="flex justify-start gap-1">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className={`${skeletonBase} w-8 h-6 rounded`} />
                    ))}
                  </div>
                </div>

                {/* 평균 득실점 */}
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center">
                    <div className="flex items-center justify-end gap-2">
                      <div className={`${skeletonBase} h-2 flex-1 rounded`} />
                      <div className={`${skeletonBase} w-10 h-4 rounded`} />
                    </div>
                    <div className={`${skeletonBase} w-14 h-3 rounded mx-auto`} />
                    <div className="flex items-center justify-start gap-2">
                      <div className={`${skeletonBase} w-10 h-4 rounded`} />
                      <div className={`${skeletonBase} h-2 flex-1 rounded`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. 팀 득점·도움 순위 - 모바일 (Team A) */}
          <div className={`${skeletonCard} mb-4 md:hidden`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-32 h-4 rounded`} />
                <div className={`${skeletonBase} w-5 h-5 rounded-full`} />
              </div>
            </div>
            <div className="p-4">
              {/* 득점 */}
              <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
              <div className="space-y-1.5 mb-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-2">
                      <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                      <div className={`${skeletonBase} w-20 h-4 rounded`} />
                    </div>
                    <div className={`${skeletonBase} w-6 h-5 rounded`} />
                  </div>
                ))}
              </div>
              {/* 도움 */}
              <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
              <div className="space-y-1.5">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-2">
                      <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                      <div className={`${skeletonBase} w-20 h-4 rounded`} />
                    </div>
                    <div className={`${skeletonBase} w-6 h-5 rounded`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7. 팀 득점·도움 순위 - 모바일 (Team B) */}
          <div className={`${skeletonCard} md:hidden`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className={`${skeletonBase} w-5 h-5 rounded-full`} />
                <div className={`${skeletonBase} w-32 h-4 rounded`} />
              </div>
            </div>
            <div className="p-4">
              {/* 득점 */}
              <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
              <div className="space-y-1.5 mb-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-2">
                      <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                      <div className={`${skeletonBase} w-20 h-4 rounded`} />
                    </div>
                    <div className={`${skeletonBase} w-6 h-5 rounded`} />
                  </div>
                ))}
              </div>
              {/* 도움 */}
              <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
              <div className="space-y-1.5">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-2">
                      <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                      <div className={`${skeletonBase} w-20 h-4 rounded`} />
                    </div>
                    <div className={`${skeletonBase} w-6 h-5 rounded`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 8. 팀 득점·도움 순위 - 데스크탑 */}
          <div className={`${skeletonCard} hidden md:block`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-28 h-4 rounded`} />
            </div>
            <div className="p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
                {/* Team A */}
                <div>
                  <div className="flex items-center justify-end gap-2 p-2 mb-3">
                    <div className={`${skeletonBase} w-16 h-4 rounded`} />
                    <div className={`${skeletonBase} w-4 h-4 rounded-full`} />
                  </div>
                  {/* 득점 */}
                  <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
                  <div className="space-y-1.5 mb-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2">
                        <div className="flex items-center gap-2">
                          <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                          <div className={`${skeletonBase} w-20 h-4 rounded`} />
                        </div>
                        <div className={`${skeletonBase} w-6 h-5 rounded`} />
                      </div>
                    ))}
                  </div>
                  {/* 도움 */}
                  <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
                  <div className="space-y-1.5">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2">
                        <div className="flex items-center gap-2">
                          <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                          <div className={`${skeletonBase} w-20 h-4 rounded`} />
                        </div>
                        <div className={`${skeletonBase} w-6 h-5 rounded`} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* 구분선 */}
                <div className="w-px bg-black/5 dark:bg-white/10" />
                {/* Team B */}
                <div>
                  <div className="flex items-center justify-start gap-2 p-2 mb-3">
                    <div className={`${skeletonBase} w-4 h-4 rounded-full`} />
                    <div className={`${skeletonBase} w-16 h-4 rounded`} />
                  </div>
                  {/* 득점 */}
                  <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
                  <div className="space-y-1.5 mb-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2">
                        <div className={`${skeletonBase} w-6 h-5 rounded`} />
                        <div className="flex items-center gap-2">
                          <div className={`${skeletonBase} w-20 h-4 rounded`} />
                          <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 도움 */}
                  <div className={`${skeletonBase} w-12 h-5 rounded mx-auto mb-2`} />
                  <div className="space-y-1.5">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2">
                        <div className={`${skeletonBase} w-6 h-5 rounded`} />
                        <div className="flex items-center gap-2">
                          <div className={`${skeletonBase} w-20 h-4 rounded`} />
                          <div className={`${skeletonBase} w-8 h-8 rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 사이드바 - 데스크탑에서만 표시 */}
        <aside className="hidden xl:block w-[300px] shrink-0">
          {/* 경기 상세정보 스켈레톤 */}
          <div className={skeletonCard}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-24 h-4 rounded`} />
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className={`${skeletonBase} w-12 h-4 rounded`} />
                  <div className={`${skeletonBase} w-24 h-4 rounded`} />
                </div>
              ))}
            </div>
          </div>

          {/* 승무패 예측 스켈레톤 */}
          <div className={`${skeletonCard} mt-3`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-20 h-4 rounded`} />
            </div>
            <div className="p-4">
              <div className="flex justify-between gap-2 mb-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className={`${skeletonBase} flex-1 h-12 rounded`} />
                ))}
              </div>
              <div className={`${skeletonBase} w-full h-2 rounded-full`} />
            </div>
          </div>

          {/* 응원 댓글 스켈레톤 */}
          <div className={`${skeletonCard} mt-3`}>
            <div className="h-10 px-4 flex items-center bg-[#F5F5F5] dark:bg-[#262626] rounded-t-lg">
              <div className={`${skeletonBase} w-20 h-4 rounded`} />
            </div>
            <div className="p-4 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`${skeletonBase} w-8 h-8 rounded-full shrink-0`} />
                  <div className="flex-1 space-y-1">
                    <div className={`${skeletonBase} w-16 h-3 rounded`} />
                    <div className={`${skeletonBase} w-full h-4 rounded`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
