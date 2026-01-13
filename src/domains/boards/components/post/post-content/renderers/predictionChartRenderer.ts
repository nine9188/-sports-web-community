/**
 * 예측 차트 렌더링 유틸리티 (조회용)
 *
 * 클라이언트에서 React 컴포넌트로 하이드레이션 됨
 * 서버에서는 로딩 플레이스홀더만 표시
 */

interface PredictionChartRenderData {
  fixtureId: string | number;
  chartData: Record<string, unknown>;
}

/**
 * 예측 차트 HTML 렌더링 (조회용)
 * 실제 차트는 클라이언트에서 PredictionChart React 컴포넌트로 렌더링됨
 */
export function renderPredictionChart(data: PredictionChartRenderData): string {
  const { fixtureId, chartData } = data;

  if (!chartData || typeof chartData !== 'object') {
    return `
      <div class="p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 my-4">
        예측 차트 데이터를 불러올 수 없습니다.
      </div>
    `;
  }

  // 데이터 추출 (로딩 플레이스홀더용)
  const teams = (chartData as { teams?: { home?: { name?: string }; away?: { name?: string } } }).teams;
  const homeName = teams?.home?.name || '홈팀';
  const awayName = teams?.away?.name || '원정팀';

  // 로딩 플레이스홀더 (클라이언트에서 React 컴포넌트로 교체됨)
  return `
    <div
      class="prediction-chart-container my-4"
      data-type="prediction-chart"
      data-fixture-id="${fixtureId}"
      data-chart="${encodeURIComponent(JSON.stringify(chartData))}"
    >
      <div class="bg-white dark:bg-[#1D1D1D] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-6 text-center">
          <div class="animate-pulse space-y-4">
            <div class="flex justify-center gap-8">
              <div class="text-center">
                <div class="h-8 w-16 bg-blue-200 dark:bg-blue-800 rounded mx-auto mb-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400">${homeName}</p>
              </div>
              <div class="text-center">
                <div class="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400">무승부</p>
              </div>
              <div class="text-center">
                <div class="h-8 w-16 bg-green-200 dark:bg-green-800 rounded mx-auto mb-2"></div>
                <p class="text-xs text-gray-500 dark:text-gray-400">${awayName}</p>
              </div>
            </div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500">예측 차트 로딩중...</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
