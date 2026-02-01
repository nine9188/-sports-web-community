'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';

/**
 * 단일 선수 한글명 조회 (DB)
 */
export async function getPlayerKoreanName(playerId: number | string): Promise<string | null> {
  const numericId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;

  if (isNaN(numericId)) return null;

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('football_players')
    .select('korean_name')
    .eq('player_id', numericId)
    .single();

  return data?.korean_name || null;
}

/**
 * 여러 선수 한글명 일괄 조회 (DB) - 성능 최적화
 * @param playerIds 선수 ID 배열
 * @returns { playerId: koreanName } 형태의 객체
 */
export async function getPlayersKoreanNames(
  playerIds: (number | string)[]
): Promise<Record<number, string | null>> {
  if (!playerIds.length) return {};

  const numericIds = playerIds
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id));

  if (!numericIds.length) return {};

  // 중복 제거
  const uniqueIds = [...new Set(numericIds)];

  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from('football_players')
    .select('player_id, korean_name')
    .in('player_id', uniqueIds);

  const result: Record<number, string | null> = {};

  // 모든 요청된 ID에 대해 초기화 (없는 경우 null)
  for (const id of uniqueIds) {
    result[id] = null;
  }

  // DB 결과로 업데이트
  if (data) {
    for (const player of data) {
      result[player.player_id] = player.korean_name;
    }
  }

  return result;
}

/**
 * 선수 정보와 함께 한글명 조회 (DB)
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
