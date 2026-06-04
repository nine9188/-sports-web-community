'use client';

import Link from 'next/link';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import type { PlayerFullDataResponse } from '@/domains/livescore/actions/player/data';
import type { PlayerStatistic } from '@/domains/livescore/types/player';
import { getTeamHref } from '@/domains/livescore/utils/entityLinks';
import { getLeagueSlug } from '@/domains/livescore/utils/slugs';

type PlayerAboutProps = {
  playerId: string;
  initialData?: Partial<PlayerFullDataResponse>;
  playerKoreanName?: string | null;
};

const inlineLinkClass = 'font-medium text-gray-900 underline-offset-2 hover:underline dark:text-[#F0F0F0]';

const POSITION_MAP: Record<string, string> = {
  Goalkeeper: '골키퍼',
  Defender: '수비수',
  Midfielder: '미드필더',
  Attacker: '공격수',
  Forward: '공격수',
};

export default function PlayerAbout({
  playerId,
  initialData,
  playerKoreanName,
}: PlayerAboutProps) {
  const { getTeamById, getLeagueKoreanName } = useTeamLeague();
  const player = initialData?.playerData;
  const info = player?.info;
  const statistics = sortStatistics(initialData?.statistics || player?.statistics || []);
  const stat = pickPrimaryStatistic(statistics);

  if (!info && !stat) return null;

  const playerName = playerKoreanName || info?.name || `선수 ${playerId}`;
  const mappedTeam = stat?.team?.id ? getTeamById(stat.team.id) : undefined;
  const teamName = mappedTeam?.name_ko || stat?.team?.name || '';
  const teamHref = stat?.team?.id
    ? getTeamHref({
        id: stat.team.id,
        name: stat.team.name,
        name_ko: mappedTeam?.name_ko,
        name_en: mappedTeam?.name_en,
        slug: mappedTeam?.slug,
      })
    : '';
  const leagueName = stat?.league?.id
    ? getLeagueKoreanName(stat.league.name) || stat.league.name
    : stat?.league?.name || '';
  const leagueHref = stat?.league?.id
    ? `/livescore/football/leagues/${stat.league.id}/${getLeagueSlug(stat.league.id, stat.league.name)}`
    : '';
  const position = stat?.games?.position ? POSITION_MAP[stat.games.position] || stat.games.position : '';
  const profileParts = [
    info?.nationality ? `국적은 ${info.nationality}` : '',
    info?.age ? `${info.age}세` : '',
    position ? `${position}` : '',
    info?.height ? `키 ${info.height}` : '',
    info?.weight ? `몸무게 ${info.weight}` : '',
  ].filter(Boolean);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>About {playerName} 선수 설명</ContainerTitle>
      </ContainerHeader>

      <ContainerContent className="space-y-4 px-4 py-3 text-[13px] leading-6 text-gray-700 dark:text-gray-300">
        <p>
          {playerName}
          {profileParts.length > 0 ? ` 선수는 ${profileParts.join(', ')}인 축구 선수` : ' 선수는 축구 선수'}
          {teamName ? (
            <>
              이며 현재{' '}
              {teamHref ? (
                <Link href={teamHref} className={inlineLinkClass} prefetch={false}>{teamName}</Link>
              ) : teamName}
              {leagueName ? (
                <>
                  {' '}소속으로{' '}
                  {leagueHref ? (
                    <Link href={leagueHref} className={inlineLinkClass} prefetch={false}>{leagueName}</Link>
                  ) : leagueName}
                  에 출전하고 있습니다.
                </>
              ) : '에서 뛰고 있습니다.'}
            </>
          ) : '입니다.'}
        </p>

        {info?.birth?.date && (
          <p>
            생년월일은 {formatDate(info.birth.date)}
            {info.birth.place ? `, 출생지는 ${info.birth.place}` : ''}
            {info.birth.country ? ` ${info.birth.country}` : ''}입니다.
          </p>
        )}

        {statistics.map((item, index) => {
          const itemTeam = item.team?.id ? getTeamById(item.team.id) : undefined;
          const itemTeamName = itemTeam?.name_ko || item.team?.name || '';
          const itemLeagueName = item.league?.id
            ? getLeagueKoreanName(item.league.name) || item.league.name
            : item.league?.name || '';
          const itemTeamHref = item.team?.id
            ? getTeamHref({
                id: item.team.id,
                name: item.team.name,
                name_ko: itemTeam?.name_ko,
                name_en: itemTeam?.name_en,
                slug: itemTeam?.slug,
              })
            : '';
          const itemLeagueHref = item.league?.id
            ? `/livescore/football/leagues/${item.league.id}/${getLeagueSlug(item.league.id, item.league.name)}`
            : '';
          const summaries = [
            buildSeasonSummary(playerName, item, itemTeamName, itemLeagueName),
            buildSubstituteSummary(playerName, item),
            buildAttackSummary(playerName, item),
            buildDefenseSummary(playerName, item),
            buildDisciplineSummary(playerName, item),
          ].filter(Boolean);

          if (summaries.length === 0) return null;

          return (
            <section key={`${item.league?.id || 'league'}-${item.team?.id || 'team'}-${index}`} className="space-y-2">
              <h3 className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">
                {[item.league?.season ? `${item.league.season} 시즌` : '', itemTeamName, itemLeagueName]
                  .filter(Boolean)
                  .join(' · ')}
              </h3>
              {(itemTeamHref || itemLeagueHref) && (
                <p>
                  {itemTeamHref ? (
                    <Link href={itemTeamHref} className={inlineLinkClass} prefetch={false}>{itemTeamName}</Link>
                  ) : itemTeamName}
                  {itemTeamName && itemLeagueName ? ' 소속으로 ' : ''}
                  {itemLeagueHref ? (
                    <Link href={itemLeagueHref} className={inlineLinkClass} prefetch={false}>{itemLeagueName}</Link>
                  ) : itemLeagueName}
                  {itemLeagueName ? '에서 기록한 시즌 통계입니다.' : ''}
                </p>
              )}
              {summaries.map((summary) => (
                <p key={summary}>{summary}</p>
              ))}
            </section>
          );
        })}
      </ContainerContent>
    </Container>
  );
}

