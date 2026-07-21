'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Container, ContainerContent, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { getMatchHrefByTeams } from '@/domains/livescore/utils/entityLinks';
import type { CupFixture, CupRound } from '@/domains/livescore/actions/match/cupFixtures';

const TEAM_PLACEHOLDER = '/images/placeholder-team-shield.svg';

const KNOCKOUT_ROUNDS = [
  { key: 'Round of 32', label: '32강' },
  { key: 'Round of 16', label: '16강' },
  { key: 'Quarter-finals', label: '8강' },
  { key: 'Semi-finals', label: '4강' },
  { key: 'Final', label: '결승' },
] as const;

type BracketCardData = {
  id: string;
  fixture?: CupFixture;
  homeLabel: string;
  awayLabel: string;
  dateLabel: string;
};

type BracketSplit = {
  left: BracketCardData[];
  right: BracketCardData[];
};

const FALLBACK_BRACKET: Record<string, BracketCardData[]> = {
  'Round of 32': [
    { id: 'r32-1', homeLabel: '1E', awayLabel: '3AB', dateLabel: '6월 30일' },
    { id: 'r32-2', homeLabel: '1I', awayLabel: '3CD', dateLabel: '7월 1일' },
    { id: 'r32-3', homeLabel: '2A', awayLabel: '2B', dateLabel: '6월 29일' },
    { id: 'r32-4', homeLabel: '1F', awayLabel: '2C', dateLabel: '6월 30일' },
    { id: 'r32-5', homeLabel: '2K', awayLabel: '2L', dateLabel: '7월 3일' },
    { id: 'r32-6', homeLabel: '1H', awayLabel: '2J', dateLabel: '7월 3일' },
    { id: 'r32-7', homeLabel: '1D', awayLabel: '3BE', dateLabel: '7월 2일' },
    { id: 'r32-8', homeLabel: '1G', awayLabel: '3AE', dateLabel: '7월 2일' },
    { id: 'r32-9', homeLabel: '1C', awayLabel: '2F', dateLabel: '6월 30일' },
    { id: 'r32-10', homeLabel: '2E', awayLabel: '2I', dateLabel: '7월 1일' },
    { id: 'r32-11', homeLabel: '1A', awayLabel: '3CE', dateLabel: '7월 1일' },
    { id: 'r32-12', homeLabel: '1L', awayLabel: '3EH', dateLabel: '7월 1일' },
    { id: 'r32-13', homeLabel: '1J', awayLabel: '2H', dateLabel: '7월 4일' },
    { id: 'r32-14', homeLabel: '2D', awayLabel: '2G', dateLabel: '7월 2일' },
    { id: 'r32-15', homeLabel: '1B', awayLabel: '3EF', dateLabel: '7월 3일' },
    { id: 'r32-16', homeLabel: '1K', awayLabel: '3DE', dateLabel: '7월 4일' },
  ],
  'Round of 16': [
    { id: 'r16-1', homeLabel: '1EA', awayLabel: '1IC', dateLabel: '7월 5일' },
    { id: 'r16-2', homeLabel: '2AB', awayLabel: '1FC', dateLabel: '7월 5일' },
    { id: 'r16-3', homeLabel: '2KL', awayLabel: '1HJ', dateLabel: '7월 7일' },
    { id: 'r16-4', homeLabel: '1DB', awayLabel: '1GA', dateLabel: '7월 7일' },
    { id: 'r16-5', homeLabel: '1CF', awayLabel: '2EI', dateLabel: '7월 6일' },
    { id: 'r16-6', homeLabel: '1AC', awayLabel: '1LE', dateLabel: '7월 6일' },
    { id: 'r16-7', homeLabel: '1JH', awayLabel: '2DG', dateLabel: '7월 7일' },
    { id: 'r16-8', homeLabel: '1BE', awayLabel: '1KD', dateLabel: '7월 8일' },
  ],
  'Quarter-finals': [
    { id: 'qf-1', homeLabel: 'EF1', awayLabel: 'EF2', dateLabel: '7월 10일' },
    { id: 'qf-2', homeLabel: 'EF5', awayLabel: 'EF6', dateLabel: '7월 11일' },
    { id: 'qf-3', homeLabel: 'EF3', awayLabel: 'EF4', dateLabel: '7월 12일' },
    { id: 'qf-4', homeLabel: 'EF7', awayLabel: 'EF8', dateLabel: '7월 12일' },
  ],
  'Semi-finals': [
    { id: 'sf-1', homeLabel: 'WQ1', awayLabel: 'WQ2', dateLabel: '7월 15일' },
    { id: 'sf-2', homeLabel: 'WQ3', awayLabel: 'WQ4', dateLabel: '7월 16일' },
  ],
  'Final': [{ id: 'final-1', homeLabel: 'WS1', awayLabel: 'WS2', dateLabel: '7월 20일' }],
  '3rd Place Final': [{ id: 'third-1', homeLabel: 'LS1', awayLabel: 'LS2', dateLabel: '7월 19일' }],
};

function teamDisplayName(team: CupFixture['home']) {
  return team.name_ko || team.name || '미정';
}

function getTeamCode(team: CupFixture['home'] | undefined) {
  if (!team) return '';
  const c = team.code || team.name_ko?.substring(0, 3) || team.name?.substring(0, 3) || '';
  return c.toUpperCase();
}

function TeamLogoMark({ logo, name }: { logo: string; name: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center">
      <UnifiedSportsImageClient
        src={logo || TEAM_PLACEHOLDER}
        alt={`${name} 로고`}
        width={24}
        height={24}
        className="h-[18px] w-[18px] flex-shrink-0 object-contain opacity-75"
      />
    </div>
  );
}

