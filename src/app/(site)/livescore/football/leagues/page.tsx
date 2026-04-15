// ISR: 1시간마다 재생성 (리그 목록/로고는 거의 변하지 않음)
export const revalidate = 3600;

import { getLeaguesByIds } from '@/domains/livescore/actions/teamLeagueData';
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

// 리그 카테고리별 분류 (ID는 API-Football 리그 ID — 메타데이터는 leagues 테이블에서 조회)
const LEAGUE_CATEGORIES: Record<string, number[]> = {
  '유럽 주요 리그': [39, 140, 78, 135, 61],
  '유럽 컵 대회': [2, 3, 848],
  '유럽 기타 리그': [40, 179, 88, 94, 119],
  '아시아': [292, 293, 98, 169, 17, 307],
  '아메리카': [253, 71, 262],
  '국내 컵 대회': [45, 48, 143, 137, 66, 81],
  '국제 대회': [32, 30, 10, 5, 9, 13, 15, 531],
};

export default async function LeaguesPage() {
  // 4590 표준: 서버에서 모든 리그 로고 URL 배치 조회
  const allLeagueIds = Object.values(LEAGUE_CATEGORIES).flat();
  const [leagueLogos, leagueLogosDark, leagueInfoMap] = await Promise.all([
    getLeagueLogoUrls(allLeagueIds),
    getLeagueLogoUrls(allLeagueIds, true),  // 다크모드
    getLeaguesByIds(allLeagueIds),
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
                      name={leagueInfoMap[leagueId]?.name_ko || ''}
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