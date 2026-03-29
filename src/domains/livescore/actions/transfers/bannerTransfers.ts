'use server';

import { cache } from 'react';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import { getTeamLogoUrls } from '@/domains/livescore/actions/images/getTeamLogoUrl';
import { getPlayerPhotoUrls } from '@/domains/livescore/actions/images/getPlayerPhotoUrl';
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { formatTransferType, getTransferTypeColor } from '@/domains/livescore/types/transfers';

// 배너용 이적 데이터 타입
export interface BannerTransferItem {
  playerId: number;
  playerName: string;
  playerPhoto: string;
  teamInId: number;
  teamInName: string;
  teamInLogo: string;
  teamOutId: number;
  teamOutName: string;
  teamOutLogo: string;
  transferType: string;
  transferTypeFormatted: string;
  transferTypeColor: string;
  transferDate: string;
}

// 티커/배너 표시 리그: 5대 리그 + K리그 + MLS
const BANNER_LEAGUES = [39, 140, 135, 78, 61, 292, 253];

/**
 * 배너/티커용 최신 빅클럽 이적 데이터
 * - Supabase transfer_cache에서 5대 리그 최신 데이터 조회
 * - 이미지 URL을 Supabase Storage URL로 해소
 * - 한국어 팀명/선수명 매핑
 */
export const fetchBannerTransfers = cache(async (
  limit: number = 20
): Promise<BannerTransferItem[]> => {
  try {
    const supabase = getSupabaseAdmin();

    const { data: rows, error } = await supabase
      .from('transfer_cache')
      .select('*')
      .in('league_id', BANNER_LEAGUES)
      .order('transfer_date', { ascending: false })
      .limit(limit);

    if (error || !rows || rows.length === 0) return [];

    // ID 수집
    const playerIds = rows.map(r => r.player_id).filter((id: number) => id > 0);
    const teamIds = new Set<number>();
    for (const r of rows) {
      if (r.team_in_id > 0) teamIds.add(r.team_in_id);
      if (r.team_out_id > 0) teamIds.add(r.team_out_id);
    }

    // 이미지 & 한국어명 배치 조회
    const [playerPhotos, teamLogos, koreanNames] = await Promise.all([
      getPlayerPhotoUrls(playerIds, 'sm'),
      getTeamLogoUrls([...teamIds], 'sm'),
      getPlayersKoreanNames(playerIds),
    ]);

    // BannerTransferItem으로 변환
    return rows.map((r) => {
      const teamIn = getTeamById(r.team_in_id);
      const teamOut = getTeamById(r.team_out_id);

      return {
        playerId: r.player_id,
        playerName: koreanNames[r.player_id] || r.player_name,
        playerPhoto: playerPhotos[r.player_id] || '/images/placeholder-player.svg',
        teamInId: r.team_in_id,
        teamInName: teamIn?.name_ko || r.team_in_name,
        teamInLogo: teamLogos[r.team_in_id] || '/images/placeholder-team.svg',
        teamOutId: r.team_out_id,
        teamOutName: teamOut?.name_ko || r.team_out_name,
        teamOutLogo: teamLogos[r.team_out_id] || '/images/placeholder-team.svg',
        transferType: r.transfer_type,
        transferTypeFormatted: formatTransferType(r.transfer_type),
        transferTypeColor: getTransferTypeColor(r.transfer_type),
        transferDate: r.transfer_date,
      };
    });
  } catch (error) {
    console.error('배너 이적 데이터 fetch 오류:', error);
    return [];
  }
});
