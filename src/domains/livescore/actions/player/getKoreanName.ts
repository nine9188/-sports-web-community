'use server';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin, getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 전체 선수 한글명 맵 조회 (DB)
 * - 9,300여명 전체를 한 번에 로드 후 캐싱
 * - unstable_cache로 1일 전역 캐싱 (모든 요청 공유)
 * - 한글명은 거의 변경되지 않음
 * - 관리자가 수정 시 revalidateTag('players-korean-names') 호출
 * - 주의: unstable_cache 내부에서는 cookies()를 쓸 수 없으므로 Admin 클라이언트 사용
 */
const getAllKoreanNamesMap = unstable_cache(
  async (): Promise<Record<number, string>> => {
    const supabase = getSupabaseAdmin();

    // Supabase는 기본 1000행 제한 → range로 페이징 조회
    const result: Record<number, string> = {};
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('football_players')
        .select('player_id, korean_name')
        .not('korean_name', 'is', null)
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[getAllKoreanNamesMap] 쿼리 오류:', error);
        break;
      }

      if (!data || data.length === 0) break;

      for (const row of data) {
        if (row.korean_name) {
          result[row.player_id] = row.korean_name;
        }
      }

      if (data.length < pageSize) break;
      from += pageSize;
    }

    return result;
  },
  ['players-korean-names-map'],
  {
    revalidate: 86400, // 1일
    tags: ['players-korean-names'],
  }
);

/**
 * 단일 선수 한글명 조회
 * - 전체 맵에서 꺼내는 방식 (캐시 재사용)
 */
export async function getPlayerKoreanName(playerId: number | string): Promise<string | null> {
  const numericId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;

  if (isNaN(numericId)) return null;

  const map = await getAllKoreanNamesMap();
  return map[numericId] || null;
}

/**
 * 여러 선수 한글명 일괄 조회
 * - 전체 맵에서 꺼내는 방식 (DB 쿼리 없음, 캐시 재사용)
 */
export async function getPlayersKoreanNames(
  playerIds: (number | string)[]
): Promise<Record<number, string | null>> {
  if (!playerIds.length) return {};

  const numericIds = playerIds
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id));

  if (!numericIds.length) return {};

  const uniqueIds = [...new Set(numericIds)];
  const map = await getAllKoreanNamesMap();

  const result: Record<number, string | null> = {};
  for (const id of uniqueIds) {
    result[id] = map[id] || null;
  }

  return result;
}

/**
 * 선수 정보와 함께 한글명 조회 (DB 직접 조회, 캐싱 없음)
 * - name, team_id, position, number 등 추가 정보가 필요한 경우 사용
 * - 한글명만 필요하면 getPlayerKoreanName 사용 권장
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
