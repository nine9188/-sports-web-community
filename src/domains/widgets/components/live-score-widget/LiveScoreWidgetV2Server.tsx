import { MatchData as FootballMatchData, TodayMatchesResult, fetchTodayMatches } from '@/domains/livescore/actions/footballApi';
import { Container } from '@/shared/components/ui';
import LeagueToggleClient from './LeagueToggleClient';
import LeagueHeader from './LeagueHeader';
import MatchCardServer from './MatchCardServer';
import WidgetHeader from './WidgetHeader';
import LiveScoreCacheSeeder from '@/shared/components/LiveScoreCacheSeeder';
import type { WidgetLeague, WidgetMatch } from './types';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

function getKickoffTime(dateString?: string): string | undefined {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    const kst = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const hours = kst.getHours().toString().padStart(2, '0');
    const minutes = kst.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return undefined;
  }
}

function groupMatchesByLeague(
  matches: FootballMatchData[],
  dateLabel: 'yesterday' | 'today' | 'tomorrow' = 'today'
): WidgetLeague[] {
  const leagueMap = new Map<number, { matches: WidgetMatch[]; firstMatch: FootballMatchData }>();

  for (const match of matches) {
    if (!match.league?.id) continue;

    const leagueId = match.league.id;
    const homeId = match.teams?.home?.id || 0;
    const awayId = match.teams?.away?.id || 0;

    const widgetMatch: WidgetMatch = {
      id: String(match.id),
      homeTeam: {
        id: homeId,
        name: match.teams?.home?.name || '홈팀',
        logo: match.teams?.home?.logo || TEAM_PLACEHOLDER,
      },
      awayTeam: {
        id: awayId,
        name: match.teams?.away?.name || '원정팀',
        logo: match.teams?.away?.logo || TEAM_PLACEHOLDER,
      },
      score: {
        home: match.goals?.home ?? 0,
        away: match.goals?.away ?? 0,
      },
      status: match.status?.code || 'NS',
      elapsed: match.status?.elapsed || 0,
      dateLabel,
      kickoffTime: getKickoffTime(match.time?.date),
    };

    if (!leagueMap.has(leagueId)) {
      leagueMap.set(leagueId, { matches: [], firstMatch: match });
    }

    leagueMap.get(leagueId)!.matches.push(widgetMatch);
  }

  return Array.from(leagueMap.entries()).map(([leagueId, { matches: leagueMatches, firstMatch }]) => ({
    id: String(leagueId),
    name: firstMatch.league?.name || '리그',
    icon: '',
    logo: firstMatch.league?.logo,
    logoDark: firstMatch.league?.logoDark,
    leagueIdNumber: leagueId,
    matches: leagueMatches,
  }));
}

const BIG_MATCH_LEAGUES = [
  39,
  140,
  78,
  135,
  61,
  2,
  3,
  848,
  531,
  45,
  292,
  293,
  10,
];

const LEAGUE_PRIORITY: Record<number, number> = {
  39: 1,
  2: 2,
  3: 3,
  140: 4,
  78: 4,
  135: 4,
  61: 4,
  45: 5,
  848: 6,
  531: 7,
  292: 8,
  293: 8.5,
  10: 9,
};

export function transformToWidgetLeagues(result: TodayMatchesResult): WidgetLeague[] {
  if (!result.success || !result.data) return [];

  const todayMatches = (result.data.today?.matches || [])
    .filter((match) => BIG_MATCH_LEAGUES.includes(match.league?.id || 0));

  const leagues = groupMatchesByLeague(todayMatches, 'today');

  leagues.sort((a, b) => {
    const pa = LEAGUE_PRIORITY[Number(a.id)] ?? 99;
    const pb = LEAGUE_PRIORITY[Number(b.id)] ?? 99;
    return pa - pb;
  });

  return leagues;
}

interface LiveScoreWidgetV2ServerProps {
  initialData?: WidgetLeague[];
}

export default async function LiveScoreWidgetV2Server({ initialData }: LiveScoreWidgetV2ServerProps = {}) {
  const leagues = initialData ?? [];

  if (leagues.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <WidgetHeader />
        <div className="py-4 px-4 text-center">
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2">
            최근 빅매치가 없습니다
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            프리미어리그 · 라리가 · 분데스리가 · 세리에A · 리그앙 · UEFA 대항전 · FA컵 · K리그1/2 · 국가대표 경기
          </p>
        </div>
      </Container>
    );
  }

  return (
    <div className="space-y-4">
      {leagues.map((league, index) => {
        const isFirst = index === 0;

        return (
          <Container
            key={league.id}
            className="bg-white dark:bg-[#1D1D1D]"
          >
            {isFirst && <WidgetHeader />}

            <LeagueToggleClient
              defaultExpanded={isFirst}
              matchCount={league.matches.length}
              header={<LeagueHeader league={league} />}
              matches={isFirst ? undefined : league.matches}
            >
              {isFirst && league.matches.map((match, idx) => (
                <MatchCardServer
                  key={match.id}
                  match={match}
                  isLast={idx === league.matches.length - 1}
                  eager
                />
              ))}
            </LeagueToggleClient>
          </Container>
        );
      })}
    </div>
  );
}

export async function LiveScoreWidgetStreaming() {
  const todayData = await fetchTodayMatches();
  const leagues = transformToWidgetLeagues(todayData);

  return (
    <>
      <LiveScoreCacheSeeder data={todayData} />
      <LiveScoreWidgetV2Server initialData={leagues} />
    </>
  );
}