function pickPrimaryStatistic(statistics: PlayerStatistic[]): PlayerStatistic | undefined {
  return sortStatistics(statistics).sort((a, b) => {
    const aMinutes = a.games?.minutes || 0;
    const bMinutes = b.games?.minutes || 0;
    return bMinutes - aMinutes;
  })[0];
}

function sortStatistics(statistics: PlayerStatistic[]): PlayerStatistic[] {
  return [...statistics].sort((a, b) => {
    const priorityA = getLeaguePriority(a.league?.id || 0);
    const priorityB = getLeaguePriority(b.league?.id || 0);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return (b.games?.minutes || 0) - (a.games?.minutes || 0);
  });
}

function getLeaguePriority(leagueId: number): number {
  const majorLeagues = [39, 140, 78, 135, 61];
  if (majorLeagues.includes(leagueId)) return 1;

  const secondTierLeagues = [40, 179, 88, 94, 119];
  if (secondTierLeagues.includes(leagueId)) return 2;

  const otherMajorLeagues = [292, 98, 253, 307, 71, 262, 169];
  if (otherMajorLeagues.includes(leagueId)) return 3;

  const europeanCups = [2, 3, 848];
  if (europeanCups.includes(leagueId)) return 4;

  return 5;
}

function buildSeasonSummary(
  playerName: string,
  stat?: PlayerStatistic,
  teamName?: string,
  leagueName?: string
) {
  if (!stat) return '';

  const parts = [
    stat.games?.appearences != null ? `${stat.games.appearences}경기에 출전` : '',
    stat.games?.lineups != null ? `${stat.games.lineups}경기에 선발 출전` : '',
    stat.games?.minutes != null ? `총 ${stat.games.minutes}분을 소화` : '',
    stat.games?.rating ? `평균 평점 ${stat.games.rating}` : '',
    stat.games?.number ? `등번호 ${stat.games.number}번` : '',
    stat.games?.captain ? '주장으로 출전한 기록' : '',
  ].filter(Boolean);

  if (parts.length === 0) return '';

  const seasonLabel = stat.league?.season ? `${stat.league.season} 시즌` : '이번 시즌';
  const context = [teamName, leagueName].filter(Boolean).join(' · ');
  return `${playerName} 선수는 ${seasonLabel}${context ? ` ${context} 기준으로` : ''} ${joinKoreanList(parts)}했습니다.`;
}

function buildSubstituteSummary(playerName: string, stat?: PlayerStatistic) {
  if (!stat) return '';

  const parts = [
    stat.substitutes?.in != null ? `교체 투입 ${stat.substitutes.in}회` : '',
    stat.substitutes?.out != null ? `교체 아웃 ${stat.substitutes.out}회` : '',
    stat.substitutes?.bench != null ? `벤치 대기 ${stat.substitutes.bench}회` : '',
  ].filter(Boolean);

  if (parts.length === 0) return '';

  return `${playerName} 선수의 교체 기록은 ${joinKoreanList(parts)}로 나타납니다.`;
}

