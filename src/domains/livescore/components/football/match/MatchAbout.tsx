'use client';

import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import type { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import type { HeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead';
import type { HeaderGoalEvent } from './MatchHeader';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';
import { getMatchHrefByTeams, getPlayerHref, getTeamHref } from '@/domains/livescore/utils/entityLinks';

type MatchAboutProps = {
  initialData: MatchFullDataResponse;
  powerData?: HeadToHeadTestData;
  goalEvents?: HeaderGoalEvent[];
  playerKoreanNames?: Record<number, string | null>;
};

type RawMatchData = {
  fixture?: {
    date?: string;
    venue?: { name?: string; city?: string };
    status?: { short?: string; long?: string; elapsed?: number | null };
  };
  league?: {
    id?: number;
    name?: string;
    season?: number;
    round?: string;
  };
  teams?: {
    home?: { id?: number; name?: string; name_ko?: string };
    away?: { id?: number; name?: string; name_ko?: string };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

const finishedStatuses = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);
const upcomingStatuses = new Set(['TBD', 'NS', 'PST', 'SUSP']);
const inlineLinkClass = 'font-medium text-gray-900 underline-offset-2 hover:underline dark:text-[#F0F0F0]';

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seoulDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = seoulDate.getUTCFullYear();
  const month = seoulDate.getUTCMonth() + 1;
  const day = seoulDate.getUTCDate();
  const weekday = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][seoulDate.getUTCDay()];
  const hour24 = seoulDate.getUTCHours();
  const minute = seoulDate.getUTCMinutes();
  const period = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 % 12 || 12;

  return `${year}년 ${month}월 ${day}일 ${weekday} ${period} ${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatShortDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seoulDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${seoulDate.getUTCFullYear()}년 ${seoulDate.getUTCMonth() + 1}월 ${seoulDate.getUTCDate()}일`;
}

function formatRound(round?: string) {
  if (!round) return '';
  if (round.includes('Regular Season')) {
    const roundNumber = round.split(' - ')[1];
    return roundNumber ? `${roundNumber}라운드` : round;
  }
  return round;
}

function formatStatus(statusCode?: string, statusName?: string) {
  switch (statusCode) {
    case 'TBD':
      return '경기 시간이 아직 확정되지 않았습니다';
    case 'NS':
      return '경기 시작 전입니다';
    case '1H':
    case '2H':
    case 'ET':
    case 'LIVE':
      return '경기가 진행 중입니다';
    case 'HT':
      return '하프타임입니다';
    case 'FT':
      return '경기가 종료되었습니다';
    case 'AET':
      return '연장전까지 진행된 경기입니다';
    case 'PEN':
      return '승부차기까지 진행된 경기입니다';
    case 'PST':
      return '경기가 연기되었습니다';
    case 'CANC':
      return '경기가 취소되었습니다';
    case 'ABD':
    case 'SUSP':
      return '경기가 중단되었습니다';
    default:
      return statusName || '';
  }
}

function scoreText(statusCode?: string, homeGoals?: number | null, awayGoals?: number | null) {
  if (upcomingStatuses.has(statusCode || '') || homeGoals == null || awayGoals == null) {
    return 'vs';
  }
  return `${homeGoals}-${awayGoals}`;
}

function teamResultText(summary?: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number }) {
  if (!summary) return '';
  return `${summary.win}승 ${summary.draw}무 ${summary.loss}패, ${summary.goalsFor}득점 ${summary.goalsAgainst}실점`;
}

function resultLabel(result: 'W' | 'D' | 'L') {
  if (result === 'W') return '승리';
  if (result === 'D') return '무승부';
  return '패배';
}

function isGeneratedTeamName(value?: string) {
  return !value || /^팀\s+\d+$/.test(value);
}

function renderPlayerStatLinks(
  players: Array<{ playerId: number; name?: string; goals?: number; assists?: number }>,
  valueKey: 'goals' | 'assists',
  playerKoreanNames: Record<number, string | null>
) {
  return players.map((player, index) => {
    const playerName = playerKoreanNames[player.playerId] || player.name || `#${player.playerId}`;
    const value = valueKey === 'goals' ? player.goals : player.assists;
    const suffix = valueKey === 'goals' ? '골' : '도움';

    return (
      <span key={`${valueKey}-${player.playerId}`}>
        {index > 0 ? ', ' : ''}
        <Link
          href={getPlayerHref({ id: player.playerId, name: player.name })}
          className={inlineLinkClass}
          prefetch={false}
        >
          {playerName}
        </Link>
        {' '}{value ?? 0}{suffix}
      </span>
    );
  });
}

