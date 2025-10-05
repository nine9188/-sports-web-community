import { MAJOR_LEAGUE_IDS, LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';
import { LeagueCard } from '@/domains/livescore/components/football/leagues';

// 리그 카테고리별 분류
const LEAGUE_CATEGORIES = {
  '유럽 주요 리그': [
    MAJOR_LEAGUE_IDS.PREMIER_LEAGUE,
    MAJOR_LEAGUE_IDS.LA_LIGA,
    MAJOR_LEAGUE_IDS.BUNDESLIGA,
    MAJOR_LEAGUE_IDS.SERIE_A,
    MAJOR_LEAGUE_IDS.LIGUE_1,
  ],
  '유럽 컵 대회': [
    MAJOR_LEAGUE_IDS.CHAMPIONS_LEAGUE,
    MAJOR_LEAGUE_IDS.EUROPA_LEAGUE,
    MAJOR_LEAGUE_IDS.CONFERENCE_LEAGUE,
  ],
  '유럽 기타 리그': [
    MAJOR_LEAGUE_IDS.CHAMPIONSHIP,
    MAJOR_LEAGUE_IDS.SCOTTISH_PREMIERSHIP,
    MAJOR_LEAGUE_IDS.EREDIVISIE,
    MAJOR_LEAGUE_IDS.PRIMEIRA_LIGA,
    MAJOR_LEAGUE_IDS.DANISH_SUPERLIGA,
  ],
  '아시아': [
    MAJOR_LEAGUE_IDS.K_LEAGUE_1,
    MAJOR_LEAGUE_IDS.J1_LEAGUE,
    MAJOR_LEAGUE_IDS.CSL,
    MAJOR_LEAGUE_IDS.AFC_CHAMPIONS,
    MAJOR_LEAGUE_IDS.SAUDI_PRO_LEAGUE,
  ],
  '아메리카': [
    MAJOR_LEAGUE_IDS.MLS,
    MAJOR_LEAGUE_IDS.BRASILEIRAO,
    MAJOR_LEAGUE_IDS.LIGA_MX,
  ],
  '국내 컵 대회': [
    MAJOR_LEAGUE_IDS.FA_CUP,
    MAJOR_LEAGUE_IDS.EFL_CUP,
    MAJOR_LEAGUE_IDS.COPA_DEL_REY,
    MAJOR_LEAGUE_IDS.COPPA_ITALIA,
    MAJOR_LEAGUE_IDS.COUPE_DE_FRANCE,
    MAJOR_LEAGUE_IDS.DFB_POKAL,
  ],
  '국제 대회': [
    MAJOR_LEAGUE_IDS.WORLD_CUP_QUALIFIERS_EUROPE,
    MAJOR_LEAGUE_IDS.WORLD_CUP_QUALIFIERS_ASIA,
    MAJOR_LEAGUE_IDS.INTERNATIONAL_FRIENDLY,
    MAJOR_LEAGUE_IDS.NATIONS_LEAGUE,
    MAJOR_LEAGUE_IDS.EURO,
    MAJOR_LEAGUE_IDS.COPA_AMERICA,
    MAJOR_LEAGUE_IDS.CLUB_WORLD_CUP,
    MAJOR_LEAGUE_IDS.UEFA_SUPER_CUP,
  ],
};

// 모든 리그 ID를 수집
const getAllLeagueIds = () => {
  const allIds: number[] = [];
  Object.values(LEAGUE_CATEGORIES).forEach(ids => {
    allIds.push(...ids);
  });
  return allIds;
};

export default async function LeaguesPage() {
  const allLeagueIds = getAllLeagueIds();

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="container mx-auto w-full">
        {/* 페이지 헤더 */}
        <div className="mb-4 bg-white rounded-lg border p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-2">축구 리그</h1>
          <p className="text-gray-600">원하는 리그를 선택하여 소속 팀과 경기 정보를 확인하세요</p>
        </div>

        {/* 통계 정보 */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200 p-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-sm p-2 shadow-sm border border-blue-100 flex items-center justify-center space-x-1">
              <span className="text-xl font-bold text-blue-700">{allLeagueIds.length}</span>
              <span className="text-xs text-blue-600 font-medium">리그</span>
            </div>
            
            <div className="bg-white rounded-sm p-2 shadow-sm border border-blue-100 flex items-center justify-center space-x-1">
              <span className="text-xl font-bold text-blue-700">{Object.keys(LEAGUE_CATEGORIES).length}</span>
              <span className="text-xs text-blue-600 font-medium">카테고리</span>
            </div>
            
            <div className="bg-white rounded-sm p-2 shadow-sm border border-blue-100 flex items-center justify-center space-x-1">
              <span className="text-xl font-bold text-blue-700">30+</span>
              <span className="text-xs text-blue-600 font-medium">국가</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(LEAGUE_CATEGORIES).map(([category, leagueIds]) => (
            <div key={category} className="space-y-2">
              <div className="bg-white rounded-md border p-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  {category}
                </h2>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-4">
                {leagueIds.map((leagueId) => (
                  <LeagueCard
                    key={leagueId}
                    leagueId={leagueId}
                    name={LEAGUE_NAMES_MAP[leagueId]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 메타데이터
export const metadata = {
  title: '축구 리그 목록 - 라이브스코어',
  description: '전 세계 주요 축구 리그 목록을 확인하고 원하는 리그의 팀 정보와 경기 결과를 확인하세요.',
}; 