function buildAttackSummary(playerName: string, stat?: PlayerStatistic) {
  if (!stat) return '';

  const isGoalkeeper = stat.games?.position === 'Goalkeeper';
  const parts = [
    stat.goals?.total != null ? `${stat.goals.total}골` : '',
    stat.goals?.assists != null ? `${stat.goals.assists}도움` : '',
    stat.shots?.total != null ? `슈팅 ${stat.shots.total}회` : '',
    stat.shots?.on != null ? `유효 슈팅 ${stat.shots.on}회` : '',
    stat.passes?.total != null ? `패스 ${stat.passes.total}회` : '',
    stat.passes?.key != null ? `키패스 ${stat.passes.key}회` : '',
    stat.passes?.accuracy ? `패스 성공률 ${stat.passes.accuracy}%` : '',
    stat.passes?.cross != null ? `크로스 ${stat.passes.cross}회` : '',
  ].filter(Boolean);

  if (parts.length === 0) return '';

  if (isGoalkeeper) {
    return `공격 전개에서는 ${joinKoreanList(parts)}를 기록하며 후방 빌드업과 세트피스 이후 전개에도 관여하고 있습니다.`;
  }

  return `공격 지표에서는 ${joinKoreanList(parts)}를 기록하고 있어 득점, 도움, 슈팅, 찬스 메이킹 흐름을 함께 확인할 수 있습니다.`;
}

function buildDefenseSummary(playerName: string, stat?: PlayerStatistic) {
  if (!stat) return '';

  if (stat.games?.position === 'Goalkeeper') {
    const goalkeeperParts = [
      stat.goals?.saves != null ? `세이브 ${stat.goals.saves}회` : '',
      stat.goals?.conceded != null ? `${stat.goals.conceded}실점` : '',
      stat.goals?.cleansheets != null ? `클린시트 ${stat.goals.cleansheets}회` : '',
      stat.penalty?.saved != null ? `페널티 선방 ${stat.penalty.saved}회` : '',
    ].filter(Boolean);

    if (goalkeeperParts.length === 0) return '';
    return `${playerName} 선수의 골키퍼 기록은 ${joinKoreanList(goalkeeperParts)}이며, 실점 억제와 선방 기록을 함께 볼 수 있습니다.`;
  }

  const parts = [
    stat.tackles?.total != null ? `태클 ${stat.tackles.total}회` : '',
    stat.tackles?.blocks != null ? `블록 ${stat.tackles.blocks}회` : '',
    stat.tackles?.interceptions != null ? `인터셉트 ${stat.tackles.interceptions}회` : '',
    stat.tackles?.clearances != null ? `클리어링 ${stat.tackles.clearances}회` : '',
    stat.duels?.total != null ? `경합 ${stat.duels.won || 0}/${stat.duels.total}회 성공` : '',
    stat.dribbles?.attempts != null ? `드리블 ${stat.dribbles.success || 0}/${stat.dribbles.attempts}회 성공` : '',
    stat.cards?.yellow != null ? `경고 ${stat.cards.yellow}장` : '',
  ].filter(Boolean);

  if (parts.length === 0) return '';

  return `수비와 경기 관여 지표에서는 ${joinKoreanList(parts)}를 기록해 공수 양면에서의 움직임을 확인할 수 있습니다.`;
}

function buildDisciplineSummary(playerName: string, stat?: PlayerStatistic) {
  if (!stat) return '';

  const parts = [
    stat.fouls?.drawn != null ? `파울 획득 ${stat.fouls.drawn}회` : '',
    stat.fouls?.committed != null ? `파울 범함 ${stat.fouls.committed}회` : '',
    stat.cards?.yellow != null ? `경고 ${stat.cards.yellow}장` : '',
    stat.cards?.yellowred != null ? `누적 경고 퇴장 ${stat.cards.yellowred}장` : '',
    stat.cards?.red != null ? `퇴장 ${stat.cards.red}장` : '',
    stat.penalty?.won != null ? `페널티 획득 ${stat.penalty.won}회` : '',
    stat.penalty?.commited != null ? `페널티 허용 ${stat.penalty.commited}회` : '',
    stat.penalty?.scored != null ? `페널티 득점 ${stat.penalty.scored}회` : '',
    stat.penalty?.missed != null ? `페널티 실패 ${stat.penalty.missed}회` : '',
    stat.penalty?.saved != null ? `페널티 선방 ${stat.penalty.saved}회` : '',
  ].filter(Boolean);

  if (parts.length === 0) return '';

  return `${playerName} 선수의 파울, 카드, 페널티 기록은 ${joinKoreanList(parts)}입니다.`;
}

function joinKoreanList(items: string[]) {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')}, ${items[items.length - 1]}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}
