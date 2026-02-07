'use server';

import { getTeamLogoUrl, getLeagueLogoUrl } from '@/domains/livescore/actions/images';
import type { MatchCardData } from '@/shared/types/matchCard';

export interface MatchCardDataResult {
  success: boolean;
  data?: MatchCardData;
  error?: string;
}

/**
 * 에디터 매치 카드 데이터 생성 (4590 표준)
 *
 * - 서버에서 Storage URL 확정
 * - 클라이언트에서 URL 조합 방지
 *
 * @param matchData - 원본 매치 데이터
 */
export async function createMatchCardData(
  matchData: MatchCardData
): Promise<MatchCardDataResult> {
  try {
    if (!matchData?.teams) {
      return { success: false, error: '매치 데이터가 필요합니다' };
    }

    const { teams, league } = matchData;

    // 팀 ID 추출
    const homeTeamId = typeof teams.home?.id === 'string'
      ? parseInt(teams.home.id, 10)
      : teams.home?.id;
    const awayTeamId = typeof teams.away?.id === 'string'
      ? parseInt(teams.away.id, 10)
      : teams.away?.id;
    const leagueId = typeof league?.id === 'string'
      ? parseInt(league.id, 10)
      : league?.id;

    // Storage URL 조회 (4590 표준)
    const [homeTeamLogo, awayTeamLogo, leagueLogo] = await Promise.all([
      homeTeamId ? getTeamLogoUrl(homeTeamId) : Promise.resolve('/images/placeholder-team.svg'),
      awayTeamId ? getTeamLogoUrl(awayTeamId) : Promise.resolve('/images/placeholder-team.svg'),
      leagueId ? getLeagueLogoUrl(leagueId) : Promise.resolve('/images/placeholder-league.svg'),
    ]);

    // Storage URL로 업데이트된 데이터 반환
    const updatedMatchData: MatchCardData = {
      ...matchData,
      teams: {
        home: {
          ...teams.home,
          logo: homeTeamLogo,
        },
        away: {
          ...teams.away,
          logo: awayTeamLogo,
        },
      },
      league: {
        ...league,
        logo: leagueLogo,
      },
    };

    return {
      success: true,
      data: updatedMatchData,
    };
  } catch (error) {
    console.error('[createMatchCardData] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}
