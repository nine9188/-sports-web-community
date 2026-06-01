'use client';

import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import type { PlayerStats } from '@/domains/livescore/actions/teams/player-stats';
import type { Player, Coach } from '@/domains/livescore/actions/teams/squad';
import type { TeamTransfersData } from '@/domains/livescore/actions/teams/transfers';
import type { StandingDisplay, StandingItem } from '@/domains/livescore/types/standings';
import { getMatchHref, getPlayerHref, getTeamHref } from '@/domains/livescore/utils/entityLinks';
import { leagueUrl } from '@/domains/livescore/utils/urls';
import type { Match } from './MatchItems';
import type { PlayerKoreanNames } from '../../../TeamPageClient';

type TeamAboutTeam = {
  team: {
    id: number;
    name: string;
    country?: string;
    founded?: number;
  };
  venue?: {
    name?: string;
    city?: string;
    capacity?: number;
  };
};

type TeamAboutStats = {
  league?: {
    name: string;
    country?: string;
    season?: number;
  };
  fixtures?: {
    wins: { total: number };
    draws: { total: number };
    loses: { total: number };
  };
  goals?: {
    for: {
      total?: { total: number };
      average?: { total: string };
    };
    against: {
      total?: { total: number };
      average?: { total: string };
    };
  };
  clean_sheet?: { total: number };
  form?: string;
};

interface TeamAboutProps {
  team: TeamAboutTeam;
  stats?: TeamAboutStats;
  matches?: Match[];
  standings?: StandingDisplay[];
  playerStats?: Record<number, PlayerStats>;
  squad?: (Player | Coach)[];
  transfers?: TeamTransfersData;
  playerKoreanNames?: PlayerKoreanNames;
}

type RankedPlayer = {
  id: number;
  name: string;
  appearances: number;
  goals: number;
  assists: number;
};

type AboutSection = {
  title: string;
  paragraphs: ReactNode[];
  items?: LinkedItem[];
  standingItems?: Array<{
    item: StandingItem;
    isCurrentTeam: boolean;
  }>;
  groups?: Array<{
    heading: string;
    items: LinkedItem[];
  }>;
};

type LinkedItem = {
  key: string;
  content: ReactNode;
};

const finishedStatuses = new Set(['FT', 'AET', 'PEN', 'FT_PEN', 'AWD', 'WO']);
const upcomingStatuses = new Set(['NS', 'TBD', 'SUSP', 'PST']);
const inlineLinkClass = 'font-medium text-gray-900 underline-offset-2 hover:underline dark:text-[#F0F0F0]';

