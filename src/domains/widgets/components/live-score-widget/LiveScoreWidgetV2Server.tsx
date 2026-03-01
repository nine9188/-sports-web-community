import React from 'react';
import { MatchData as FootballMatchData, MultiDayMatchesResult } from '@/domains/livescore/actions/footballApi';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';
import { resolveMatchNames } from '@/domains/livescore/utils/resolveMatchNames';
import { Container } from '@/shared/components/ui';
import LeagueToggleClient from './LeagueToggleClient';
import LeagueHeader from './LeagueHeader';
import MatchCardServer from './MatchCardServer';
import WidgetHeader from './WidgetHeader';
import type { WidgetLeague, WidgetMatch } from './types';

// 경기 시작 시간 추출 (HH:mm 형식, KST 고정)
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

// 경기 데이터를 Match 타입으로 변환
function convertToMatch(
  match: FootballMatchData,
  dateLabel: 'yesterday' | 'today' | 'tomorrow'
): WidgetMatch {
  const names = resolveMatchNames(match);

  return {
    id: String(match.id),
    homeTeam: {
      id: match.teams?.home?.id || 0,
      name: names.homeName || '홈팀',
      logo: match.teams?.home?.logo,
    },
    awayTeam: {
      id: match.teams?.away?.id || 0,
      name: names.awayName || '원정팀',
      logo: match.teams?.away?.logo,
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
}

// 리그별로 경기를 그룹화하는 함수 (어제+오늘+내일 통합)
function groupMatchesByLeague(
  yesterdayMatches: FootballMatchData[],
  todayMatches: FootballMatchData[],
  tomorrowMatches: FootballMatchData[]
): WidgetLeague[] {
  const leagueMap = new Map<number, { matches: WidgetMatch[]; firstMatch: FootballMatchData }>();

  const addMatches = (matches: FootballMatchData[], dateLabel: 'yesterday' | 'today' | 'tomorrow') => {
    matches.forEach(match => {
      if (!match.league?.id) return;
      const leagueId = match.league.id;

      if (!leagueMap.has(leagueId)) {
        leagueMap.set(leagueId, { matches: [], firstMatch: match });
      }
      leagueMap.get(leagueId)!.matches.push(convertToMatch(match, dateLabel));
    });
  };

  addMatches(yesterdayMatches, 'yesterday');
  addMatches(todayMatches, 'today');
  addMatches(tomorrowMatches, 'tomorrow');

  return Array.from(leagueMap.entries()).map(([leagueId, { matches, firstMatch }]) => {
    const leagueInfo = getLeagueById(leagueId);

    return {
      id: String(leagueId),
      name: leagueInfo?.nameKo || firstMatch.league?.name || '리그',
      icon: '⚽',
      logo: firstMatch.league?.logo,
      logoDark: firstMatch.league?.logoDark,
      leagueIdNumber: leagueId,
      matches,
    };
  });
}

// 빅매치 리그 ID - 유럽 Top 5 리그 + 유럽 컵대회 + FA컵 + K리그1
const BIG_MATCH_LEAGUES = [
  39,  // 프리미어 리그
  140, // 라리가
  78,  // 분데스리가
  135, // 세리에 A
  61,  // 리그앙
  2,   // 챔피언스 리그
  3,   // 유로파 리그
  848, // 컨퍼런스 리그
  531, // UEFA 슈퍼컵
  45,  // FA컵
  292, // K리그1
];

/**
 * MultiDayMatchesResult → 위젯용 League[] 변환
 * bigMatch 리그만 필터링 + 어제/오늘/내일 경기를 리그별로 그룹화
 */
export function transformToWidgetLeagues(result: MultiDayMatchesResult): WidgetLeague[] {
  if (!result.success || !result.data) return [];

  const filterMatches = (matches: FootballMatchData[]) =>
    matches.filter(m => BIG_MATCH_LEAGUES.includes(m.league?.id || 0));

  const yesterdayMatches = filterMatches(result.data.yesterday?.matches || []);
  const todayMatches = filterMatches(result.data.today?.matches || []);
  const tomorrowMatches = filterMatches(result.data.tomorrow?.matches || []);

  return groupMatchesByLeague(yesterdayMatches, todayMatches, tomorrowMatches);
}

interface LiveScoreWidgetV2ServerProps {
  /** page.tsx에서 transformToWidgetLeagues()로 변환한 데이터 */
  initialData?: WidgetLeague[];
}

/**
 * 라이브스코어 위젯 V2 서버 컴포넌트
 *
 * 구조:
 * - 서버: 리그/경기 목록 HTML 렌더링 (LCP 최적화)
 * - 클라이언트: 펼침/접기 토글만 담당
 *
 * 렌더링 흐름:
 * 1. 서버에서 leagues 데이터로 전체 HTML 생성
 * 2. LeagueToggleClient가 각 리그 섹션을 감싸서 토글 기능 제공
 * 3. 클라이언트는 서버 HTML을 그대로 show/hide만 처리
 */
export default async function LiveScoreWidgetV2Server({ initialData }: LiveScoreWidgetV2ServerProps = {}) {
  const leagues = initialData ?? [];

  // 경기가 없을 때 - 빈 상태 UI 표시
  if (leagues.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <WidgetHeader />
        <div className="py-4 px-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            최근 빅매치가 없습니다
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            프리미어리그 · 라리가 · 분데스리가 · 세리에A · 리그앙 · 챔피언스리그 · 유로파리그 · K리그1
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
            {/* 첫 번째 리그일 때만 위젯 헤더 표시 (서버 렌더링) */}
            {isFirst && <WidgetHeader />}

            {/* 리그 섹션: 클라이언트 토글 + 서버 렌더링 콘텐츠 */}
            <LeagueToggleClient
              defaultExpanded={isFirst}
              matchCount={league.matches.length}
              header={<LeagueHeader league={league} />}
            >
              {/* 경기 목록 - 서버에서 렌더링 */}
              {league.matches.map((match, idx) => (
                <MatchCardServer
                  key={match.id}
                  match={match}
                  isLast={idx === league.matches.length - 1}
                  priorityImages={isFirst}
                />
              ))}
            </LeagueToggleClient>
          </Container>
        );
      })}
    </div>
  );
}
