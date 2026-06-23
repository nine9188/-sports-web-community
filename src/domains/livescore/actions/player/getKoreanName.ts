'use server';

import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 선수 한글명 캐시 시스템 (4590 최적화)
 * 
 * 최적화 전략:
 * 1. L1 전역 메모리 캐시 (globalKoreanNames):
 *    - 서버 컨테이너가 실행되는 동안 메모리에 한글명을 캐싱합니다 (null 값 포함).
 *    - 동일 컨테이너 내의 후속 요청은 DB 호출 없이 0ms로 즉시 반환됩니다.
 * 
 * 2. 배치 조회 방식 (IN 쿼리):
 *    - 캐시가 유실되더라도(콜드 스타트/재시작) 테이블 전체(9,300여명)를 긁지 않고,
 *      현재 요청에 필요한 선수(예: 22명 라인업)의 한글명만 DB에서 콕 집어 가져옵니다.
 *    - DB 트래픽(Egress)과 호출 비용이 99% 감소합니다.
 */

// L1 메모리 캐시 (korean_name이 없는 경우 null을 매핑하여 중복 DB 쿼리 방지)
const globalKoreanNames: Record<number, string | null> = {};

/**
 * 단일 선수 한글명 조회
 * - 메모리 캐시 우선 조회 후 없으면 DB 단건 조회
 */
export async function getPlayerKoreanName(playerId: number | string): Promise<string | null> {
  const numericId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;

  if (isNaN(numericId) || numericId <= 0) return null;

  // 1. 메모리 캐시 확인
  if (globalKoreanNames[numericId] !== undefined) {
    return globalKoreanNames[numericId];
  }

  // 2. 캐시 미스 시 DB 단건 조회
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('football_players')
      .select('korean_name')
      .eq('player_id', numericId)
      .maybeSingle();

    if (error) {
      console.error(`[getPlayerKoreanName] DB 조회 실패 (ID: ${numericId}):`, error);
      return null;
    }

    const name = data?.korean_name || null;
    globalKoreanNames[numericId] = name;
    return name;
  } catch (err) {
    console.error(`[getPlayerKoreanName] 에러:`, err);
    return null;
  }
}

/**
 * 여러 선수 한글명 일괄 조회
 * - 메모리 캐시 우선 조회 후, 없는 대상만 IN 쿼리로 배치 조회
 */
export async function getPlayersKoreanNames(
  playerIds: (number | string)[]
): Promise<Record<number, string | null>> {
  if (!playerIds || playerIds.length === 0) return {};

  const numericIds = playerIds
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id) && id > 0);

  if (!numericIds.length) return {};

  const uniqueIds = [...new Set(numericIds)];
  const result: Record<number, string | null> = {};
  const missingIds: number[] = [];

  // 1. 메모리 캐시 확인
  for (const id of uniqueIds) {
    if (globalKoreanNames[id] !== undefined) {
      result[id] = globalKoreanNames[id];
    } else {
      missingIds.push(id);
    }
  }

  // 2. 캐시 미스된 선수들만 DB에서 배치 조회
  if (missingIds.length > 0) {
    try {
      const supabase = getSupabaseAdmin();
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        const batch = missingIds.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase
          .from('football_players')
          .select('player_id, korean_name')
          .in('player_id', batch);

        if (error) {
          console.error('[getPlayersKoreanNames] DB 조회 실패:', error);
          continue;
        }

        // DB에 있는 선수 처리
        const foundIds = new Set<number>();
        if (data) {
          data.forEach(row => {
            const name = row.korean_name || null;
            globalKoreanNames[row.player_id] = name;
            result[row.player_id] = name;
            foundIds.add(row.player_id);
          });
        }

        // DB에 존재하지 않는 선수도 null로 캐싱하여 반복 조회 방지
        batch.forEach(id => {
          if (!foundIds.has(id)) {
            globalKoreanNames[id] = null;
            result[id] = null;
          }
        });
      }
    } catch (err) {
      console.error('[getPlayersKoreanNames] 에러:', err);
    }
  }

  return result;
}

/**
 * 선수 정보와 함께 한글명 조회 (DB 직접 조회, 캐싱 없음)
 */
export async function getPlayerWithKoreanName(playerId: number | string) {
  const numericId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;

  if (isNaN(numericId)) return null;

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('football_players')
    .select('player_id, name, korean_name, team_id, position, number')
    .eq('player_id', numericId)
    .single();

  return data;
}
