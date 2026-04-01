// ISR: 1시간마다 재생성 (리그 목록/로고는 거의 변하지 않음)
export const revalidate = 3600;

import { MAJOR_LEAGUE_IDS, LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';
import { LeagueCard } from '@/domains/livescore/components/football/leagues';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import TrackPageVisit from '@/domains/layout/components/TrackPageVisit';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getLeagueLogoUrls } from '@/domains/livescore/actions/images';

export async function generateMetadata() {
  return buildMetadata({
    title: '축구 리그 순위 · 팀 정보',
    description: 'EPL 순위, 라리가 순위, 세리에A 순위, 분데스리가 순위, K리그 순위표와 팀별 선수단, 경기 일정, 통계를 한눈에 확인하세요. 축구 커뮤니티 4590 Football.',
    path: '/livescore/football/leagues',
    keywords: ['EPL 순위', '프리미어리그 순위', '라리가 순위', 'K리그 순위', '세리에A 득점 순위', '챔피언스리그 대진표', '축구 리그 순위표', '해외축구', '축구 커뮤니티', '4590', '4590football'],
  });
}

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
  // 4590 표준: 서버에서 모든 리그 로고 URL 배치 조회
  const allLeagueIds = Object.values(LEAGUE_CATEGORIES).flat();
  const [leagueLogos, leagueLogosDark] = await Promise.all([
    getLeagueLogoUrls(allLeagueIds),
    getLeagueLogoUrls(allLeagueIds, true),  // 다크모드
  ]);

  return (
    <div className="min-h-screen w-full">
      <TrackPageVisit id="datacenter" slug="livescore/football/leagues" name="리그·팀" />
      <div className="container mx-auto w-full">
        {/* 페이지 헤더 */}
        <Container>
          <ContainerHeader>
            <ContainerTitle>리그·팀</ContainerTitle>
          </ContainerHeader>
          <ContainerContent>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              리그를 선택하면 각 리그의 순위와 팀 정보를 확인할 수 있습니다.
            </p>
          </ContainerContent>
        </Container>

        <div className="space-y-4 mt-4">
          {Object.entries(LEAGUE_CATEGORIES).map(([category, leagueIds]) => (
            <Container key={category}>
              <ContainerHeader>
                <ContainerTitle>{category}</ContainerTitle>
              </ContainerHeader>

              <ContainerContent className="px-2 lg:px-4">
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 lg:gap-3">
                  {leagueIds.map((leagueId) => (
                    <LeagueCard
                      key={leagueId}
                      leagueId={leagueId}
                      name={LEAGUE_NAMES_MAP[leagueId]}
                      leagueLogoUrl={leagueLogos[leagueId] || undefined}
                      leagueLogoDarkUrl={leagueLogosDark[leagueId] || undefined}
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