function buildGoalEventSentence(
  event: HeaderGoalEvent,
  index: number,
  isLast: boolean,
  playerKoreanNames: Record<number, string | null>,
  displayTeamName: (teamId?: number, fallback?: string) => string
) {
  const playerName = event.player?.id
    ? playerKoreanNames[event.player.id] || event.player.name
    : event.player?.name || '선수';
  const teamName = event.team?.id
    ? displayTeamName(event.team.id, event.team.name)
    : event.team?.name || '해당 팀';
  const minute = event.time?.extra
    ? `${event.time.elapsed}+${event.time.extra}분`
    : `${event.time?.elapsed ?? ''}분`;
  const assistName = event.assist?.name
    ? playerKoreanNames[event.assist.id || 0] || event.assist.name
    : '';

  const prefix = index === 0 ? `경기 시작 ${minute}에` : `${minute}에는`;
  const teamLabel = event.team?.id ? (
    <Link href={getTeamHref({ id: event.team.id, name: event.team.name })} className={inlineLinkClass} prefetch={false}>
      {teamName}
    </Link>
  ) : teamName;
  const playerLabel = event.player?.id ? (
    <Link href={getPlayerHref({ id: event.player.id, name: event.player.name })} className={inlineLinkClass} prefetch={false}>
      {playerName}
    </Link>
  ) : playerName;
  const assistLabel = event.assist?.id ? (
    <Link href={getPlayerHref({ id: event.assist.id, name: event.assist.name || undefined })} className={inlineLinkClass} prefetch={false}>
      {assistName}
    </Link>
  ) : assistName;
  const endText = isLast ? '입니다.' : '';

  if (event.goalKind === 'penalty') {
    return <>{prefix} {teamLabel}의 {playerLabel}가 페널티킥으로 득점{endText}</>;
  }

  if (event.goalKind === 'ownGoal') {
    return <>{prefix} {teamLabel}의 {playerLabel}가 자책골을 기록{endText}</>;
  }

  if (assistName) {
    return <>{prefix} {teamLabel}이 {assistLabel}의 도움을 받은 {playerLabel}의 득점{endText}</>;
  }

  return <>{prefix} {teamLabel}의 {playerLabel}가 득점{endText}</>;
}

