import { MAJOR_LEAGUE_IDS, LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';
import { LeagueCard } from '@/domains/livescore/components/football/leagues';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

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
    <div className="min-h-screen w-full">
      <div className="container mx-auto w-full">
        {/* 페이지 헤더 */}
        <Container>
          <ContainerHeader>
            <ContainerTitle>축구 리그</ContainerTitle>
          </ContainerHeader>
          {/* 통계 정보 */}
          <div className="bg-[#F5F5F5] dark:bg-[#262626] p-2 md:rounded-b-lg">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white dark:bg-[#1D1D1D] rounded-sm p-2 border border-black/7 dark:border-0 flex items-center justify-center space-x-1">
                <span className="text-base lg:text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">{allLeagueIds.length}</span>
                <span className="text-[10px] lg:text-xs text-gray-700 dark:text-gray-300 font-medium">리그</span>
              </div>
              
              <div className="bg-white dark:bg-[#1D1D1D] rounded-sm p-2 border border-black/7 dark:border-0 flex items-center justify-center space-x-1">
                <span className="text-base lg:text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">{Object.keys(LEAGUE_CATEGORIES).length}</span>
                <span className="text-[10px] lg:text-xs text-gray-700 dark:text-gray-300 font-medium">카테고리</span>
              </div>
              
              <div className="bg-white dark:bg-[#1D1D1D] rounded-sm p-2 border border-black/7 dark:border-0 flex items-center justify-center space-x-1">
                <span className="text-base lg:text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">30+</span>
                <span className="text-[10px] lg:text-xs text-gray-700 dark:text-gray-300 font-medium">국가</span>
              </div>
            </div>
          </div>
        </Container>

        <div className="space-y-4 mt-4">
          {Object.entries(LEAGUE_CATEGORIES).map(([category, leagueIds]) => (
            <div key={category}>
              {/* 카테고리 헤더 */}
              <div className="bg-[#F5F5F5] dark:bg-[#262626] h-12 px-4 flex items-center md:rounded-lg border border-black/7 dark:border-0">
                <h2 className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                  {category}
                </h2>
              </div>
              
              {/* 리그 카드 그리드 */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3 mt-3">
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