import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import PlayerFixtures from '@/domains/livescore/components/football/player/tabs/PlayerFixtures';
import PlayerInjuries from '@/domains/livescore/components/football/player/tabs/PlayerInjuries';
import PlayerRankings from '@/domains/livescore/components/football/player/tabs/PlayerRankings';
import PlayerStats from '@/domains/livescore/components/football/player/tabs/PlayerStats';
import PlayerTransfers from '@/domains/livescore/components/football/player/tabs/PlayerTransfers';
import PlayerTrophies from '@/domains/livescore/components/football/player/tabs/PlayerTrophies';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import type {
  FixtureData,
  InjuryData,
  PlayerRanking,
  PlayerStatistic,
  TransferData,
  TrophyData,
} from '@/domains/livescore/types/player';

export const metadata: Metadata = {
  title: 'Player Tab UI Preview',
  robots: { index: false, follow: false },
};

const teamLogoUrls: Record<number, string> = {
  42: 'https://media.api-sports.io/football/teams/42.png',
  50: 'https://media.api-sports.io/football/teams/50.png',
  65: 'https://media.api-sports.io/football/teams/65.png',
  173: 'https://media.api-sports.io/football/teams/173.png',
};

const leagueLogoUrls: Record<number, string> = {
  2: 'https://media.api-sports.io/football/leagues/2.png',
  39: 'https://media.api-sports.io/football/leagues/39.png',
};

const stat: PlayerStatistic = {
  team: { id: 65, name: 'Nottingham Forest', logo: teamLogoUrls[65] },
  league: { id: 39, name: 'Premier League', logo: leagueLogoUrls[39], country: 'England', season: 2025 },
  games: { appearences: 34, lineups: 33, minutes: 2909, number: 10, position: 'Midfielder', rating: '6.88', captain: false },
  substitutes: { in: 1, out: 15, bench: 1 },
  shots: { total: 54, on: 28 },
  goals: { total: 13, assists: 3, conceded: 0, saves: 0 },
  passes: { total: 1131, key: 45, accuracy: '81', cross: 0 },
  tackles: { total: 19, blocks: 2, interceptions: 11, clearances: 0 },
  duels: { total: 302, won: 121 },
  dribbles: { attempts: 52, success: 25, past: 0 },
  fouls: { drawn: 39, committed: 24 },
  cards: { yellow: 1, yellowred: 0, red: 0 },
  penalty: { won: 1, commited: 0, scored: 1, missed: 0, saved: 0 },
};

const fixtures: FixtureData[] = [
  {
    fixture: { id: 1379306, date: '2026-04-24T19:00:00+00:00', timestamp: 1777057200 },
    league: { id: 39, name: 'Premier League', country: 'England', logo: leagueLogoUrls[39], season: 2025 },
    teams: {
      home: { id: 50, name: 'Manchester City', logo: teamLogoUrls[50] },
      away: { id: 65, name: 'Nottingham Forest', logo: teamLogoUrls[65] },
      playerTeamId: 65,
    },
    goals: { home: '1', away: '2' },
    statistics: {
      games: { minutes: 90, rating: '7.9' },
      goals: { total: 1, assists: 0 },
      shots: { total: 3, on: 2 },
      passes: { total: 41, key: 2 },
    },
  },
];

const transfers: TransferData[] = [
  {
    date: '2025-07-01',
    type: 'Transfer',
    teams: {
      from: { id: 173, name: 'RB Leipzig', logo: teamLogoUrls[173] },
      to: { id: 42, name: 'Arsenal', logo: teamLogoUrls[42] },
    },
  },
  {
    date: '2023-07-01',
    type: 'Loan',
    teams: {
      from: { id: 173, name: 'RB Leipzig', logo: teamLogoUrls[173] },
      to: { id: 65, name: 'Nottingham Forest', logo: teamLogoUrls[65] },
    },
  },
];

const injuries: InjuryData[] = [
  {
    fixture: { date: '2026-02-15T15:00:00+00:00' },
    league: { name: 'Premier League', season: '2025' },
    team: { id: 65, name: 'Nottingham Forest', logo: teamLogoUrls[65] },
    type: '결장',
    reason: '근육 부상',
  },
];

const trophies: TrophyData[] = [
  { league: 'Premier League', country: 'England', season: '2025', place: '우승', leagueLogo: leagueLogoUrls[39] },
  { league: 'UEFA Champions League', country: 'World', season: '2024/2025', place: '준우승', leagueLogo: leagueLogoUrls[2] },
];

