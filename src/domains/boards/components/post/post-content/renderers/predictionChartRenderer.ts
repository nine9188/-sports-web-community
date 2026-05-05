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

  // 로딩 플레이스홀더 (클라이언트에서 React 컴포넌트로 교체됨)
  return `
    <div
      class="prediction-chart-container my-4"
      data-type="prediction-chart"
      data-fixture-id="${fixtureId}"
      data-chart="${encodeURIComponent(JSON.stringify(chartData))}"
    >
      <div class="bg-white dark:bg-[#1D1D1D] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
          불러오는 중...
        </div>
      </div>
    </div>
  `;
}