function formatNumber(value?: number) {
  if (!value) return '';
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function resultLabel(match: Match, teamId: number) {
  const isHome = match.teams.home.id === teamId;
  const teamGoals = isHome ? match.goals.home : match.goals.away;
  const opponentGoals = isHome ? match.goals.away : match.goals.home;
  if (teamGoals == null || opponentGoals == null) return '결과 미정';
  if (teamGoals > opponentGoals) return `${teamGoals}-${opponentGoals} 승리`;
  if (teamGoals < opponentGoals) return `${teamGoals}-${opponentGoals} 패배`;
  return `${teamGoals}-${opponentGoals} 무승부`;
}

function opponentName(match: Match, teamId: number) {
  return match.teams.home.id === teamId ? match.teams.away.name : match.teams.home.name;
}

function opponentTeam(match: Match, teamId: number) {
  return match.teams.home.id === teamId ? match.teams.away : match.teams.home;
}

function venueLabel(match: Match, teamId: number) {
  return match.teams.home.id === teamId ? '홈' : '원정';
}

function formatPlayerGoals(players: RankedPlayer[]) {
  return players.map(player => ({
    key: `goals-${player.id}`,
    content: (
      <>
        <Link href={getPlayerHref({ id: player.id, name: player.name })} className={inlineLinkClass} prefetch={false}>
          {player.name}
        </Link>{' '}
        {player.goals}골
      </>
    ),
  }));
}

function formatPlayerAssists(players: RankedPlayer[]) {
  return players.map(player => ({
    key: `assists-${player.id}`,
    content: (
      <>
        <Link href={getPlayerHref({ id: player.id, name: player.name })} className={inlineLinkClass} prefetch={false}>
          {player.name}
        </Link>{' '}
        {player.assists}도움
      </>
    ),
  }));
}

function formatPlayerAppearances(players: RankedPlayer[]) {
  return players.map(player => ({
    key: `appearances-${player.id}`,
    content: (
      <>
        <Link href={getPlayerHref({ id: player.id, name: player.name })} className={inlineLinkClass} prefetch={false}>
          {player.name}
        </Link>{' '}
        {player.appearances}경기 출전
      </>
    ),
  }));
}

function formatTransferInList(transfers: TeamTransfersData['in']) {
  return transfers.map(item => {
    const playerLink = (
      <Link href={getPlayerHref({ id: item.player.id, name: item.player.name })} className={inlineLinkClass} prefetch={false}>
        {item.player.name}
      </Link>
    );
    const fromTeamLink = item.fromTeam?.id && item.fromTeam?.name ? (
      <Link href={getTeamHref({ id: item.fromTeam.id, name: item.fromTeam.name })} className={inlineLinkClass} prefetch={false}>
        {item.fromTeam.name}
      </Link>
    ) : null;

    return {
      key: `transfer-in-${item.player.id}-${item.fromTeam?.id || 'unknown'}-${item.date}`,
      content: fromTeamLink ? <>{playerLink} {fromTeamLink}에서 합류</> : <>{playerLink} 합류</>,
    };
  });
}

function formatTransferOutList(transfers: TeamTransfersData['out']) {
  return transfers.map(item => {
    const playerLink = (
      <Link href={getPlayerHref({ id: item.player.id, name: item.player.name })} className={inlineLinkClass} prefetch={false}>
        {item.player.name}
      </Link>
    );
    const toTeamLink = item.toTeam?.id && item.toTeam?.name ? (
      <Link href={getTeamHref({ id: item.toTeam.id, name: item.toTeam.name })} className={inlineLinkClass} prefetch={false}>
        {item.toTeam.name}
      </Link>
    ) : null;

    return {
      key: `transfer-out-${item.player.id}-${item.toTeam?.id || 'unknown'}-${item.date}`,
      content: toTeamLink ? <>{playerLink} {toTeamLink}로 이동</> : <>{playerLink} 팀을 떠남</>,
    };
  });
}

function findCurrentStanding(standings: StandingDisplay[] | undefined, teamId: number): StandingItem | null {
  for (const group of standings || []) {
    const found = group.standings?.find(item => item.team.id === teamId);
    if (found) return found;
  }
  return null;
}

function findCurrentStandingLeague(standings: StandingDisplay[] | undefined, teamId: number): StandingDisplay | null {
  if (!standings || standings.length === 0) return null;

  const teamLeagues = standings.filter(group =>
    Array.isArray(group.standings) && group.standings.some(item => item.team.id === teamId)
  );

  return (
    teamLeagues.find(group =>
      !group.league.name.includes('Champions') &&
      !group.league.name.includes('Europa') &&
      !group.league.name.includes('Conference')
    ) ||
    teamLeagues[0] ||
    standings[0] ||
    null
  );
}

function getTeamGroupStandings(standingLeague: StandingDisplay | null, teamId: number) {
  if (!standingLeague?.standings) return [];
  const teamGroup = standingLeague.standings.find(item => item.team.id === teamId)?.group;
  const leagueStandings = teamGroup
    ? standingLeague.standings.filter(item => item.group === teamGroup)
    : standingLeague.standings;

  return [...leagueStandings].sort((a, b) => a.rank - b.rank);
}

function rankPlayers(
  playerStats: Record<number, PlayerStats> | undefined,
  squad: (Player | Coach)[] | undefined,
  playerKoreanNames: PlayerKoreanNames | undefined
): RankedPlayer[] {
  if (!playerStats || !squad) return [];

  const playerMap = new Map<number, string>();
  for (const member of squad) {
    if (member.position === 'Coach') continue;
    playerMap.set(member.id, playerKoreanNames?.[member.id] || member.name);
  }

  return Object.entries(playerStats)
    .map(([id, stats]) => ({
      id: Number(id),
      name: playerMap.get(Number(id)) || '',
      appearances: stats.appearances || 0,
      goals: stats.goals || 0,
      assists: stats.assists || 0,
    }))
    .filter(player => player.name && (player.goals > 0 || player.assists > 0))
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists));
}

