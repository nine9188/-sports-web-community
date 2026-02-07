'use server';

import { getTeamLogoUrl, getLeagueLogoUrl } from '@/domains/livescore/actions/images';

interface TeamInfo {
  id: number;
  name_en: string;
  name_ko?: string;
  logo?: string;
}

interface LeagueInfo {
  id: number;
  name: string;
  koreanName: string;
}

export interface TeamCardDataResult {
  success: boolean;
  data?: {
    id: number;
    name: string;
    koreanName?: string;
    logo: string;
    league: {
      id: number;
      name: string;
      koreanName: string;
      logo: string;
    };
  };
  error?: string;
}

/**
 * 에디터 팀 카드 데이터 생성 (4590 표준)
 *
 * - 서버에서 Storage URL 확정
 * - 클라이언트에서 URL 조합 방지
 *
 * @param team - 팀 정보
 * @param league - 리그 정보
 */
export async function createTeamCardData(
  team: TeamInfo,
  league: LeagueInfo
): Promise<TeamCardDataResult> {
  try {
    if (!team?.id) {
      return { success: false, error: '팀 ID가 필요합니다' };
    }

    // Storage URL 조회 (4590 표준)
    const [teamLogoUrl, leagueLogoUrl] = await Promise.all([
      getTeamLogoUrl(team.id),
      getLeagueLogoUrl(league.id),
    ]);

    return {
      success: true,
      data: {
        id: team.id,
        name: team.name_en,
        koreanName: team.name_ko,
        logo: teamLogoUrl,
        league: {
          id: league.id,
          name: league.name,
          koreanName: league.koreanName,
          logo: leagueLogoUrl,
        },
      },
    };
  } catch (error) {
    console.error('[createTeamCardData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
