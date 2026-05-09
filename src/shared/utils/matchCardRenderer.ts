/**
 * Editor-facing match card HTML generator.
 */

import type { MatchCardData } from '@/shared/types/matchCard';
import { normalizeMatchCardData, generateMatchCardHtml } from '@/shared/utils/matchCard';

type MatchData = MatchCardData;

export function generateMatchCardHTML(matchData: MatchData, matchId?: string | number): string {
  const normalized = normalizeMatchCardData(matchData as unknown as Record<string, unknown>);

  if (matchId && (normalized.id === 'unknown' || !normalized.id)) {
    normalized.id = matchId;
  }

  return generateMatchCardHtml(normalized, {
    useInlineStyles: true,
    includeDataAttr: true,
    markAsProcessed: false,
  });
}
