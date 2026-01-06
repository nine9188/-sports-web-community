/**
 * 에디터용 매치카드 HTML 생성기
 *
 * 통합 유틸리티를 사용하여 에디터에서 필요한 인라인 스타일 HTML 생성
 */

import type { MatchCardData } from '@/shared/types/matchCard';
import { normalizeMatchCardData, generateMatchCardHtml } from '@/shared/utils/matchCard';

// MatchData 타입 별칭 (하위 호환성)
type MatchData = MatchCardData;

/**
 * 경기 카드 HTML을 생성하는 유틸리티 함수 (에디터용)
 *
 * @param matchData 경기 데이터 객체
 * @param matchId 경기 ID (선택적)
 * @returns 경기 카드 HTML 문자열
 */
export function generateMatchCardHTML(matchData: MatchData, matchId?: string | number): string {
  // 데이터 정규화
  const normalized = normalizeMatchCardData(matchData as unknown as Record<string, unknown>);

  // matchId 오버라이드
  if (matchId && !normalized.id) {
    normalized.id = matchId;
  }

  // 통합 함수 사용 (에디터용: 인라인 스타일 + data-match 속성)
  return generateMatchCardHtml(normalized, {
    useInlineStyles: true,
    includeDataAttr: true,
    markAsProcessed: false,
  });
}
