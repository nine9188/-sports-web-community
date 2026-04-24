'use server';

import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import { findHighlightForMatch } from './fetchHighlights';
import { HIGHLIGHT_SUPPORTED_LEAGUE_IDS } from '@/domains/livescore/constants/youtube-channels';

const NOT_FOUND_SENTINEL = 'NOT_FOUND';
// 미래 경기나 아직 업로드 안 된 경기: 6시간 후 재시도
// 오래된 경기(하이라이트 없음): 24시간 후 재시도
const RETRY_HOURS_RECENT = 6;
const RETRY_HOURS_OLD = 24;

function getRetryHours(matchDate?: string): number {
  if (!matchDate) return RETRY_HOURS_OLD;
  const matchTime = new Date(matchDate).getTime();
  const hoursSinceMatch = (Date.now() - matchTime) / (1000 * 60 * 60);
  // 경기 후 48시간 이내면 6시간마다 재시도 (아직 업로드 안 됐을 수 있음)
  return hoursSinceMatch < 48 ? RETRY_HOURS_RECENT : RETRY_HOURS_OLD;
}

/**
 * 매치 하이라이트 조회 (DB 캐시 → YouTube 검색)
 * - null 결과도 캐싱해 불필요한 API 호출 방지 (YouTube 할당량 보호)
 * - NOT_FOUND sentinel: 최근 경기는 6시간, 오래된 경기는 24시간 후 재시도
 */
export async function getMatchHighlight(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number,
  leagueId: number,
  matchDate?: string
): Promise<MatchHighlight | null> {
  // 지원하지 않는 리그는 스킵
  if (
    !HIGHLIGHT_SUPPORTED_LEAGUE_IDS.includes(
      leagueId as (typeof HIGHLIGHT_SUPPORTED_LEAGUE_IDS)[number]
    )
  ) {
    return null;
  }

  const supabase = getSupabaseAdmin();

  // 1. DB 캐시 확인
  const { data: cached } = await supabase
    .from('match_highlights')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single();

  if (cached) {
    // NOT_FOUND sentinel 처리: 재시도 시간 이내면 null 반환 (API 호출 생략)
    if (cached.video_id === NOT_FOUND_SENTINEL) {
      const updatedAt = new Date(cached.updated_at ?? cached.created_at).getTime();
      const hoursSince = (Date.now() - updatedAt) / (1000 * 60 * 60);
      const retryHours = getRetryHours(matchDate);
      if (hoursSince < retryHours) return null;
      // 재시도 시간 지남 → 아래에서 다시 검색
    } else {
      return cached as MatchHighlight;
    }
  }

  // 2. matchDate 없으면 날짜 필터 불가 → 잘못된 경기 캐싱 위험이 있지만 검색은 진행
  if (!matchDate) {
    console.warn(`[Highlights] matchDate 없음 fixture=${fixtureId}, 날짜 필터 없이 검색`);
  }

  // 3. YouTube에서 검색
  const result = await findHighlightForMatch(
    fixtureId,
    homeTeamId,
    awayTeamId,
    leagueId,
    matchDate
  );

  const now = new Date().toISOString();

  if (!result) {
    // null 결과 캐싱 → 재시도 전까지 API 호출 차단
    await supabase
      .from('match_highlights')
      .upsert(
        {
          fixture_id: fixtureId,
          league_id: leagueId,
          video_id: NOT_FOUND_SENTINEL,
          video_title: null,
          channel_name: null,
          source_type: 'not_found',
          thumbnail_url: null,
          published_at: null,
          updated_at: now,
        },
        { onConflict: 'fixture_id' }
      );
    return null;
  }

  // 4. 실제 결과 DB에 캐싱
  const { data: inserted, error } = await supabase
    .from('match_highlights')
    .upsert(
      {
        fixture_id: fixtureId,
        league_id: leagueId,
        video_id: result.videoId,
        video_title: result.videoTitle,
        channel_name: result.channelName,
        source_type: result.sourceType,
        thumbnail_url: result.thumbnailUrl,
        published_at: result.publishedAt,
        updated_at: now,
      },
      { onConflict: 'fixture_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[Highlights] DB insert error:', error);
    return {
      id: '',
      fixture_id: fixtureId,
      league_id: leagueId,
      video_id: result.videoId,
      video_title: result.videoTitle,
      channel_name: result.channelName,
      source_type: result.sourceType,
      thumbnail_url: result.thumbnailUrl,
      published_at: result.publishedAt,
      created_at: now,
      updated_at: now,
    };
  }

  return inserted as MatchHighlight;
}
