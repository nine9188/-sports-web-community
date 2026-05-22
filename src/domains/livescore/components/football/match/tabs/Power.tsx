'use client';

import React from 'react';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { Team } from '@/domains/livescore/types/match';
import { StandingsData } from '@/domains/livescore/types/match';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { PlayerKoreanNames } from '../MatchPageClient';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { getMatchHrefByTeams, getPlayerHref, getTeamHref } from '@/domains/livescore/utils/entityLinks';

// 4590 표준: placeholder URLs
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

interface PowerProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  playerKoreanNames?: PlayerKoreanNames;
  mode?: 'all' | 'summary' | 'comparison' | 'recent' | 'comparisonRecent' | 'h2h' | 'topPlayers';
  data?: {
    teamA: number;
    teamB: number;
    h2h: {
      last: number;
      items: Array<{
        fixtureId: number;
        utcDate: string;
        league: { name?: string };
        teams: { home: { id?: number; name?: string; logo?: string }; away: { id?: number; name?: string; logo?: string } };
        score: { home: number; away: number };
      }>;
      resultSummary: {
        teamA: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number };
        teamB: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number };
      };
    };
    recent: {
      teamA: { last: number; items: Array<{ fixtureId: number; opponent: { id?: number; name?: string; logo?: string }; venue: 'home'|'away'; score: { for: number; against: number }; result: 'W'|'D'|'L' }>; summary: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number } };
      teamB: { last: number; items: Array<{ fixtureId: number; opponent: { id?: number; name?: string; logo?: string }; venue: 'home'|'away'; score: { for: number; against: number }; result: 'W'|'D'|'L' }>; summary: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number } };
    };
    topPlayers: {
      teamA: { topScorers: Array<{ playerId: number; name?: string; goals: number }>; topAssist: Array<{ playerId: number; name?: string; assists: number }> };
      teamB: { topScorers: Array<{ playerId: number; name?: string; goals: number }>; topAssist: Array<{ playerId: number; name?: string; assists: number }> };
    };
    // 선택적: 순위 데이터(컨텍스트에서 로드됨)
    standings?: StandingsData | null;
    // 4590 표준: 선수 사진 Storage URL (playerId -> URL)
    playerPhotoUrls?: Record<number, string>;
    // 4590 표준: 팀 로고 Storage URL (teamId -> URL)
    teamLogoUrls?: Record<number, string>;
    leagueLogoUrls?: Record<number, string>;
  };
}

type PowerData = NonNullable<PowerProps['data']>;
type RecentItem = PowerData['recent']['teamA']['items'][number];
type TeamMeta = { name: string; slugName: string };
type TopScorer = PowerData['topPlayers']['teamA']['topScorers'][number];
type TopAssist = PowerData['topPlayers']['teamA']['topAssist'][number];
type PowerStanding = StandingsData['standings']['league']['standings'][number][number];

function createEmptyPowerData(teamA: number, teamB: number): PowerData {
  const emptySummary = { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 };

  return {
    teamA,
    teamB,
    h2h: {
      last: 5,
      items: [],
      resultSummary: {
        teamA: emptySummary,
        teamB: emptySummary,
      },
    },
    recent: {
      teamA: { last: 0, items: [], summary: emptySummary },
      teamB: { last: 0, items: [], summary: emptySummary },
    },
    topPlayers: {
      teamA: { topScorers: [], topAssist: [] },
      teamB: { topScorers: [], topAssist: [] },
    },
    teamLogoUrls: {},
    leagueLogoUrls: {},
    playerPhotoUrls: {},
  };
}

function findStandingForTeam(standings: StandingsData | null | undefined, teamId: number): PowerStanding | undefined {
  return standings?.standings?.league?.standings
    ?.flat()
    .find((standing) => standing.team.id === teamId);
}

