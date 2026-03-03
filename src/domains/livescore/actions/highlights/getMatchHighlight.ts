'use server';

import { createClient } from '@supabase/supabase-js';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';
import { findHighlightForMatch } from './fetchHighlights';
import { HIGHLIGHT_SUPPORTED_LEAGUE_IDS } from '@/domains/livescore/constants/youtube-channels';

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 매치 하이라이트 조회 (DB 캐시 → YouTube 검색)
 */
export async function getMatchHighlight(
  fixtureId: number,
  homeTeamId: number,
  awayTeamId: number,
  leagueId: number
): Promise<MatchHighlight | null> {
  // 지원하지 않는 리그는 스킵
  if (
    !HIGHLIGHT_SUPPORTED_LEAGUE_IDS.includes(
      leagueId as (typeof HIGHLIGHT_SUPPORTED_LEAGUE_IDS)[number]
    )
  ) {
    return null;
  }

  const supabase = createSupabaseClient();

  // 1. DB 캐시 확인
  const { data: cached } = await supabase
    .from('match_highlights')
    .select('*')
    .eq('fixture_id', fixtureId)
    .single();

  if (cached) return cached as MatchHighlight;

  // 2. 캐시 없으면 YouTube에서 검색
  const result = await findHighlightForMatch(
    fixtureId,
    homeTeamId,
    awayTeamId,
    leagueId
  );

  if (!result) return null;

  // 3. DB에 캐싱
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
      },
      { onConflict: 'fixture_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[Highlights] DB insert error:', error);
    // DB 저장 실패해도 결과는 반환
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return inserted as MatchHighlight;
}
