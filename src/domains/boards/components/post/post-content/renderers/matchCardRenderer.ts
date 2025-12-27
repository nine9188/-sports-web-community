/**
 * 매치 카드 렌더링 유틸리티 (조회용)
 *
 * 통합 유틸리티를 사용하여 CSS 클래스 기반 HTML 생성
 */

import { normalizeMatchCardData, generateMatchCardHtml, getImageUrls, getStatusInfo } from '@/shared/utils/matchCard';

// 공통 유틸리티 재export (하위 호환성)
export { getImageUrls, getStatusInfo };

interface MatchCardRenderData {
  matchId: string | number;
  matchData: Record<string, unknown>;
}

/**
 * 매치 카드 HTML 렌더링 (조회용)
 */
export function renderMatchCard(data: MatchCardRenderData): string {
  const { matchId, matchData } = data;

  if (!matchData || typeof matchData !== 'object') {
    return `
      <div class="p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 my-4">
        경기 결과 데이터를 불러올 수 없습니다.
      </div>
    `;
  }

  // 데이터 정규화
  const normalized = normalizeMatchCardData(matchData);

  // matchId 오버라이드
  if (matchId && (normalized.id === 'unknown' || !normalized.id)) {
    normalized.id = matchId;
  }

  // 통합 함수 사용 (조회용: CSS 클래스 + 호버 핸들러)
  return generateMatchCardHtml(normalized, {
    useInlineStyles: false,
    includeDataAttr: false,
    includeHoverHandlers: true,
    markAsProcessed: true,
  });
}