function normalizeDateLabel(label: string): string {
  const match = label.match(/(\d+)\D+(\d+)/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return label;
}

function matchSeed(seed: string, label: string) {
  if (seed === label) return true;
  if (seed.startsWith('3') && label.startsWith('3')) {
    const groupLetter = seed.charAt(1);
    const allowedGroups = label.substring(1);
    return allowedGroups.includes(groupLetter);
  }
  return false;
}

function getMergedRoundItems(
  roundKey: string,
  actualItems: BracketCardData[],
  standings: any
): BracketCardData[] {
  const fallbackItems = FALLBACK_BRACKET[roundKey];
  if (!fallbackItems) return [];
  if (actualItems.length === 0) return fallbackItems;

  const teamSeedMap = new Map<number, string>();
  if (standings?.league?.standings) {
    const groups = standings.league.standings;
    for (const group of groups) {
      const firstItem = group[0];
      if (!firstItem || !firstItem.group) continue;
      const groupName = firstItem.group;
      if (groupName.startsWith('Group ')) {
        const groupLetter = groupName.replace('Group ', '').trim();
        for (const item of group) {
          if (item.team?.id) {
            teamSeedMap.set(item.team.id, `${item.rank}${groupLetter}`);
          }
        }
      }
    }
  }

  const merged = [...fallbackItems];
  const matchedActualIds = new Set<string>();

  for (const actual of actualItems) {
    const fixture = actual.fixture;
    if (!fixture) continue;

    const homeId = fixture.home.id;
    const awayId = fixture.away.id;

    const homeSeed = teamSeedMap.get(homeId);
    const awaySeed = teamSeedMap.get(awayId);

    if (homeSeed && awaySeed) {
      const slotIndex = merged.findIndex((slot) => {
        if (slot.fixture) return false;
        return (
          (matchSeed(homeSeed, slot.homeLabel) && matchSeed(awaySeed, slot.awayLabel)) ||
          (matchSeed(awaySeed, slot.homeLabel) && matchSeed(homeSeed, slot.awayLabel))
        );
      });

      if (slotIndex !== -1) {
        merged[slotIndex] = actual;
        matchedActualIds.add(actual.id);
      }
    }
  }

  for (const actual of actualItems) {
    if (matchedActualIds.has(actual.id)) continue;

    const actualDateLabel = actual.dateLabel;
    const normalizedActualDate = normalizeDateLabel(actualDateLabel);

    let slotIndex = merged.findIndex((slot) => {
      if (slot.fixture) return false;
      return normalizeDateLabel(slot.dateLabel) === normalizedActualDate;
    });

    if (slotIndex === -1) {
      slotIndex = merged.findIndex((slot) => !slot.fixture);
    }

    if (slotIndex !== -1) {
      merged[slotIndex] = actual;
      matchedActualIds.add(actual.id);
    }
  }

  return merged;
}

function formatKstDate(iso: string | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

function getChampionTeam(finalItem: BracketCardData | undefined) {
  const fixture = finalItem?.fixture;
  if (!fixture) return null;

  if (fixture.home.winner === true) return fixture.home;
  if (fixture.away.winner === true) return fixture.away;

  const finishedStatuses = ['FT', 'AET', 'PEN', 'POST', 'WO'];
  const isFinished = finishedStatuses.includes(fixture.status?.short);
  if (isFinished && fixture.home.score !== null && fixture.away.score !== null) {
    if (fixture.home.score > fixture.away.score) return fixture.home;
    if (fixture.away.score > fixture.home.score) return fixture.away;
  }

  return null;
}

function getMatchStatusText(fixture: CupFixture) {
  if (fixture.home.score !== null && fixture.away.score !== null) {
    return `${fixture.home.score} - ${fixture.away.score}`;
  }

  const kickoffDate = new Date(fixture.date);
  const now = new Date();

  const toKstDateString = (d: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
  };

  const kickoffStr = toKstDateString(kickoffDate);
  const todayStr = toKstDateString(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toKstDateString(tomorrow);

  if (kickoffStr === todayStr) {
    return '오늘';
  } else if (kickoffStr === tomorrowStr) {
    return '내일';
  } else {
    const month = kickoffDate.getMonth() + 1;
    const day = kickoffDate.getDate();
    return `${month}월 ${day}일`;
  }
}

function fixtureToBracketCard(fixture: CupFixture): BracketCardData {
  return {
    id: String(fixture.id),
    fixture,
    homeLabel: teamDisplayName(fixture.home),
    awayLabel: teamDisplayName(fixture.away),
    dateLabel: formatKstDate(fixture.date),
  };
}

function TeamInline({ team, align = 'left' }: { team: CupFixture['home']; align?: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
      {align === 'left' && (
        <UnifiedSportsImageClient
          src={team.logo || TEAM_PLACEHOLDER}
          alt={`${team.name} 로고`}
          width={14}
          height={14}
          className="h-2.5 w-2.5 flex-shrink-0 object-contain opacity-75 lg:h-3.5 lg:w-3.5"
        />
      )}
      <span className="truncate text-[9px] font-semibold leading-tight text-gray-900 dark:text-[#F0F0F0] lg:text-[11px]">
        {teamDisplayName(team)}
      </span>
      {align === 'right' && (
        <UnifiedSportsImageClient
          src={team.logo || TEAM_PLACEHOLDER}
          alt={`${team.name} 로고`}
          width={14}
          height={14}
          className="h-2.5 w-2.5 flex-shrink-0 object-contain opacity-75 lg:h-3.5 lg:w-3.5"
        />
      )}
    </div>
  );
}

function PlaceholderMark({ align = 'left' }: { align?: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 items-center justify-center ${align === 'right' ? 'justify-center' : ''}`}>
      <UnifiedSportsImageClient
        src={TEAM_PLACEHOLDER}
        alt="미정 팀 로고"
        width={24}
        height={24}
        className="h-[18px] w-[18px] flex-shrink-0 object-contain opacity-75"
      />
    </div>
  );
}

function MatchCard({ item, isFinal = false }: { item?: BracketCardData; isFinal?: boolean }) {
  const fixture = item?.fixture;
  const content = (
    <div className="min-w-0">
      {item?.dateLabel && (
        <div className="mb-0.5 text-center text-[7.5px] font-medium leading-none text-gray-400 dark:text-gray-500 lg:text-[8.5px]">
          {item.dateLabel}
        </div>
      )}
      {!fixture ? (
        <div className="grid min-w-0 grid-cols-[max-content_4px_max-content] items-start justify-center gap-0">
          <div className="flex min-w-[19px] flex-col items-center gap-0.5">
            <PlaceholderMark />
            <span className="whitespace-nowrap text-center text-[7.5px] font-semibold leading-none text-gray-700 dark:text-gray-300 lg:text-[8.5px]">
              {item?.homeLabel || '미정'}
            </span>
          </div>
          <span aria-hidden />
          <div className="flex min-w-[19px] flex-col items-center gap-0.5">
            <PlaceholderMark />
            <span className="whitespace-nowrap text-center text-[7.5px] font-semibold leading-none text-gray-700 dark:text-gray-300 lg:text-[8.5px]">
              {item?.awayLabel || '미정'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="grid min-w-0 grid-cols-[max-content_4px_max-content] items-start justify-center gap-0">
            <div className="flex min-w-[19px] flex-col items-center gap-0.5">
              <TeamLogoMark logo={fixture.home.logo} name={fixture.home.name} />
              <span className="whitespace-nowrap text-center text-[7.5px] font-semibold leading-none text-gray-900 dark:text-[#F0F0F0] lg:text-[8.5px]">
                {getTeamCode(fixture.home)}
              </span>
            </div>
            <span aria-hidden />
            <div className="flex min-w-[19px] flex-col items-center gap-0.5">
              <TeamLogoMark logo={fixture.away.logo} name={fixture.away.name} />
              <span className="whitespace-nowrap text-center text-[7.5px] font-semibold leading-none text-gray-900 dark:text-[#F0F0F0] lg:text-[8.5px]">
                {getTeamCode(fixture.away)}
              </span>
            </div>
          </div>
          <div className="mt-1 text-center text-[7.5px] font-bold text-gray-500 dark:text-gray-400 leading-none lg:text-[8.5px]">
            {getMatchStatusText(fixture)}
          </div>
        </div>
      )}
    </div>
  );
  const className = `relative block w-full rounded-md border bg-white px-0.5 py-1 shadow-sm transition-colors dark:bg-[#1D1D1D] lg:px-1 lg:py-1.5 ${
    isFinal
      ? 'border-[#002FA7]/35 bg-blue-50/70 dark:border-blue-500/40 dark:bg-blue-950/20'
      : 'border-gray-200/90 dark:border-gray-800'
  } ${fixture ? 'hover:bg-[#F6F7F9] dark:hover:bg-[#262626]' : 'cursor-default'}`;

  if (!fixture) {
    return <div className={className} data-bracket-card>{content}</div>;
  }

  return (
    <Link href={getMatchHrefByTeams(fixture.id, fixture.home, fixture.away)} prefetch={false} className={className} data-bracket-card>
      {content}
    </Link>
  );
}

function MobileBracketCard({ item, isFinal = false }: { item?: BracketCardData; isFinal?: boolean }) {
  const fixture = item?.fixture;
  const className = `block rounded-md border bg-white px-1 py-1 shadow-sm transition-colors dark:bg-[#1D1D1D] ${
    isFinal
      ? 'border-[#002FA7]/35 bg-blue-50/70 dark:border-blue-500/40 dark:bg-blue-950/20'
      : 'border-gray-200/90 dark:border-gray-800'
  } ${fixture ? 'hover:bg-[#F6F7F9] dark:hover:bg-[#262626]' : 'cursor-default'}`;
  const content = (
    <div className="min-w-0">
      {item?.dateLabel && (
        <div className="mb-0.5 text-center text-[8px] font-medium leading-none text-gray-400 dark:text-gray-500">
          {item.dateLabel}
        </div>
      )}
      {!fixture ? (
        <div className="grid min-w-0 grid-cols-[max-content_5px_max-content] items-start justify-center gap-0">
          <div className="flex min-w-[18px] flex-col items-center gap-0.5">
            <PlaceholderMark />
            <span className="whitespace-nowrap text-center text-[8px] font-semibold leading-none text-gray-700 dark:text-gray-300">
              {item?.homeLabel || '미정'}
            </span>
          </div>
          <span aria-hidden />
          <div className="flex min-w-[18px] flex-col items-center gap-0.5">
            <PlaceholderMark />
            <span className="whitespace-nowrap text-center text-[8px] font-semibold leading-none text-gray-700 dark:text-gray-300">
              {item?.awayLabel || '미정'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="grid min-w-0 grid-cols-[max-content_5px_max-content] items-start justify-center gap-0">
            <div className="flex min-w-[18px] flex-col items-center gap-0.5">
              <TeamLogoMark logo={fixture.home.logo} name={fixture.home.name} />
              <span className="whitespace-nowrap text-center text-[8px] font-semibold leading-none text-gray-900 dark:text-[#F0F0F0]">
                {getTeamCode(fixture.home)}
              </span>
            </div>
            <span aria-hidden />
            <div className="flex min-w-[18px] flex-col items-center gap-0.5">
              <TeamLogoMark logo={fixture.away.logo} name={fixture.away.name} />
              <span className="whitespace-nowrap text-center text-[8px] font-semibold leading-none text-gray-900 dark:text-[#F0F0F0]">
                {getTeamCode(fixture.away)}
              </span>
            </div>
          </div>
          <div className="mt-1 text-center text-[8px] font-bold text-gray-500 dark:text-gray-400 leading-none">
            {getMatchStatusText(fixture)}
          </div>
        </div>
      )}
    </div>
  );

  if (!fixture) {
    return <div className={className} data-bracket-card>{content}</div>;
  }

  return (
    <Link href={getMatchHrefByTeams(fixture.id, fixture.home, fixture.away)} prefetch={false} className={className} data-bracket-card>
      {content}
    </Link>
  );
}

const MOBILE_X = {
  left16: 17,
  left8: 30,
  left4: 50,
  center: 50,
  third: 14,
  champion: 86,
  right4: 50,
  right8: 70,
  right16: 83,
};

const MOBILE_Y = {
  top32: 58,
  top32Second: 138,
  top16: 230,
  top8: 316,
  top4: 402,
  final: 486,
  third: 486,
  bottom4: 588,
  bottom8: 674,
  bottom16: 760,
  bottom32: 852,
  bottom32Second: 932,
};

const MOBILE_EDGES: DesktopEdge[] = [
  { sources: ['mt16-0', 'mt16-1'], target: 'mt8-0', side: 'left' },
  { sources: ['mt16-2', 'mt16-3'], target: 'mt8-1', side: 'right' },
  { sources: ['mt8-0', 'mt8-1'], target: 'mt4-0', side: 'left' },
  { sources: ['mt4-0'], target: 'mfinal', side: 'left' },
  { sources: ['mb4-0'], target: 'mfinal', side: 'right' },
  { sources: ['mb16-0', 'mb16-1'], target: 'mb8-0', side: 'left' },
  { sources: ['mb16-2', 'mb16-3'], target: 'mb8-1', side: 'right' },
  { sources: ['mb8-0', 'mb8-1'], target: 'mb4-0', side: 'left' },
];

const MOBILE_PAIR_EDGES = [
  { sources: ['mt32-0', 'mt32-1'], target: 'mt16-0' },
  { sources: ['mt32-2', 'mt32-3'], target: 'mt16-1' },
  { sources: ['mt32-4', 'mt32-5'], target: 'mt16-2' },
  { sources: ['mt32-6', 'mt32-7'], target: 'mt16-3' },
  { sources: ['mb32-0', 'mb32-1'], target: 'mb16-0' },
  { sources: ['mb32-2', 'mb32-3'], target: 'mb16-1' },
  { sources: ['mb32-4', 'mb32-5'], target: 'mb16-2' },
  { sources: ['mb32-6', 'mb32-7'], target: 'mb16-3' },
] as const;

const MOBILE_32_LAYOUT = [0, 2, 4, 6, 1, 3, 5, 7];

function MobileVerticalBracket({
  roundOf32,
  roundOf16,
  quarterFinals,
  semiFinals,
  finalItem,
  thirdPlaceItems,
  isSidebar = false,
}: {
  roundOf32: BracketSplit;
  roundOf16: BracketSplit;
  quarterFinals: BracketSplit;
  semiFinals: BracketSplit;
  finalItem: BracketCardData;
  thirdPlaceItems: BracketCardData[];
  isSidebar?: boolean;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<DesktopPath[]>([]);
  const [labelCoords, setLabelCoords] = useState<Record<string, number>>({});
  const thirdPlaceItem = thirdPlaceItems[0];
  const limitTo16 = true;
  const championTeam = getChampionTeam(finalItem);

  const yMap = limitTo16 ? {
    top16: 70,
    top8: 155,
    top4: 240,
    final: 325,
    third: 325,
    bottom4: 410,
    bottom8: 495,
    bottom16: 580,
  } : {
    top16: MOBILE_Y.top16,
    top8: MOBILE_Y.top8,
    top4: MOBILE_Y.top4,
    final: MOBILE_Y.final,
    third: MOBILE_Y.third,
    bottom4: MOBILE_Y.bottom4,
    bottom8: MOBILE_Y.bottom8,
    bottom16: MOBILE_Y.bottom16,
  };

  const nodes: DesktopNode[] = [
    ...(!limitTo16 ? MOBILE_32_LAYOUT.map((itemIndex, layoutIndex) => ({
      id: `mt32-${itemIndex}`,
      item: roundOf32.left[itemIndex],
      x: 14 + (layoutIndex % 4) * 24,
      y: layoutIndex < 4 ? MOBILE_Y.top32 : MOBILE_Y.top32Second,
    })) : []),
    ...roundOf16.left.map((item, index) => ({ id: `mt16-${index}`, item, x: 14 + index * 24, y: yMap.top16 })),
    ...quarterFinals.left.map((item, index) => ({ id: `mt8-${index}`, item, x: index === 0 ? MOBILE_X.left8 : MOBILE_X.right8, y: yMap.top8 })),
    ...semiFinals.left.map((item, index) => ({ id: `mt4-${index}`, item, x: MOBILE_X.left4, y: yMap.top4 })),
    { id: 'mfinal', item: finalItem, x: MOBILE_X.center, y: yMap.final, isFinal: true },
    ...(thirdPlaceItem ? [{ id: 'mthird', item: thirdPlaceItem, x: MOBILE_X.third, y: yMap.third }] : []),
    ...semiFinals.right.map((item, index) => ({ id: `mb4-${index}`, item, x: MOBILE_X.right4, y: yMap.bottom4 })),
    ...quarterFinals.right.map((item, index) => ({ id: `mb8-${index}`, item, x: index === 0 ? MOBILE_X.left8 : MOBILE_X.right8, y: yMap.bottom8 })),
    ...roundOf16.right.map((item, index) => ({ id: `mb16-${index}`, item, x: 14 + index * 24, y: yMap.bottom16 })),
    ...(!limitTo16 ? MOBILE_32_LAYOUT.map((itemIndex, layoutIndex) => ({
      id: `mb32-${itemIndex}`,
      item: roundOf32.right[itemIndex],
      x: 14 + (layoutIndex % 4) * 24,
      y: layoutIndex < 4 ? MOBILE_Y.bottom32 : MOBILE_Y.bottom32Second,
    })) : []),
  ];

  const updatePaths = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const boundsById = new Map<string, CardBounds>();

    board.querySelectorAll<HTMLElement>('[data-bracket-node]').forEach((node) => {
      const nodeId = node.dataset.bracketNode;
      const card = node.querySelector<HTMLElement>('[data-bracket-card]');
      if (!nodeId || !card) return;

      const rect = card.getBoundingClientRect();
      boundsById.set(nodeId, {
        left: rect.left - boardRect.left,
        right: rect.right - boardRect.left,
        top: rect.top - boardRect.top,
        bottom: rect.bottom - boardRect.top,
        centerX: rect.left - boardRect.left + rect.width / 2,
        centerY: rect.top - boardRect.top + rect.height / 2,
      });
    });

    const roundPaths = MOBILE_EDGES.flatMap((edge, index) => {
        const sources = edge.sources.map((sourceId) => boundsById.get(sourceId));
        const target = boundsById.get(edge.target);

        if (!target || sources.some((source) => !source)) return [];

        return [{
          id: `mobile-${edge.side}-${index}`,
          d: verticalPathFromMeasuredCards(sources as CardBounds[], [target], edge.targetAnchor),
        }];
      });

    const pairPaths = limitTo16 ? [] : MOBILE_PAIR_EDGES.flatMap((edge, index) => {
      const sources = edge.sources.map((sourceId) => boundsById.get(sourceId));
      const target = boundsById.get(edge.target);
      if (!target || sources.some((source) => !source)) return [];

      return [{
        id: `mobile-pair-${index}`,
        d: verticalPairPathFromMeasuredCards(sources as CardBounds[], target),
      }];
    });

    const coords: Record<string, number> = {};
    const getMidpointY = (sourceId: string, targetId: string) => {
      const source = boundsById.get(sourceId);
      const target = boundsById.get(targetId);
      if (!source || !target) return null;
      const isDownward = source.centerY < target.centerY;
      const sourceY = isDownward ? source.bottom : source.top;
      const targetY = isDownward ? target.top : target.bottom;
      return sourceY + (targetY - sourceY) / 2;
    };

    const top8Val = getMidpointY('mt16-0', 'mt8-0');
    if (top8Val !== null) coords['top-8'] = top8Val;

    const top4Val = getMidpointY('mt8-0', 'mt4-0');
    if (top4Val !== null) coords['top-4'] = top4Val;

    const finalVal = getMidpointY('mt4-0', 'mfinal');
    if (finalVal !== null) {
      coords['final'] = finalVal;
      coords['third-label'] = finalVal;
    }

    const bottom4Val = getMidpointY('mfinal', 'mb4-0');
    if (bottom4Val !== null) coords['bottom-final'] = bottom4Val;

    const bottom8Val = getMidpointY('mb4-0', 'mb8-0');
    if (bottom8Val !== null) coords['bottom-4'] = bottom8Val;

    const bottom16Val = getMidpointY('mb8-0', 'mb16-0');
    if (bottom16Val !== null) coords['bottom-8'] = bottom16Val;

    setLabelCoords(coords);
    setPaths([...roundPaths, ...pairPaths]);
  }, [roundOf32, roundOf16, quarterFinals, semiFinals, finalItem, thirdPlaceItems, limitTo16]);

  useLayoutEffect(() => {
    updatePaths();

    const timer = setTimeout(updatePaths, 150);

    const board = boardRef.current;
    if (!board) return () => clearTimeout(timer);

    const resizeObserver = new ResizeObserver(updatePaths);
    resizeObserver.observe(board);
    window.addEventListener('resize', updatePaths);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePaths);
    };
  }, [updatePaths]);

  const labels = limitTo16 ? [
    { id: 'top-16', x: 50, y: labelCoords['top-16'] ?? 20, text: '16강' },
    { id: 'top-8', x: 50, y: yMap.top8, text: '8강' },
    { id: 'top-4', x: 50, y: yMap.top4, text: '4강', isSide: true },
    { id: 'final', x: 50, y: yMap.final, text: '결승', isSide: true },
    { id: 'third-label', x: MOBILE_X.third, y: labelCoords['third-label'] ?? 282, text: '3/4위전' },
    { id: 'bottom-4', x: 50, y: yMap.bottom4, text: '4강', isSide: true },
    { id: 'bottom-8', x: 50, y: yMap.bottom8, text: '8강' },
    { id: 'bottom-16', x: 50, y: 638, text: '16강' },
  ] : [
    { id: 'top-32', x: 50, y: 16, text: '32강' },
    { id: 'top-16', x: 50, y: 184, text: '16강' },
    { id: 'top-8', x: 50, y: yMap.top8, text: '8강' },
    { id: 'top-4', x: 50, y: yMap.top4, text: '4강', isSide: true },
    { id: 'final', x: 50, y: yMap.final, text: '결승', isSide: true },
    { id: 'third-label', x: MOBILE_X.third, y: 444, text: '3/4위전' },
    { id: 'bottom-4', x: 50, y: yMap.bottom4, text: '4강', isSide: true },
    { id: 'bottom-8', x: 50, y: yMap.bottom8, text: '8강' },
    { id: 'bottom-16', x: 50, y: 806, text: '16강' },
    { id: 'bottom-32', x: 50, y: 990, text: '32강' },
  ];

  return (
    <div className={isSidebar ? "p-1 w-full" : "p-1 lg:hidden pb-8"}>
      <div ref={boardRef} className={`relative ${limitTo16 ? 'h-[655px]' : 'h-[1005px]'} p-1`}>
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible text-gray-400 dark:text-gray-600"
        >
          {paths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {labels.map((label) => {
          const isSide = 'isSide' in label && label.isSide;
          const leftValue = isSide
            ? (label.id === 'final' ? 'calc(50% + 42px)' : 'calc(50% + 38px)')
            : `${label.x}%`;
          const topValue = isSide ? `${label.y}px` : `${label.y - 9}px`;
          const transformValue = isSide ? 'translateY(-50%)' : 'translateX(-50%)';

          const isFinal = label.text === '결승';
          const badgeClass = isFinal
            ? "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400"
            : "border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-[#1D1D1D] dark:text-gray-300";

          return (
            <div
              key={label.id}
              className={`absolute z-20 flex items-center justify-center h-[18px] px-2 whitespace-nowrap rounded-full border text-[9.5px] font-bold leading-none shadow-sm ${badgeClass}`}
              style={{
                left: leftValue,
                top: topValue,
                transform: transformValue,
                WebkitTransform: transformValue,
              }}
            >
              {label.text}
            </div>
          );
        })}
        <div
          className="absolute z-20 w-[72px]"
          style={{
            left: `${MOBILE_X.champion}%`,
            top: limitTo16 ? `${yMap.final}px` : `${MOBILE_Y.final}px`,
            transform: 'translate(-50%, -50%)',
            WebkitTransform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex flex-col items-center px-1.5 py-1 text-center">
            <Trophy
              className={`mx-auto h-6 w-6 ${
                championTeam ? 'text-amber-400 dark:text-amber-300 drop-shadow-sm' : 'text-gray-300 dark:text-gray-700'
              }`}
              aria-hidden
            />
            {championTeam ? (
              <div className="mt-0.5 flex flex-col items-center gap-0.5">
                <TeamLogoMark logo={championTeam.logo} name={championTeam.name} />
                <span className="whitespace-nowrap text-center text-[9px] font-bold leading-none text-gray-900 dark:text-[#F0F0F0]">
                  {teamDisplayName(championTeam)}
                </span>
              </div>
            ) : (
              <span className="mt-1 block text-[11px] font-semibold leading-none text-gray-500 dark:text-gray-400">
                챔피언
              </span>
            )}
          </div>
        </div>
        {nodes.map((node) => (
          <div
            key={node.id}
            data-bracket-node={node.id}
            className={`absolute z-20 ${node.id === 'mfinal' || node.id === 'mthird' ? 'w-[72px]' : 'w-[64px]'}`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              WebkitTransform: 'translate(-50%, -50%)',
            }}
          >
            {node.label && (
              <div
                className={
                  node.id === 'mt4-0'
                    ? 'absolute bottom-full left-1/2 mb-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-gray-500 dark:text-gray-400'
                    : node.id === 'mfinal'
                    ? 'absolute bottom-full left-[55%] mb-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-gray-500 dark:text-gray-400'
                    : node.id === 'mb4-0'
                    ? 'absolute right-full top-1/2 mr-1 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-gray-500 dark:text-gray-400'
                    : 'mb-1 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400'
                }
              >
                {node.label}
              </div>
            )}
            <MobileBracketCard item={node.item} isFinal={node.isFinal} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface WorldCupBracketViewProps {
  rounds: CupRound[];
  standings?: any;
  forceVertical?: boolean;
}

function splitBracketSide(items: BracketCardData[]) {
  const middle = Math.ceil(items.length / 2);
  return {
    left: items.slice(0, middle),
    right: items.slice(middle),
  };
}

type DesktopNode = {
  id: string;
  item: BracketCardData;
  x: number;
  y: number;
  label?: string;
  isFinal?: boolean;
};

const DESKTOP_X = {
  left32: 38,
  left16: 178,
  left8: 306,
  left4: 428,
  center: 500,
  right4: 572,
  right8: 694,
  right16: 822,
  right32: 962,
};

const DESKTOP_Y = {
  r32: [64, 144, 224, 304, 384, 464, 544, 624],
  r16: [104, 264, 424, 584],
  qf: [184, 504],
  sf: [344],
  final: 234,
  third: 454,
};

const DESKTOP_EDGES: DesktopEdge[] = [
  { sources: ['l32-0', 'l32-1'], target: 'l16-0', side: 'left' },
  { sources: ['l32-2', 'l32-3'], target: 'l16-1', side: 'left' },
  { sources: ['l32-4', 'l32-5'], target: 'l16-2', side: 'left' },
  { sources: ['l32-6', 'l32-7'], target: 'l16-3', side: 'left' },
  { sources: ['l16-0', 'l16-1'], target: 'l8-0', side: 'left' },
  { sources: ['l16-2', 'l16-3'], target: 'l8-1', side: 'left' },
  { sources: ['l8-0', 'l8-1'], target: 'l4-0', side: 'left' },
  { sources: ['r32-0', 'r32-1'], target: 'r16-0', side: 'right' },
  { sources: ['r32-2', 'r32-3'], target: 'r16-1', side: 'right' },
  { sources: ['r32-4', 'r32-5'], target: 'r16-2', side: 'right' },
  { sources: ['r32-6', 'r32-7'], target: 'r16-3', side: 'right' },
  { sources: ['r16-0', 'r16-1'], target: 'r8-0', side: 'right' },
  { sources: ['r16-2', 'r16-3'], target: 'r8-1', side: 'right' },
  { sources: ['r8-0', 'r8-1'], target: 'r4-0', side: 'right' },
  { sources: ['l4-0', 'r4-0'], target: 'final', side: 'left', targetAnchor: 'merged-final' },
];

type DesktopEdge = {
  sources: string[];
  target: string;
  side: 'left' | 'right';
  targetAnchor?: 'center' | 'upper' | 'merged-final' | 'mobile-direct';
};

type DesktopPath = {
  id: string;
  d: string;
};

type CardBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

function verticalPathFromMeasuredCards(sources: CardBounds[], target: CardBounds[], targetAnchor: DesktopEdge['targetAnchor'] = 'center') {
  const targetBounds = target[0];
  if (!targetBounds) return '';

  if (targetAnchor === 'mobile-direct') {
    return sources.map((source) => {
      const isDownward = source.centerY < targetBounds.centerY;
      const sourceY = isDownward ? source.bottom : source.top;
      const targetY = isDownward ? targetBounds.top : targetBounds.bottom;
      const midY = sourceY + (targetY - sourceY) / 2;
      return `M ${source.centerX} ${sourceY} V ${midY} H ${targetBounds.centerX} V ${targetY}`;
    }).join(' ');
  }

  if (sources.length === 1) {
    const source = sources[0];
    const isDownward = source.centerY < targetBounds.centerY;
    const sourceY = isDownward ? source.bottom : source.top;
    const targetY = isDownward ? targetBounds.top : targetBounds.bottom;
    const midY = sourceY + (targetY - sourceY) / 2;
    return `M ${source.centerX} ${sourceY} V ${midY} H ${targetBounds.centerX} V ${targetY}`;
  }

  const isDownward = sources[0].centerY < targetBounds.centerY;
  const sourceY1 = isDownward ? sources[0].bottom : sources[0].top;
  const sourceY2 = isDownward ? sources[1].bottom : sources[1].top;
  const targetY = isDownward ? targetBounds.top : targetBounds.bottom;
  const y = sourceY1 + (targetY - sourceY1) / 2;
  const x1 = sources[0].centerX;
  const x2 = sources[1].centerX;
  const targetX = targetBounds.centerX;

  return [
    `M ${x1} ${sourceY1} V ${y}`,
    `M ${x2} ${sourceY2} V ${y}`,
    `M ${x1} ${y} H ${x2}`,
    `M ${targetX} ${y} V ${targetY}`,
  ].join(' ');
}

function verticalPairPathFromMeasuredCards(sources: CardBounds[], target: CardBounds) {
  if (sources.length < 2) return '';

  const top = sources[0].centerY <= sources[1].centerY ? sources[0] : sources[1];
  const bottom = sources[0].centerY <= sources[1].centerY ? sources[1] : sources[0];
  const x = Math.max(top.right, bottom.right) + 8;
  const topY = top.centerY;
  const bottomY = bottom.centerY;
  const middleY = topY + (bottomY - topY) / 2;
  const isTopHalf = target.centerY > middleY;
  const tailY = isTopHalf ? bottom.bottom + 12 : top.top - 12;
  const targetY = isTopHalf ? target.top : target.bottom;
  const tailX = x + 8;

  return [
    `M ${top.right} ${topY} H ${x} V ${bottomY} H ${bottom.right}`,
    `M ${x} ${middleY} H ${tailX} V ${tailY} H ${target.centerX} V ${targetY}`,
  ].join(' ');
}

function pathFromMeasuredCards(sources: CardBounds[], target: CardBounds, side: 'left' | 'right', targetAnchor: DesktopEdge['targetAnchor'] = 'center') {
  const sourceX = side === 'left' ? Math.max(...sources.map((source) => source.right)) : Math.min(...sources.map((source) => source.left));
  const targetX = side === 'left' ? target.left : target.right;
  const sourceY = sources.map((source) => source.centerY);
  const targetY = targetAnchor === 'upper' ? target.top + 7 : target.centerY;

  if (targetAnchor === 'merged-final' && sources.length === 2) {
    const leftSource = sources[0];
    const rightSource = sources[1];
    const targetCenterX = (target.left + target.right) / 2;
    const mergeY = target.centerY;
    const leftStemX = target.left - 14;
    const rightStemX = target.right + 14;

    return [
      `M ${targetCenterX} ${mergeY} H ${leftStemX}`,
      `M ${targetCenterX} ${mergeY} H ${rightStemX}`,
      `M ${leftStemX} ${mergeY} V ${leftSource.centerY} H ${leftSource.right}`,
      `M ${rightStemX} ${mergeY} V ${rightSource.centerY} H ${rightSource.left}`,
    ].join(' ');
  }

  if (sources.length === 1) {
    if (targetAnchor === 'upper') {
      const stemX = side === 'left' ? targetX - 14 : targetX + 14;
      return `M ${targetX} ${targetY} H ${stemX} V ${sourceY[0]} H ${sourceX}`;
    }

    const stemX = side === 'left' ? sourceX + 14 : sourceX - 14;
    return `M ${sourceX} ${sourceY[0]} H ${stemX} V ${targetY} H ${targetX}`;
  }

  const bendX = sourceX + (targetX - sourceX) / 2;
  const y1 = sourceY[0];
  const y2 = sourceY[1];

  return [
    `M ${sourceX} ${y1} H ${bendX}`,
    `M ${sourceX} ${y2} H ${bendX}`,
    `M ${bendX} ${y1} V ${y2}`,
    `M ${bendX} ${targetY} H ${targetX}`,
  ].join(' ');
}

function DesktopBracketBoard({
  roundOf32,
  roundOf16,
  quarterFinals,
  semiFinals,
  finalItem,
  thirdPlaceItems,
}: {
  roundOf32: BracketSplit;
  roundOf16: BracketSplit;
  quarterFinals: BracketSplit;
  semiFinals: BracketSplit;
  finalItem: BracketCardData;
  thirdPlaceItems: BracketCardData[];
}) {
  const championTeam = getChampionTeam(finalItem);

  const boardRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<DesktopPath[]>([]);
  const nodes: DesktopNode[] = [
    ...roundOf32.left.map((item, index) => ({ id: `l32-${index}`, item, x: DESKTOP_X.left32, y: DESKTOP_Y.r32[index] })),
    ...roundOf16.left.map((item, index) => ({ id: `l16-${index}`, item, x: DESKTOP_X.left16, y: DESKTOP_Y.r16[index] })),
    ...quarterFinals.left.map((item, index) => ({ id: `l8-${index}`, item, x: DESKTOP_X.left8, y: DESKTOP_Y.qf[index] })),
    ...semiFinals.left.map((item, index) => ({ id: `l4-${index}`, item, x: DESKTOP_X.left4, y: DESKTOP_Y.sf[index] })),
    { id: 'final', item: finalItem, x: DESKTOP_X.center, y: DESKTOP_Y.final, label: '결승', isFinal: true },
    ...thirdPlaceItems.map((item, index) => ({ id: `third-${index}`, item, x: DESKTOP_X.center, y: DESKTOP_Y.third, label: '3/4위전' })),
    ...semiFinals.right.map((item, index) => ({ id: `r4-${index}`, item, x: DESKTOP_X.right4, y: DESKTOP_Y.sf[index] })),
    ...quarterFinals.right.map((item, index) => ({ id: `r8-${index}`, item, x: DESKTOP_X.right8, y: DESKTOP_Y.qf[index] })),
    ...roundOf16.right.map((item, index) => ({ id: `r16-${index}`, item, x: DESKTOP_X.right16, y: DESKTOP_Y.r16[index] })),
    ...roundOf32.right.map((item, index) => ({ id: `r32-${index}`, item, x: DESKTOP_X.right32, y: DESKTOP_Y.r32[index] })),
  ];

  const updatePaths = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const boundsById = new Map<string, CardBounds>();

    board.querySelectorAll<HTMLElement>('[data-bracket-node]').forEach((node) => {
      const nodeId = node.dataset.bracketNode;
      const card = node.querySelector<HTMLElement>('[data-bracket-card]');
      if (!nodeId || !card) return;

      const rect = card.getBoundingClientRect();
      boundsById.set(nodeId, {
        left: rect.left - boardRect.left,
        right: rect.right - boardRect.left,
        top: rect.top - boardRect.top,
        bottom: rect.bottom - boardRect.top,
        centerX: rect.left - boardRect.left + rect.width / 2,
        centerY: rect.top - boardRect.top + rect.height / 2,
      });
    });

    setPaths(
      DESKTOP_EDGES.flatMap((edge, index) => {
        const sources = edge.sources.map((sourceId) => boundsById.get(sourceId));
        const target = boundsById.get(edge.target);

        if (!target || sources.some((source) => !source)) return [];

        return [{
          id: `${edge.side}-${index}`,
          d: pathFromMeasuredCards(sources as CardBounds[], target, edge.side, edge.targetAnchor),
        }];
      })
    );
  }, [roundOf32, roundOf16, quarterFinals, semiFinals, finalItem, thirdPlaceItems]);

  useLayoutEffect(() => {
    updatePaths();

    const timer = setTimeout(updatePaths, 150);

    const board = boardRef.current;
    if (!board) return () => clearTimeout(timer);

    const resizeObserver = new ResizeObserver(updatePaths);
    resizeObserver.observe(board);
    window.addEventListener('resize', updatePaths);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePaths);
    };
  }, [updatePaths]);

  const labels = [
    { x: DESKTOP_X.left32, text: '32강' },
    { x: DESKTOP_X.left16, text: '16강' },
    { x: DESKTOP_X.left8, text: '8강' },
    { x: DESKTOP_X.left4, text: '4강' },
    { x: DESKTOP_X.right4, text: '4강' },
    { x: DESKTOP_X.right8, text: '8강' },
    { x: DESKTOP_X.right16, text: '16강' },
    { x: DESKTOP_X.right32, text: '32강' },
  ];

  return (
    <div className="relative hidden h-[680px] overflow-hidden px-2 py-3 lg:block lg:px-4 lg:py-4">
      <div ref={boardRef} className="absolute inset-x-2 top-3 h-[650px] lg:inset-x-4 lg:top-4">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-gray-200 dark:text-gray-800"
        >
          {paths.map((path) => (
            <path
              key={path.id}
              d={path.d}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {labels.map((label) => (
          <div
            key={label.text + label.x}
            className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-gray-600 dark:text-gray-300 lg:text-[13px]"
            style={{ left: `${label.x / 10}%`, top: 0 }}
          >
            {label.text}
          </div>
        ))}
        <div
          className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center"
          style={{ left: `${DESKTOP_X.center / 10}%`, top: '117px' }}
        >
          <Trophy
            className={`h-9 w-9 lg:h-11 lg:w-11 ${
              championTeam ? 'text-amber-400 dark:text-amber-300 drop-shadow-sm' : 'text-gray-300 dark:text-gray-700'
            }`}
            aria-hidden
          />
          {championTeam ? (
            <div className="flex flex-col items-center gap-0.5">
              <TeamLogoMark logo={championTeam.logo} name={championTeam.name} />
              <span className="whitespace-nowrap text-center text-[9.5px] font-bold leading-none text-gray-900 dark:text-[#F0F0F0] lg:text-[11.5px]">
                {teamDisplayName(championTeam)}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 lg:text-[12px]">
              챔피언
            </span>
          )}
        </div>
        {nodes.map((node) => (
          <div
            key={node.id}
            data-bracket-node={node.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${node.id === 'final' || node.id.startsWith('third-') ? 'w-[9.2%]' : 'w-[9.6%]'}`}
            style={{ left: `${node.x / 10}%`, top: `${node.y}px` }}
          >
            {node.label && (
              <div className="mb-1 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 lg:text-[11px]">
                {node.label}
              </div>
            )}
            <MatchCard item={node.item} isFinal={node.isFinal} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorldCupBracketView({ rounds, standings, forceVertical = false }: WorldCupBracketViewProps) {
  const columns = KNOCKOUT_ROUNDS.map((round) => {
    const actualItems = (
      rounds.find(
        (item) =>
          item.round === round.key ||
          (round.key === 'Final' &&
            item.round.toLowerCase().includes('final') &&
            !item.round.includes('Quarter') &&
            !item.round.includes('Semi') &&
            !item.round.includes('3rd'))
      )?.fixtures ?? []
    ).map(fixtureToBracketCard);
    const mergedItems = getMergedRoundItems(round.key, actualItems, standings);
    return {
      ...round,
      items: mergedItems,
    };
  });
  const actualThirdPlaceItems = (rounds.find((round) => round.round === '3rd Place Final')?.fixtures ?? []).map(fixtureToBracketCard);
  const thirdPlaceItems = getMergedRoundItems('3rd Place Final', actualThirdPlaceItems, standings);
  const roundOf32 = splitBracketSide(columns.find((round) => round.key === 'Round of 32')?.items ?? []);
  const roundOf16 = splitBracketSide(columns.find((round) => round.key === 'Round of 16')?.items ?? []);
  const quarterFinals = splitBracketSide(columns.find((round) => round.key === 'Quarter-finals')?.items ?? []);
  const semiFinals = splitBracketSide(columns.find((round) => round.key === 'Semi-finals')?.items ?? []);
  const finalItem = columns.find((round) => round.key === 'Final')?.items[0] ?? FALLBACK_BRACKET.Final[0];

  if (forceVertical) {
    return (
      <div className="w-full select-none overflow-x-auto overflow-y-hidden" style={{ contentVisibility: 'auto' }}>
        <MobileVerticalBracket
          roundOf32={roundOf32}
          roundOf16={roundOf16}
          quarterFinals={quarterFinals}
          semiFinals={semiFinals}
          finalItem={finalItem}
          thirdPlaceItems={thirdPlaceItems}
          isSidebar={true}
        />
      </div>
    );
  }

  return (
    <Container className="overflow-hidden bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader className="items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden />
          <ContainerTitle>월드컵 토너먼트</ContainerTitle>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">대진표</span>
      </ContainerHeader>
      <ContainerContent className="px-0 py-0">
        <MobileVerticalBracket
          roundOf32={roundOf32}
          roundOf16={roundOf16}
          quarterFinals={quarterFinals}
          semiFinals={semiFinals}
          finalItem={finalItem}
          thirdPlaceItems={thirdPlaceItems}
        />
        <DesktopBracketBoard
          roundOf32={roundOf32}
          roundOf16={roundOf16}
          quarterFinals={quarterFinals}
          semiFinals={semiFinals}
          finalItem={finalItem}
          thirdPlaceItems={thirdPlaceItems}
        />
      </ContainerContent>
    </Container>
  );
}
