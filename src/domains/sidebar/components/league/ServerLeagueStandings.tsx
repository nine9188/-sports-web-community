import { fetchStandingsData } from '../../actions/football';
import LeagueStandings from './LeagueStandings';
import { getLeagueLogoUrls } from '@/domains/livescore/actions/images';
import { MAJOR_LEAGUE_IDS } from '@/domains/livescore/constants/league-mappings';

// 5대 리그 API IDs
const LEAGUE_API_IDS = [
  MAJOR_LEAGUE_IDS.PREMIER_LEAGUE,  // 39
  MAJOR_LEAGUE_IDS.LA_LIGA,         // 140
  MAJOR_LEAGUE_IDS.BUNDESLIGA,      // 78
  MAJOR_LEAGUE_IDS.SERIE_A,         // 135
  MAJOR_LEAGUE_IDS.LIGUE_1,         // 61
];

interface ServerLeagueStandingsProps {
  initialLeague?: string;
}

// 서버 컴포넌트 - async 사용 가능
export default async function ServerLeagueStandings({
  initialLeague = 'premier'
}: ServerLeagueStandingsProps) {
  try {
    // 서버 컴포넌트에서 직접 서버 액션 호출
    // fetchStandingsData가 이미 teamLogoUrls를 포함하여 반환
    const [initialStandings, leagueLogoUrls, leagueLogoUrlsDark] = await Promise.all([
      fetchStandingsData(initialLeague),
      getLeagueLogoUrls(LEAGUE_API_IDS, false),  // 라이트모드
      getLeagueLogoUrls(LEAGUE_API_IDS, true),   // 다크모드
    ]);

    // fetchStandingsData에서 반환한 teamLogoUrls 사용 (중복 호출 제거)
    const teamLogoUrls = initialStandings?.teamLogoUrls || {};

    return (
      <LeagueStandings
        initialLeague={initialLeague}
        initialStandings={initialStandings}
        leagueLogoUrls={leagueLogoUrls}
        leagueLogoUrlsDark={leagueLogoUrlsDark}
        teamLogoUrls={teamLogoUrls}
      />
    );
  } catch {
    // 에러 발생 시 클라이언트 컴포넌트를 빈 데이터로 렌더링
    return (
      <LeagueStandings
        initialLeague={initialLeague}
        initialStandings={null}
      />
    );
  }
} 