const rankingPlayers: PlayerRanking[] = [
  makeRanking(1, 'E. Haaland', 50, 27, 5, 32, 2800),
  makeRanking(2, 'M. Salah', 50, 24, 12, 33, 2920),
  makeRanking(18746, 'M. Gibbs-White', 65, 13, 3, 34, 2909),
  makeRanking(3, 'B. Saka', 42, 12, 10, 31, 2600),
];

function makeRanking(
  id: number,
  name: string,
  teamId: number,
  goals: number,
  assists: number,
  appearences: number,
  minutes: number
): PlayerRanking {
  return {
    player: { id, name, photo: '' },
    statistics: [
      {
        team: {
          id: teamId,
          name: teamId === 65 ? 'Nottingham Forest' : teamId === 42 ? 'Arsenal' : 'Manchester City',
          logo: teamLogoUrls[teamId] || '',
        },
        goals: { total: goals, assists },
        games: { appearences, minutes },
        cards: { yellow: 2, red: 0 },
      },
    ],
  };
}

export default function PlayerUiPreviewPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">선수 탭 UI 비교</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          왼쪽은 실제 UI, 오른쪽은 로딩 UI 컨테이너 형태입니다.
        </p>
      </div>

      <PreviewSection title="선수 통계" actual={<PlayerStats statistics={[stat]} teamLogoUrls={teamLogoUrls} leagueLogoUrls={leagueLogoUrls} leagueLogoDarkUrls={leagueLogoUrls} />} loading={<SimpleTabLoading title="선수 통계" />} />
      <PreviewSection title="경기별 통계" actual={<PlayerFixtures playerId={18746} fixturesData={{ data: fixtures, completeness: { total: 1, success: 1, failed: 0 } }} />} loading={<SimpleTabLoading title="경기별 통계" />} />
      <PreviewSection title="순위" actual={<PlayerRankings playerId={18746} leagueId={39} rankingsData={{ topScorers: rankingPlayers, playerPhotoUrls: {}, teamLogoUrls }} playerKoreanNames={{ 18746: '모건 깁스-화이트' }} />} loading={<RankingsTabLoading />} />
      <PreviewSection title="이적 기록" actual={<PlayerTransfers playerId={115589} transfersData={transfers} teamLogoUrls={teamLogoUrls} />} loading={<SimpleTabLoading title="이적 기록" />} />
      <PreviewSection title="부상 기록" actual={<PlayerInjuries playerId={18746} injuriesData={injuries} teamLogoUrls={teamLogoUrls} />} loading={<SimpleTabLoading title="부상 기록" />} />
      <PreviewSection title="트로피" actual={<PlayerTrophies playerId={18746} trophiesData={trophies} leagueLogoUrls={leagueLogoUrls} leagueLogoDarkUrls={leagueLogoUrls} />} loading={<SimpleTabLoading title="트로피" />} />
    </main>
  );
}

function PreviewSection({ title, actual, loading }: { title: string; actual: ReactNode; loading: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-bold text-gray-900 dark:text-[#F0F0F0]">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">실제 UI</div>
          {actual}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">로딩 UI</div>
          {loading}
        </div>
      </div>
    </section>
  );
}

function RankingsTabLoading() {
  const tabs = ['최다 득점', '최다 어시스트', '최다 득점 경기', '최소 출전 시간', '경고', '퇴장'];

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex overflow-x-auto overflow-hidden border border-black/7 bg-[#F5F5F5] no-scrollbar dark:border-0 dark:bg-[#262626] md:rounded-lg">
          {tabs.map((tab, index) => (
            <div
              key={tab}
              className={`flex h-12 flex-1 items-center justify-center whitespace-nowrap px-3 text-xs font-medium ${
                index === 0
                  ? 'border-b-2 border-[#002FA7] bg-white font-semibold text-gray-900 dark:bg-[#1D1D1D] dark:text-[#F0F0F0]'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>
      <Container>
        <ContainerContent>
          <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">순위 데이터를 불러오는 중...</p>
        </ContainerContent>
      </Container>
    </div>
  );
}

function SimpleTabLoading({ title }: { title: string }) {
  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>
      <ContainerContent>
        <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">불러오는 중...</p>
      </ContainerContent>
    </Container>
  );
}
