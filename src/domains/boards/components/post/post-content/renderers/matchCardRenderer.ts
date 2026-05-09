/**
 * Match card renderer used in read-only post views.
 */

import { normalizeMatchCardData, generateMatchCardHtml, getImageUrls, getStatusInfo } from '@/shared/utils/matchCard';

// Re-export shared utilities for backward compatibility.
export { getImageUrls, getStatusInfo };

interface MatchCardRenderData {
  matchId?: string | number;
  matchData: Record<string, unknown>;
}

/**
 * Render match card HTML.
 */
export function renderMatchCard(data: MatchCardRenderData): string {
  const { matchId, matchData } = data;

  if (!matchData || typeof matchData !== 'object') {
    return `
      <div class="p-3 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 my-4">
        경기 데이터를 불러올 수 없습니다.
      </div>
    `;
  }

  const normalized = normalizeMatchCardData(matchData);

  if (matchId && (normalized.id === 'unknown' || !normalized.id)) {
    normalized.id = matchId;
  }

  return generateMatchCardHtml(normalized, {
    useInlineStyles: false,
    includeDataAttr: false,
    markAsProcessed: true,
  });
}