function buildFormSummary(form?: string) {
  const recent = form?.split('').reverse().slice(0, 5) || [];
  if (recent.length === 0) return null;

  const wins = recent.filter(item => item === 'W').length;
  const draws = recent.filter(item => item === 'D').length;
  const losses = recent.filter(item => item === 'L').length;
  return `최근 ${recent.length}경기에서는 ${wins}승 ${draws}무 ${losses}패 흐름을 보이고 있습니다.`;
}

function formatStandingItem(item: StandingItem) {
  const diff = item.goalsDiff > 0 ? `+${item.goalsDiff}` : item.goalsDiff;
  return `${item.points}점, ${item.all.played}경기 ${item.all.win}승 ${item.all.draw}무 ${item.all.lose}패, 득실차 ${diff}`;
}

function renderInlineItems(items: LinkedItem[]) {
  return items.map((item, index) => (
    <Fragment key={item.key}>
      {item.content}
      {index === items.length - 1 ? '입니다.' : ', '}
    </Fragment>
  ));
}

export default function TeamAbout({
  team,
  stats,
  matches,
  standings,
  playerStats,
  squad,
  transfers,
  playerKoreanNames = {},
}: TeamAboutProps) {
  const { getLeagueKoreanName } = useTeamLeague();
  const teamName = team.team.name;
  const leagueName = stats?.league?.name ? (getLeagueKoreanName(stats.league.name) || stats.league.name) : '';
  const currentStanding = findCurrentStanding(standings, team.team.id);
  const standingLeague = findCurrentStandingLeague(standings, team.team.id);
  const fullStandings = getTeamGroupStandings(standingLeague, team.team.id);
  const fixtureStats = stats?.fixtures;
  const played = fixtureStats
    ? fixtureStats.wins.total + fixtureStats.draws.total + fixtureStats.loses.total
    : 0;
  const goalsFor = stats?.goals?.for?.total?.total;
  const goalsAgainst = stats?.goals?.against?.total?.total;
  const avgFor = stats?.goals?.for?.average?.total;
  const avgAgainst = stats?.goals?.against?.average?.total;
  const cleanSheets = stats?.clean_sheet?.total;
  const rankedPlayers = rankPlayers(playerStats, squad, playerKoreanNames);
  const topScorers = [...rankedPlayers]
    .filter(player => player.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);
  const topAssisters = [...rankedPlayers]
    .filter(player => player.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5);
  const topAppearances = [...rankedPlayers]
    .filter(player => player.appearances > 0)
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 3);
  const recentMatches = (matches || [])
    .filter(match => finishedStatuses.has(match.fixture.status.short))
    .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
    .slice(0, 5);
  const upcomingMatch = (matches || [])
    .filter(match => upcomingStatuses.has(match.fixture.status.short))
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())[0];
  const transferIn = transfers?.in?.slice(0, 5) || [];
  const transferOut = transfers?.out?.slice(0, 5) || [];
  const getDisplayLeagueName = (name: string) => getLeagueKoreanName(name) || name;

  const sections: AboutSection[] = [];
  const overviewParagraphs: ReactNode[] = [];
  const seasonParagraphs: ReactNode[] = [];
  const matchParagraphs: ReactNode[] = [];
  const playerGroups: AboutSection['groups'] = [];
  const transferGroups: AboutSection['groups'] = [];

  overviewParagraphs.push(
    <>
      <Link href={getTeamHref({ id: team.team.id, name: teamName })} className={inlineLinkClass} prefetch={false}>
        {teamName}
      </Link>
      은 축구팀입니다. 이 페이지에서는 {teamName}의 최근 경기 결과, 다음 일정, 리그 순위, 주요 선수 기록과 이적 현황을 함께 확인할 수 있습니다.
    </>
  );

  const introParts = [
    leagueName ? `${teamName}은 ${leagueName} 소속입니다` : '',
    team.team.country ? `${team.team.country}을 기반으로 활동합니다` : '',
    team.team.founded ? `${team.team.founded}년에 창단되었습니다` : '',
  ].filter(Boolean);
  if (introParts.length > 0) overviewParagraphs.push(`${introParts.join('. ')}.`);

  if (team.venue?.name) {
    const venueParts = [
      `${teamName}은 ${team.venue.name}에서 홈 경기를 치릅니다`,
      team.venue.city ? `연고 도시는 ${team.venue.city}입니다` : '',
      team.venue.capacity ? `경기장 수용 인원은 ${formatNumber(team.venue.capacity)}명입니다` : '',
    ].filter(Boolean);
    overviewParagraphs.push(`${venueParts.join('. ')}.`);
  }

  if (overviewParagraphs.length > 0) {
    sections.push({ title: '팀 개요', paragraphs: overviewParagraphs });
  }

  if (played > 0 && fixtureStats) {
    seasonParagraphs.push(
      `${teamName}은 이번 시즌 ${played}경기에서 ${fixtureStats.wins.total}승 ${fixtureStats.draws.total}무 ${fixtureStats.loses.total}패를 기록하고 있습니다.` +
      (currentStanding
        ? ` 현재 ${currentStanding.points}점으로 ${currentStanding.rank}위에 올라 있으며, 순위표 기준 득실차는 ${currentStanding.goalsDiff > 0 ? `+${currentStanding.goalsDiff}` : currentStanding.goalsDiff}입니다.`
        : '')
    );
  } else if (currentStanding) {
    seasonParagraphs.push(`${teamName}은 현재 ${currentStanding.points}점으로 ${currentStanding.rank}위에 올라 있으며, 순위표 기준 ${currentStanding.all.played}경기 ${currentStanding.all.win}승 ${currentStanding.all.draw}무 ${currentStanding.all.lose}패를 기록하고 있습니다.`);
  }

  if (goalsFor != null || goalsAgainst != null || cleanSheets != null) {
    const parts = [];
    if (goalsFor != null) parts.push(`${goalsFor}득점${avgFor ? `(경기당 ${avgFor})` : ''}`);
    if (goalsAgainst != null) parts.push(`${goalsAgainst}실점${avgAgainst ? `(경기당 ${avgAgainst})` : ''}`);
    if (cleanSheets != null) parts.push(`${cleanSheets}경기 클린시트`);
    seasonParagraphs.push(`시즌 공격과 수비 지표에서는 ${parts.join(', ')}를 기록하고 있습니다.`);
  }

  if (seasonParagraphs.length > 0) {
    sections.push({ title: '시즌 흐름', paragraphs: seasonParagraphs });
  }

  if (standingLeague && fullStandings.length > 0) {
    sections.push({
      title: `${getDisplayLeagueName(standingLeague.league.name)} 순위`,
      paragraphs: [
        <>
          현재{' '}
          <Link href={leagueUrl(standingLeague.league.id)} className={inlineLinkClass} prefetch={false}>
            {getDisplayLeagueName(standingLeague.league.name)}
          </Link>{' '}
          순위표는 다음과 같습니다.
        </>,
      ],
      standingItems: fullStandings.map(item => ({
        item,
        isCurrentTeam: item.team.id === team.team.id,
      })),
    });
  }

  const formSummary = buildFormSummary(stats?.form);
  if (formSummary || recentMatches.length > 0) {
    const recentItems = recentMatches.map(match => {
      const opponent = opponentTeam(match, team.team.id);
      return {
        key: `recent-match-${match.fixture.id}`,
        content: (
          <>
            {formatDate(match.fixture.date)}{' '}
            <Link href={leagueUrl(match.league.id)} className={inlineLinkClass} prefetch={false}>
              {getDisplayLeagueName(match.league.name)}
            </Link>{' '}
            <Link href={getTeamHref({ id: opponent.id, name: opponent.name })} className={inlineLinkClass} prefetch={false}>
              {opponentName(match, team.team.id)}
            </Link>
            전{' '}
            <Link href={getMatchHref(match)} className={inlineLinkClass} prefetch={false}>
              {resultLabel(match, team.team.id)}
            </Link>
          </>
        ),
      };
    });
    if (formSummary) matchParagraphs.push(formSummary);
    if (recentItems.length > 0) {
      matchParagraphs.push('최근 주요 결과는 다음과 같습니다.');
    }

    sections.push({
      title: '최근 경기와 일정',
      paragraphs: matchParagraphs,
      items: recentItems,
    });
  }

  if (upcomingMatch) {
    const opponent = opponentTeam(upcomingMatch, team.team.id);
    const upcomingText = (
      <>
        다음 일정은 {formatDate(upcomingMatch.fixture.date)}{' '}
        <Link href={leagueUrl(upcomingMatch.league.id)} className={inlineLinkClass} prefetch={false}>
          {getDisplayLeagueName(upcomingMatch.league.name)}
        </Link>{' '}
        <Link href={getTeamHref({ id: opponent.id, name: opponent.name })} className={inlineLinkClass} prefetch={false}>
          {opponentName(upcomingMatch, team.team.id)}
        </Link>
        전입니다.{' '}
        <Link href={getMatchHref(upcomingMatch)} className={inlineLinkClass} prefetch={false}>
          {venueLabel(upcomingMatch, team.team.id)} 경기
        </Link>
        로 예정되어 있습니다.
      </>
    );
    const existingMatchSection = sections.find(section => section.title === '최근 경기와 일정');
    if (existingMatchSection) {
      existingMatchSection.paragraphs.push(upcomingText);
    } else {
      sections.push({ title: '최근 경기와 일정', paragraphs: [upcomingText] });
    }
  }

  if (topScorers.length > 0) {
    playerGroups.push({ heading: '득점 기록은 다음과 같습니다.', items: formatPlayerGoals(topScorers) });
  }

  if (topAssisters.length > 0) {
    playerGroups.push({ heading: '도움 기록은 다음과 같습니다.', items: formatPlayerAssists(topAssisters) });
  }

  if (topAppearances.length > 0) {
    playerGroups.push({ heading: '출전 기록은 다음과 같습니다.', items: formatPlayerAppearances(topAppearances) });
  }

  if (playerGroups.length > 0) {
    sections.push({
      title: '선수 기록',
      paragraphs: [],
      groups: playerGroups,
    });
  }

  if (transferIn.length > 0) {
    transferGroups.push({ heading: '최근 영입 선수는 다음과 같습니다.', items: formatTransferInList(transferIn) });
  }

  if (transferOut.length > 0) {
    transferGroups.push({ heading: '최근 방출 또는 이적 선수는 다음과 같습니다.', items: formatTransferOutList(transferOut) });
  }

  if (transferGroups.length > 0) {
    sections.push({
      title: '이적 현황',
      paragraphs: [],
      groups: transferGroups,
    });
  }

  sections.push({
    title: `${teamName} 정보 확인`,
    paragraphs: [
      <>
        {teamName}의 시즌 흐름을 볼 때는 최근 경기 결과와 리그 순위, 주요 선수의 득점·도움 기록, 선수단 변화와 이적 현황을 함께 확인하는 것이 좋습니다.
      </>,
    ],
  });

  if (sections.length === 0) return null;

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>About {teamName}</ContainerTitle>
      </ContainerHeader>
      <div>
        {sections.map((section) => (
          <section key={section.title} className="px-3 py-3">
            <div className="space-y-2">
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-[13px] leading-6 text-gray-700 dark:text-gray-300">
                  {paragraph}
                </p>
              ))}
              {section.items && section.items.length > 0 && (
                <ul className="space-y-1.5">
                  {section.items.map((item, index) => (
                    <li key={item.key} className="text-[13px] leading-6 text-gray-700 dark:text-gray-300">
                      {item.content}
                      {index === section.items!.length - 1 ? '입니다.' : ','}
                    </li>
                  ))}
                </ul>
              )}
              {section.standingItems && section.standingItems.length > 0 && (
                <ul className="space-y-1.5">
                  {section.standingItems.map((item, index) => {
                    const suffix = index === section.standingItems!.length - 1 ? '입니다.' : ',';
                    const content = (
                      <>
                        {item.item.rank}.{' '}
                        <Link href={getTeamHref({ id: item.item.team.id, name: item.item.team.name })} className={inlineLinkClass} prefetch={false}>
                          {item.item.team.name}
                        </Link>{' '}
                        {formatStandingItem(item.item)}
                      </>
                    );
                    return (
                      <li key={`${item.item.team.id}-${item.item.rank}`} className="text-[13px] leading-6 text-gray-700 dark:text-gray-300">
                        {item.isCurrentTeam ? (
                          <strong className="font-semibold text-gray-900 dark:text-[#F0F0F0]">
                            {content}
                          </strong>
                        ) : (
                          content
                        )}
                        {suffix}
                      </li>
                    );
                  })}
                </ul>
              )}
              {section.groups && section.groups.length > 0 && (
                <div className="space-y-2">
                  {section.groups.map(group => (
                    <div key={group.heading} className="space-y-1">
                      <p className="text-[13px] font-medium leading-6 text-gray-900 dark:text-[#F0F0F0]">
                        {group.heading}
                      </p>
                      <p className="text-[13px] leading-6 text-gray-700 dark:text-gray-300">
                        {renderInlineItems(group.items)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}
