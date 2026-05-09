interface PredictionChartRenderData {
  fixtureId: string | number;
  chartData: Record<string, unknown>;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readPath(source: unknown, path: string[]): unknown {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function textAt(source: unknown, path: string[], fallback = ''): string {
  const value = readPath(source, path);
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function renderSeoSummary(chartData: Record<string, unknown>): string {
  const homeName = textAt(chartData, ['teams', 'home', 'name'], '홈팀');
  const awayName = textAt(chartData, ['teams', 'away', 'name'], '원정팀');
  const homePercent = textAt(chartData, ['predictions', 'percent', 'home'], '-');
  const drawPercent = textAt(chartData, ['predictions', 'percent', 'draw'], '-');
  const awayPercent = textAt(chartData, ['predictions', 'percent', 'away'], '-');
  const winner = textAt(chartData, ['predictions', 'winner', 'name']);
  const underOver = textAt(chartData, ['predictions', 'under_over']);
  const advice = textAt(chartData, ['predictions', 'advice']);

  const rows = [
    ['폼', textAt(chartData, ['comparison', 'form', 'home']), textAt(chartData, ['comparison', 'form', 'away'])],
    ['공격', textAt(chartData, ['comparison', 'att', 'home']), textAt(chartData, ['comparison', 'att', 'away'])],
    ['수비', textAt(chartData, ['comparison', 'def', 'home']), textAt(chartData, ['comparison', 'def', 'away'])],
    ['상대전적', textAt(chartData, ['comparison', 'h2h', 'home']), textAt(chartData, ['comparison', 'h2h', 'away'])],
    ['득점', textAt(chartData, ['comparison', 'goals', 'home']), textAt(chartData, ['comparison', 'goals', 'away'])],
    ['종합', textAt(chartData, ['comparison', 'total', 'home']), textAt(chartData, ['comparison', 'total', 'away'])],
  ].filter(([, home, away]) => home || away);

  return `
    <section class="prediction-chart-seo bg-white dark:bg-[#1D1D1D] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="p-4 border-b border-black/5 dark:border-white/10">
        <h3 class="text-sm font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">
          ${escapeHtml(homeName)} vs ${escapeHtml(awayName)} 예측 분석
        </h3>
        <p class="text-[13px] text-gray-700 dark:text-gray-300">
          승부 예측: ${escapeHtml(homeName)} ${escapeHtml(homePercent)}, 무승부 ${escapeHtml(drawPercent)}, ${escapeHtml(awayName)} ${escapeHtml(awayPercent)}
        </p>
        ${winner ? `<p class="text-[13px] text-gray-700 dark:text-gray-300">예상 승자: ${escapeHtml(winner)}</p>` : ''}
        ${underOver ? `<p class="text-[13px] text-gray-700 dark:text-gray-300">언더/오버: ${escapeHtml(underOver)}</p>` : ''}
        ${advice ? `<p class="text-[13px] text-gray-700 dark:text-gray-300 mt-2">${escapeHtml(advice)}</p>` : ''}
      </div>
      ${rows.length ? `
        <div class="p-4">
          <h4 class="text-xs font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">팀 비교 지표</h4>
          <dl class="grid grid-cols-1 gap-1 text-[13px] text-gray-700 dark:text-gray-300">
            ${rows.map(([label, home, away]) => `
              <div>
                <dt class="font-medium">${escapeHtml(label)}</dt>
                <dd>${escapeHtml(homeName)} ${escapeHtml(home)}% / ${escapeHtml(awayName)} ${escapeHtml(away)}%</dd>
              </div>
            `).join('')}
          </dl>
        </div>
      ` : ''}
    </section>
  `;
}

export function renderPredictionChart(data: PredictionChartRenderData): string {
  const { fixtureId, chartData } = data;

  if (!chartData || typeof chartData !== 'object') {
    return `
      <div class="p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 my-4">
        예측 차트 데이터를 불러올 수 없습니다.
      </div>
    `;
  }

  return `
    <div
      class="prediction-chart-container my-4"
      data-type="prediction-chart"
      data-fixture-id="${escapeHtml(fixtureId)}"
      data-chart="${encodeURIComponent(JSON.stringify(chartData))}"
    >
      ${renderSeoSummary(chartData)}
    </div>
  `;
}