export default function Power({ data: initialData, homeTeam, awayTeam, playerKoreanNames = {}, mode = 'all' }: PowerProps) {
  const { getTeamDisplayName, getLeagueKoreanName } = useTeamLeague();
  const showComparison = ['all', 'summary', 'comparison', 'comparisonRecent'].includes(mode);
  const showRecent = ['all', 'summary', 'recent', 'comparisonRecent'].includes(mode);
  const showH2H = ['all', 'summary', 'h2h'].includes(mode);
  const showTopPlayers = ['all', 'topPlayers'].includes(mode);

  const emptyData = React.useMemo(() => createEmptyPowerData(homeTeam.id, awayTeam.id), [homeTeam.id, awayTeam.id]);
  const recentData = initialData;
  const h2hData = initialData;
  const topPlayersData = initialData;
  const data: PowerData = {
    ...emptyData,
    recent: recentData?.recent ?? emptyData.recent,
    h2h: h2hData?.h2h ?? emptyData.h2h,
    topPlayers: topPlayersData?.topPlayers ?? emptyData.topPlayers,
    standings: initialData?.standings ?? null,
    teamLogoUrls: {
      ...(recentData?.teamLogoUrls || {}),
      ...(h2hData?.teamLogoUrls || {}),
      ...(topPlayersData?.teamLogoUrls || {}),
    },
    leagueLogoUrls: {
      ...(h2hData?.leagueLogoUrls || {}),
    },
    playerPhotoUrls: {
      ...(topPlayersData?.playerPhotoUrls || {}),
    },
  };
  // 4590 표준: teamLogoUrls에서 URL 조회 헬퍼
  const getTeamLogo = (teamId: number) => data.teamLogoUrls?.[teamId] || TEAM_PLACEHOLDER;

  // 팀 메타 추출 (이름만)
  const findTeamMeta = (id: number) => {
    const item = data.h2h.items.find((m) => (m.teams.home?.id === id) || (m.teams.away?.id === id))
    const originalName = item
      ? (item.teams.home?.id === id ? item.teams.home?.name : item.teams.away?.name)
      : id === homeTeam.id
        ? homeTeam.name
        : id === awayTeam.id
          ? awayTeam.name
          : undefined

    // 한국어 매핑 시도, 없으면 원래 영어 이름 사용
    const koreanName = getTeamDisplayName(id, { language: 'ko' })
    const displayName = koreanName.startsWith('팀 ') ? (originalName || `#${id}`) : koreanName

    return { name: displayName, slugName: originalName || displayName }
  }

  const teamAMeta = findTeamMeta(data.teamA)
  const teamBMeta = findTeamMeta(data.teamB)
  const teamHref = (id: number, name?: string) => getTeamHref({ id, name })
  const playerHref = (id: number, name?: string) => getPlayerHref({ id, name })
  const fixtureHref = (id: number, home?: string, away?: string) => getMatchHrefByTeams(id, { name: home }, { name: away })

  // 평균 득/실점 계산 (최근 폼 기준)
  const gamesA = Math.max(1, data.recent.teamA.last)
  const gamesB = Math.max(1, data.recent.teamB.last)
  const avgForA = data.recent.teamA.summary.goalsFor / gamesA
  const avgAgainstA = data.recent.teamA.summary.goalsAgainst / gamesA
  const avgForB = data.recent.teamB.summary.goalsFor / gamesB
  const avgAgainstB = data.recent.teamB.summary.goalsAgainst / gamesB
  const isRecentLoading = false;
  const isH2HLoading = false;
  const isTopPlayersLoading = false;

  const renderInlineState = (message: string) => (
    <div className="px-3 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );

  const renderTopPlayersListState = (isEmpty: boolean, emptyMessage: string) => {
    if (!isEmpty) return null;
    return renderInlineState(emptyMessage);
  };

  const getResultClass = (result: RecentItem['result']) => {
    if (result === 'W') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (result === 'D') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const renderRecentMatchRows = (items: RecentItem[], teamMeta: TeamMeta, side: 'teamA' | 'teamB') => (
    <div className="space-y-1.5">
      {isRecentLoading
        ? null
        : items.length === 0
          ? renderInlineState('최근 경기 데이터가 없습니다.')
          : null}
      {items.slice(0, 5).map((it) => {
        const opponentName = it.opponent.name || `팀 #${it.opponent.id}`;
        const displayName = getTeamDisplayName(it.opponent.id || 0, { language: 'ko' });
        const finalName = displayName.startsWith('팀 ') ? opponentName : displayName;
        const href = side === 'teamA'
          ? fixtureHref(it.fixtureId, teamMeta.slugName, it.opponent.name)
          : fixtureHref(it.fixtureId, it.opponent.name, teamMeta.slugName);

        return (
          <Link
            key={it.fixtureId}
            href={href}
            className="block rounded-md p-1 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333]"
          prefetch={false}
          >
            <div className="flex items-center gap-1.5 text-xs">
              {it.venue === 'home' ? (
                <>
                  <span className="flex-1 truncate text-right text-gray-900 dark:text-[#F0F0F0]">{teamMeta.name}</span>
                  <span className={`flex-shrink-0 rounded px-2 py-1 font-semibold ${getResultClass(it.result)}`}>{it.score.for}-{it.score.against}</span>
                  <span className="flex-1 truncate text-gray-900 dark:text-[#F0F0F0]">{finalName}</span>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-right text-gray-900 dark:text-[#F0F0F0]">{finalName}</span>
                  <span className={`flex-shrink-0 rounded px-2 py-1 font-semibold ${getResultClass(it.result)}`}>{it.score.against}-{it.score.for}</span>
                  <span className="flex-1 truncate text-gray-900 dark:text-[#F0F0F0]">{teamMeta.name}</span>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );

  const renderTopPlayerRows = (
    players: Array<TopScorer | TopAssist>,
    valueKey: 'goals' | 'assists',
    align: 'left' | 'right' = 'left'
  ) => (
    <div className="space-y-1.5">
      {players.map((player, index) => {
        const koreanName = playerKoreanNames[player.playerId];
        const displayName = koreanName || player.name || `#${player.playerId}`;
        const value = valueKey === 'goals' ? (player as TopScorer).goals : (player as TopAssist).assists;
        const content = (
          <>
            <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === 'right' ? 'md:justify-end' : ''}`}>
              <UnifiedSportsImageClient
                src={data.playerPhotoUrls?.[player.playerId] || PLAYER_PLACEHOLDER}
                alt={`${displayName} 선수 사진`}
                width={32}
                height={32}
                fit="cover"
                variant="circle"
                className={align === 'right' ? 'md:order-2' : undefined}
              />
              <span className={`truncate text-[13px] leading-snug text-gray-900 dark:text-[#F0F0F0] ${align === 'right' ? 'md:order-1' : ''}`}>
                {displayName}
              </span>
            </div>
            <span className="flex-shrink-0 text-base font-semibold text-gray-900 dark:text-white">{value}</span>
          </>
        );

        return (
          <Link
            key={`${valueKey}-${player.playerId}-${index}`}
            href={playerHref(player.playerId, player.name)}
            className={`flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] ${align === 'right' ? 'justify-between md:flex-row-reverse' : 'justify-between'}`}
          prefetch={false}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );

  const renderRecentContainer = (
    teamId: number,
    teamMeta: TeamMeta,
    items: RecentItem[],
    side: 'teamA' | 'teamB'
  ) => (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <div className="flex items-center gap-2">
          <ContainerTitle>최근 경기 - {teamMeta.name}</ContainerTitle>
          <UnifiedSportsImageClient
            src={getTeamLogo(teamId)}
            alt={teamMeta.name}
            width={20}
            height={20}
            fit="contain"
            className="h-5 w-5"
          />
        </div>
      </ContainerHeader>
      <ContainerContent>
        {renderRecentMatchRows(items, teamMeta, side)}
      </ContainerContent>
    </Container>
  );

  const renderTopPlayersContainer = (
    teamId: number,
    teamMeta: TeamMeta,
    players: { topScorers: TopScorer[]; topAssist: TopAssist[] },
    align: 'left' | 'right' = 'left'
  ) => (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <Link
          href={teamHref(teamId, teamMeta.slugName)}
          className={`flex items-center gap-2 rounded-md transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#333333] ${align === 'right' ? 'md:flex-row-reverse' : ''}`}
        prefetch={false}
        >
          <UnifiedSportsImageClient
            src={getTeamLogo(teamId)}
            alt={teamMeta.name}
            width={20}
            height={20}
            fit="contain"
            className="h-5 w-5"
          />
          <ContainerTitle>{teamMeta.name} 득점·도움 순위</ContainerTitle>
        </Link>
      </ContainerHeader>
      <ContainerContent>
        <div className="mb-2 rounded-md bg-[#F5F5F5] py-1 text-center text-xs font-semibold text-gray-700 dark:bg-[#262626] dark:text-gray-300">
          득점
        </div>
        <div className="mb-4">
          {renderTopPlayersListState(players.topScorers.length === 0, '득점 데이터가 없습니다.')}
          {renderTopPlayerRows(players.topScorers, 'goals', align)}
        </div>

        <div className="mb-2 rounded-md bg-[#F5F5F5] py-1 text-center text-xs font-semibold text-gray-700 dark:bg-[#262626] dark:text-gray-300">
          도움
        </div>
        {renderTopPlayersListState(players.topAssist.length === 0, '도움 데이터가 없습니다.')}
        {renderTopPlayerRows(players.topAssist, 'assists', align)}
      </ContainerContent>
    </Container>
  );

  // 바 차트 너비 정규화는 각 섹션에서 상대 비교로 처리

  return (
    <>
      {showComparison && (
      <>
      {/* 팀 비교(모바일 우선) */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>팀 비교</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
        {/* 1) VS행: 팀명, 순위, 승무패 */}
        <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1">
          <div className="text-right px-1">
            <Link href={teamHref(data.teamA, teamAMeta.slugName)} className="group flex items-center justify-end gap-2 mb-1" prefetch={false}>
              <div className="font-semibold truncate text-right text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">{teamAMeta.name}</div>
              <UnifiedSportsImageClient
                src={getTeamLogo(data.teamA)}
                alt={teamAMeta.name}
                width={32}
                height={32}
                fit="contain"
                className="w-8 h-8 group-hover:brightness-75 transition-all"
              />
            </Link>
            {data.standings?.standings?.league?.standings ? (
              (() => {
                const a = findStandingForTeam(data.standings, data.teamA)
                return (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{a?.rank ? `${a.rank}위` : '-'}·{a ? `${a.all.win}승 ${a.all.draw}무 ${a.all.lose}패` : '0승 0무 0패'}</span>
                  </div>
                )
              })()
            ) : null}
          </div>
          <div className="text-center px-1">
            <div className="text-lg font-extrabold text-gray-900 dark:text-[#F0F0F0]">VS</div>
          </div>
          <div className="text-left px-1">
            <Link href={teamHref(data.teamB, teamBMeta.slugName)} className="group flex items-center justify-start gap-2 mb-1" prefetch={false}>
              <UnifiedSportsImageClient
                src={getTeamLogo(data.teamB)}
                alt={teamBMeta.name}
                width={32}
                height={32}
                fit="contain"
                className="w-8 h-8 group-hover:brightness-75 transition-all"
              />
              <div className="font-semibold truncate text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">{teamBMeta.name}</div>
            </Link>
            {data.standings?.standings?.league?.standings ? (
              (() => {
                const b = findStandingForTeam(data.standings, data.teamB)
                return (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{b?.rank ? `${b.rank}위` : '-'}·{b ? `${b.all.win}승 ${b.all.draw}무 ${b.all.lose}패` : '0승 0무 0패'}</span>
                  </div>
                )
              })()
            ) : null}
          </div>
        </div>

        {/* 2) 평균득점행 (최근 양팀 맞대결 UI와 동일 처리) */}
        <div className="mt-4">
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 text-[13px]">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {avgForA > 0 && (
                  <div
                    className="h-2 bg-red-500 rounded absolute right-0"
                    style={{ width: `${Math.min((avgForA / Math.max(avgForA, avgForB)) * 100, 100)}%` }}
                  />
                )}
              </div>
              <span className="font-semibold min-w-8">{avgForA.toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs px-1 whitespace-nowrap">평균득점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{avgForB.toFixed(2)}</span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {avgForB > 0 && (
                  <div
                    className="h-2 bg-red-500 rounded"
                    style={{ width: `${Math.min((avgForB / Math.max(avgForA, avgForB)) * 100, 100)}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4) 평균실점행 (최근 양팀 맞대결 UI와 동일 처리) */}
        <div className="mt-3">
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 text-[13px]">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {avgAgainstA > 0 && (
                  <div
                    className="h-2 bg-blue-500 rounded absolute right-0"
                    style={{ width: `${Math.min((avgAgainstA / Math.max(avgAgainstA, avgAgainstB)) * 100, 100)}%` }}
                  />
                )}
              </div>
              <span className="font-semibold min-w-8">{avgAgainstA.toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs px-1 whitespace-nowrap">평균실점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{avgAgainstB.toFixed(2)}</span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {avgAgainstB > 0 && (
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${Math.min((avgAgainstB / Math.max(avgAgainstA, avgAgainstB)) * 100, 100)}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        </ContainerContent>
      </Container>

      {/* 최근 경기 - Team A (모바일) */}
      </>
      )}

      {showRecent && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderRecentContainer(data.teamA, teamAMeta, data.recent.teamA.items, 'teamA')}
          {renderRecentContainer(data.teamB, teamBMeta, data.recent.teamB.items, 'teamB')}
        </div>
      )}

      {showH2H && (
      <>
      {/* 최근 맞대결 리스트: 중앙 기준 좌/우 분할 */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>최근 양팀 맞대결</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
        
        {/* 경기 결과 목록 */}
        <div className="space-y-1">
          {isH2HLoading
            ? null
            : data.h2h.items.length === 0
              ? renderInlineState('맞대결 데이터가 없습니다.')
              : null}
          {data.h2h.items.map((m) => {
            const isTeamAHome = m.teams.home?.id === data.teamA
            const aScore = isTeamAHome ? m.score.home : m.score.away
            const bScore = isTeamAHome ? m.score.away : m.score.home
            return (
              <Link
                key={m.fixtureId}
                href={fixtureHref(m.fixtureId, m.teams.home.name, m.teams.away.name)}
                className="grid min-w-0 grid-cols-[minmax(0,2.8fr)_minmax(0,1.4fr)_minmax(0,2.8fr)] gap-1 items-center p-2 border-b border-black/5 dark:border-white/10 last:border-b-0 text-[13px] rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
              prefetch={false}
              >
                <div className="flex min-w-0 items-center justify-end px-1 gap-2">
                  <span className="min-w-0 truncate text-[13px]">{teamAMeta.name}</span>
                  <UnifiedSportsImageClient
                    src={getTeamLogo(data.teamA)}
                    alt={teamAMeta.name}
                    width={20}
                    height={20}
                    fit="contain"
                    className="w-5 h-5 flex-shrink-0"
                  />
                  <span className="font-semibold flex-shrink-0">{aScore}</span>
                </div>
                <div className="min-w-0 text-center text-gray-500 dark:text-gray-400 px-1">
                  <div className="text-xs whitespace-nowrap">{new Date(m.utcDate).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', timeZone: 'Asia/Seoul' }).replace(/\./g, '. ')}</div>
                  <div className="min-w-0 truncate whitespace-nowrap text-xs">{getLeagueKoreanName(m.league.name)}</div>
                </div>
                <div className="flex min-w-0 items-center justify-start px-1 gap-2">
                  <span className="font-semibold flex-shrink-0">{bScore}</span>
                  <UnifiedSportsImageClient
                    src={getTeamLogo(data.teamB)}
                    alt={teamBMeta.name}
                    width={20}
                    height={20}
                    fit="contain"
                    className="w-5 h-5 flex-shrink-0"
                  />
                  <span className="min-w-0 truncate text-[13px]">{teamBMeta.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
        
        {/* 요약 통계 */}
        <div className="mt-4 pt-3 border-t space-y-3">
          {/* 승무패 통계 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-[13px]">
            <div className="flex items-center justify-end px-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.win}W</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.draw}D</span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.loss}L</span>
                </div>
              </div>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">승무패</div>
            <div className="flex items-center justify-start px-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.win}W</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.draw}D</span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.loss}L</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 평균 득실점 통계 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-[13px]">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamA.goalsFor > 0 && (
                  <div className="h-2 bg-red-500 rounded absolute right-0" style={{ width: `${Math.min((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last) / Math.max((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last), (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last)) * 100, 100)}%` }} />
                )}
              </div>
              <span className="font-semibold min-w-8">
                {data.h2h.last > 0 ? (data.h2h.resultSummary.teamA.goalsFor / data.h2h.last).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">평균득점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">
                {data.h2h.last > 0 ? (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last).toFixed(2) : '0.00'}
              </span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamB.goalsFor > 0 && (
                  <div className="h-2 bg-red-500 rounded" style={{ width: `${Math.min((data.h2h.resultSummary.teamB.goalsFor / data.h2h.last) / Math.max((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last), (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last)) * 100, 100)}%` }} />
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-[13px]">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamA.goalsAgainst > 0 && (
                  <div className="h-2 bg-blue-500 rounded absolute right-0" style={{ width: `${Math.min((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)) / Math.max((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)), (data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1))) * 100, 100)}%` }} />
                )}
              </div>
              <span className="font-semibold min-w-8">{(data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)).toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">평균실점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{(data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1)).toFixed(2)}</span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamB.goalsAgainst > 0 && (
                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.min((data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1)) / Math.max((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)), (data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1))) * 100, 100)}%` }} />
                )}
              </div>
            </div>
          </div>
        </div>
        </ContainerContent>
      </Container>

      </>
      )}
      {showTopPlayers && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderTopPlayersContainer(data.teamA, teamAMeta, data.topPlayers.teamA)}
          {renderTopPlayersContainer(data.teamB, teamBMeta, data.topPlayers.teamB, 'right')}
        </div>
      )}
    </>
  );
}
