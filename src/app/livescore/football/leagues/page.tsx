import { MAJOR_LEAGUE_IDS, LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';
import { LeagueCard } from '@/domains/livescore/components/football/leagues';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';

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

export default async function LeaguesPage() {
  return (
    <div className="min-h-screen w-full">
      <TrackPageVisit id="datacenter" slug="livescore/football/leagues" name="데이터센터" />
      <div className="container mx-auto w-full">
        {/* 페이지 헤더 */}
        <Container>
          <ContainerHeader>
            <ContainerTitle>축구 리그</ContainerTitle>
          </ContainerHeader>
        </Container>

        <div className="space-y-4 mt-4">
          {Object.entries(LEAGUE_CATEGORIES).map(([category, leagueIds]) => (
            <Container key={category}>
              {/* 카테고리 헤더 */}
              <ContainerHeader>
                <ContainerTitle>{category}</ContainerTitle>
              </ContainerHeader>

              {/* 리그 카드 그리드 */}
              <ContainerContent>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3">
                  {leagueIds.map((leagueId) => (
                    <LeagueCard
                      key={leagueId}
                      leagueId={leagueId}
                      name={LEAGUE_NAMES_MAP[leagueId]}
                    />
                  ))}
                </div>
              </ContainerContent>
            </Container>
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