export default function MatchAbout({
  initialData,
  powerData,
  goalEvents = [],
  playerKoreanNames = {},
}: MatchAboutProps) {
  const { getTeamDisplayName, getLeagueKoreanName } = useTeamLeague();
  const rawData = initialData.matchData as RawMatchData | undefined;
  const match = initialData.match;

  if (!match) return null;

  const homeTeamId = match.teams.home.id;
  const awayTeamId = match.teams.away.id;
  const homeTeamName = getTeamDisplayName(homeTeamId, { language: 'ko' }) || rawData?.teams?.home?.name_ko || match.teams.home.name;
  const awayTeamName = getTeamDisplayName(awayTeamId, { language: 'ko' }) || rawData?.teams?.away?.name_ko || match.teams.away.name;
  const leagueId = match.league.id || rawData?.league?.id;
  const leagueName = getLeagueKoreanName(rawData?.league?.name || match.league.name) || rawData?.league?.name || match.league.name;
  const roundText = formatRound(rawData?.league?.round);
  const dateText = formatDateTime(match.time.date || rawData?.fixture?.date);
  const venueParts = [rawData?.fixture?.venue?.name, rawData?.fixture?.venue?.city].filter(Boolean);
  const venueText = venueParts.join(', ');
  const statusCode = match.status.code || rawData?.fixture?.status?.short;
  const statusText = formatStatus(statusCode, match.status.name || rawData?.fixture?.status?.long);
  const displayScore = scoreText(statusCode, match.goals.home, match.goals.away);
  const leagueHref = leagueId
    ? `/livescore/football/leagues/${leagueId}/${getLeagueSlug(leagueId, leagueName)}`
    : null;
  const isFinished = finishedStatuses.has(statusCode || '');

  const h2hSummary = powerData?.h2h?.resultSummary;
  const recentSummary = powerData?.recent;
  const homeTopScorers = powerData?.topPlayers?.teamA?.topScorers || [];
  const awayTopScorers = powerData?.topPlayers?.teamB?.topScorers || [];
  const homeTopAssists = powerData?.topPlayers?.teamA?.topAssist || [];
  const awayTopAssists = powerData?.topPlayers?.teamB?.topAssist || [];
  const h2hItems = powerData?.h2h?.items || [];
  const homeRecentItems = powerData?.recent?.teamA?.items || [];
  const awayRecentItems = powerData?.recent?.teamB?.items || [];
  const visibleGoalEvents = goalEvents.slice(0, 6);
  const displayTeamName = (teamId?: number, fallback?: string) => {
    const mappedName = teamId ? getTeamDisplayName(teamId, { language: 'ko' }) : '';
    return isGeneratedTeamName(mappedName) ? (fallback || mappedName || '') : mappedName;
  };
  const displayLeagueName = (name?: string) => getLeagueKoreanName(name) || name || '대회';

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>About {homeTeamName} vs {awayTeamName} 경기 설명</ContainerTitle>
      </ContainerHeader>

      <div className="space-y-4 px-4 py-4 text-[13px] leading-6 text-gray-700 dark:text-gray-300">
        <p>
          <Link href={getTeamHref({ id: homeTeamId, name: match.teams.home.name })} className={inlineLinkClass} prefetch={false}>
            {homeTeamName}
          </Link>
          와{' '}
          <Link href={getTeamHref({ id: awayTeamId, name: match.teams.away.name })} className={inlineLinkClass} prefetch={false}>
            {awayTeamName}
          </Link>
          의 {leagueHref ? (
            <Link href={leagueHref} className={inlineLinkClass} prefetch={false}>{leagueName}</Link>
          ) : leagueName} 경기 정보입니다.
          {dateText ? ` 경기 시간은 ${dateText}입니다.` : ''}
          {venueText ? ` 경기장은 ${venueText}입니다.` : ''}
          {roundText ? ` 대회 라운드는 ${roundText}입니다.` : ''}
        </p>

        <p>
          이 페이지에서는 {homeTeamName}와 {awayTeamName}의 실시간 스코어, 경기 상태, 최근 경기 흐름, 맞대결 기록, 주요 선수 기록과 리그 순위를 함께 확인할 수 있습니다.
          {statusText ? ` 현재 상태는 ${statusText}.` : ''}
          {displayScore !== 'vs' ? ` 현재 또는 최종 스코어는 ${homeTeamName} ${displayScore} ${awayTeamName}입니다.` : ''}
        </p>

        {(h2hSummary || recentSummary) && (
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">최근 흐름과 맞대결</h3>
            <ul className="space-y-1.5">
              {h2hSummary && (
                <li>
                  최근 맞대결 기준 {homeTeamName}은 {teamResultText(h2hSummary.teamA)}을 기록하고 있으며, {awayTeamName}은 {teamResultText(h2hSummary.teamB)}을 기록하고 있습니다.
                </li>
              )}
              {recentSummary?.teamA?.summary && (
                <li>
                  {homeTeamName}의 최근 {recentSummary.teamA.last}경기 흐름은 {teamResultText(recentSummary.teamA.summary)}입니다.
                </li>
              )}
              {recentSummary?.teamB?.summary && (
                <li>
                  {awayTeamName}의 최근 {recentSummary.teamB.last}경기 흐름은 {teamResultText(recentSummary.teamB.summary)}입니다.
                </li>
              )}
            </ul>
          </div>
        )}

        {h2hItems.length > 0 && (
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">맞대결 경기 목록</h3>
            <ul className="space-y-1.5">
              {h2hItems.map((item, index) => {
                const homeName = displayTeamName(item.teams.home.id, item.teams.home.name) || '홈팀';
                const awayName = displayTeamName(item.teams.away.id, item.teams.away.name) || '원정팀';
                const isLast = index === h2hItems.length - 1;
                return (
                  <li key={`h2h-${item.fixtureId}`}>
                    <Link
                      href={getMatchHrefByTeams(item.fixtureId, item.teams.home, item.teams.away)}
                      className={inlineLinkClass}
                      prefetch={false}
                    >
                      {formatShortDate(item.utcDate)} {displayLeagueName(item.league.name)} {homeName} {item.score.home}-{item.score.away} {awayName}
                    </Link>
                    {isLast ? ' 경기입니다.' : ' 경기'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {(homeRecentItems.length > 0 || awayRecentItems.length > 0) && (
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">양팀 최근 경기</h3>
            <div className="space-y-3">
              {homeRecentItems.length > 0 && (
                <div>
                  <p className="mb-1 font-medium text-gray-900 dark:text-[#F0F0F0]">{homeTeamName} 최근 경기</p>
                  <ul className="space-y-1.5">
                    {homeRecentItems.map((item, index) => {
                      const isLast = index === homeRecentItems.length - 1;
                      return (
                        <li key={`home-recent-${item.fixtureId}`}>
                          <Link
                            href={getMatchHrefByTeams(
                              item.fixtureId,
                              item.venue === 'home' ? { name: match.teams.home.name } : item.opponent,
                              item.venue === 'home' ? item.opponent : { name: match.teams.home.name }
                            )}
                            className={inlineLinkClass}
                            prefetch={false}
                          >
                            {formatShortDate(item.utcDate)} {item.venue === 'home' ? '홈' : '원정'} 경기, {displayTeamName(item.opponent.id, item.opponent.name) || '상대팀'}전 {item.score.for}-{item.score.against} {resultLabel(item.result)}
                          </Link>
                          {isLast ? '입니다.' : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {awayRecentItems.length > 0 && (
                <div>
                  <p className="mb-1 font-medium text-gray-900 dark:text-[#F0F0F0]">{awayTeamName} 최근 경기</p>
                  <ul className="space-y-1.5">
                    {awayRecentItems.map((item, index) => {
                      const isLast = index === awayRecentItems.length - 1;
                      return (
                        <li key={`away-recent-${item.fixtureId}`}>
                          <Link
                            href={getMatchHrefByTeams(
                              item.fixtureId,
                              item.venue === 'home' ? { name: match.teams.away.name } : item.opponent,
                              item.venue === 'home' ? item.opponent : { name: match.teams.away.name }
                            )}
                            className={inlineLinkClass}
                            prefetch={false}
                          >
                            {formatShortDate(item.utcDate)} {item.venue === 'home' ? '홈' : '원정'} 경기, {displayTeamName(item.opponent.id, item.opponent.name) || '상대팀'}전 {item.score.for}-{item.score.against} {resultLabel(item.result)}
                          </Link>
                          {isLast ? '입니다.' : ''}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {visibleGoalEvents.length > 0 && (
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
              {isFinished ? '득점 기록' : '주요 득점 상황'}
            </h3>
            <div className="space-y-1.5">
              {visibleGoalEvents.map((event, index) => (
                <p key={`${event.player?.id || event.player?.name || 'goal'}-${event.time?.elapsed || 0}-${index}`}>
                  {buildGoalEventSentence(
                    event,
                    index,
                    index === visibleGoalEvents.length - 1,
                    playerKoreanNames,
                    displayTeamName
                  )}
                </p>
              ))}
            </div>
          </div>
        )}

        {(homeTopScorers.length > 0 || awayTopScorers.length > 0 || homeTopAssists.length > 0 || awayTopAssists.length > 0) && (
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">주요 선수 기록</h3>
            <ul className="space-y-1.5">
              {homeTopScorers.length > 0 && (
                <li>
                  {homeTeamName} 주요 득점 선수는 {renderPlayerStatLinks(homeTopScorers, 'goals', playerKoreanNames)}입니다.
                </li>
              )}
              {homeTopAssists.length > 0 && (
                <li>
                  {homeTeamName} 주요 도움 선수는 {renderPlayerStatLinks(homeTopAssists, 'assists', playerKoreanNames)}입니다.
                </li>
              )}
              {awayTopScorers.length > 0 && (
                <li>
                  {awayTeamName} 주요 득점 선수는 {renderPlayerStatLinks(awayTopScorers, 'goals', playerKoreanNames)}입니다.
                </li>
              )}
              {awayTopAssists.length > 0 && (
                <li>
                  {awayTeamName} 주요 도움 선수는 {renderPlayerStatLinks(awayTopAssists, 'assists', playerKoreanNames)}입니다.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Container>
  );
}
