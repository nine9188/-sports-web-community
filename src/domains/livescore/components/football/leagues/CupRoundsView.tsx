'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Container, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';
import { getMatchSlug } from '@/domains/livescore/utils/slugs';
import type { CupRound, CupFixture } from '@/domains/livescore/actions/match/cupFixtures';

// 기본 펼침 라운드 수 — 정렬상 상위 N개 (Final/Semi/QF/16강 레벨)
const DEFAULT_EXPANDED_COUNT = 4;

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

// 경기 상태 한글 라벨
const STATUS_LABEL: Record<string, string> = {
  NS: '예정', TBD: '미정', PST: '연기', CANC: '취소', ABD: '중단',
  FT: '종료', AET: '연장종료', PEN: '승부차기',
  AWD: '몰수승', WO: '부전승',
  '1H': '전반전', '2H': '후반전', HT: '하프타임', ET: '연장전', BT: '휴식',
  P: '승부차기 중', LIVE: '진행중', SUSP: '중단', INT: '중단',
};

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT']);
const FINISHED_CODES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
}

function teamDisplayName(f: CupFixture['home']): string {
  return f.name_ko || f.name || '';
}

interface FixtureRowProps {
  fixture: CupFixture;
  isLast: boolean;
  isCurrent?: boolean;  // 현재 보고있는 매치 → 하이라이트
}

function FixtureRow({ fixture, isLast, isCurrent = false }: FixtureRowProps) {
  const { home, away, status } = fixture;
  const isLive = LIVE_CODES.has(status.short);
  const isFinished = FINISHED_CODES.has(status.short);
  const showScore = isLive || isFinished;
  const statusLabel = STATUS_LABEL[status.short] || status.short || '';

  const href = `/livescore/football/match/${fixture.id}/${getMatchSlug(home.name, away.name)}`;

  const rowHover = isCurrent ? '' : 'hover:bg-[#F5F5F5] dark:hover:bg-[#262626]';
  const borderClass = isLast
    ? ''
    : isCurrent
      ? 'border-b border-blue-100 dark:border-blue-900/50'
      : 'border-b border-gray-100 dark:border-gray-800';

  // 현재 매치는 행 전체를 부드러운 그라디언트(파랑→빨강)로 단일 처리
  // 셀별 배경 분리 시 발생하는 색 단차를 없앰
  const rowBaseBg = isCurrent
    ? 'bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/30 dark:to-red-900/30'
    : '';

  return (
    <Link
      href={href}
      aria-current={isCurrent ? 'page' : undefined}
      className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${rowBaseBg} ${rowHover} ${borderClass}`}
    >
      {/* 날짜 + 상태 */}
      <div className="w-[56px] flex-shrink-0 text-[11px] leading-tight">
        <div className="text-gray-700 dark:text-gray-300">{formatDate(fixture.date)}</div>
        <div className={isLive ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}>
          {statusLabel}
        </div>
      </div>

      {/* 홈팀 */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        {isCurrent && (
          <span className="text-[10px] md:text-xs font-bold px-1 md:px-1.5 md:py-0.5 rounded flex-shrink-0 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            홈
          </span>
        )}
        <span
          className={`text-[13px] truncate text-right ${
            isCurrent
              ? 'font-semibold text-blue-900 dark:text-blue-200'
              : home.winner
                ? 'font-bold text-gray-900 dark:text-[#F0F0F0]'
                : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {teamDisplayName(home)}
        </span>
        <UnifiedSportsImageClient
          src={home.logo || TEAM_PLACEHOLDER}
          alt={`${home.name} 로고`}
          width={20}
          height={20}
          className="w-5 h-5 object-contain flex-shrink-0"
        />
      </div>

      {/* 스코어 / vs */}
      <div className="w-[56px] flex-shrink-0 text-center text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">
        {showScore ? (
          <span>
            {home.score ?? 0}
            <span className="mx-1 text-gray-400">-</span>
            {away.score ?? 0}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 font-normal">vs</span>
        )}
      </div>

      {/* 원정팀 */}
      <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
        <UnifiedSportsImageClient
          src={away.logo || TEAM_PLACEHOLDER}
          alt={`${away.name} 로고`}
          width={20}
          height={20}
          className="w-5 h-5 object-contain flex-shrink-0"
        />
        <span
          className={`text-[13px] truncate ${
            isCurrent
              ? 'font-semibold text-red-900 dark:text-red-200'
              : away.winner
                ? 'font-bold text-gray-900 dark:text-[#F0F0F0]'
                : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {teamDisplayName(away)}
        </span>
        {isCurrent && (
          <span className="text-[10px] md:text-xs font-bold px-1 md:px-1.5 md:py-0.5 rounded flex-shrink-0 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
            원정
          </span>
        )}
      </div>
    </Link>
  );
}

interface CupRoundsViewProps {
  rounds: CupRound[];
  /**
   * 특정 경기를 기준으로 펼침 라운드를 결정 (매치 페이지의 순위 탭용)
   * - 지정되면: 해당 경기 포함 라운드 + 바로 이전/다음 라운드 기본 펼침
   * - 없으면: 정렬상 상위 N개 라운드 기본 펼침 (리그 페이지용)
   */
  currentMatchId?: number;
}

export default function CupRoundsView({ rounds, currentMatchId }: CupRoundsViewProps) {
  // 현재 매치가 속한 라운드 키 (있으면 접기 불가)
  const currentRoundKey = currentMatchId
    ? rounds.find(r => r.fixtures.some(f => f.id === currentMatchId))?.round
    : undefined;

  // 기본 펼침 라운드 결정
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    if (currentMatchId) {
      const currentIdx = rounds.findIndex(r =>
        r.fixtures.some(f => f.id === currentMatchId)
      );
      if (currentIdx >= 0) {
        // 현재 라운드 + 앞 1 + 뒤 1 (있는 것만)
        [currentIdx - 1, currentIdx, currentIdx + 1].forEach(i => {
          if (i >= 0 && i < rounds.length) initial.add(rounds[i].round);
        });
        return initial;
      }
    }

    rounds.slice(0, DEFAULT_EXPANDED_COUNT).forEach(r => initial.add(r.round));
    return initial;
  });

  const toggle = (roundKey: string) => {
    // 현재 매치가 속한 라운드는 접을 수 없음
    if (roundKey === currentRoundKey) return;
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(roundKey)) next.delete(roundKey);
      else next.add(roundKey);
      return next;
    });
  };

  if (!rounds || rounds.length === 0) {
    return (
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            아직 경기 일정이 공개되지 않았습니다.
          </p>
        </ContainerContent>
      </Container>
    );
  }

  return (
    <div className="space-y-4">
      {rounds.map((round) => {
        const isOpen = expanded.has(round.round);
        const isLocked = round.round === currentRoundKey;
        return (
          <Container key={round.round} className="bg-white dark:bg-[#1D1D1D]">
            <button
              type="button"
              onClick={() => toggle(round.round)}
              disabled={isLocked}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                isLocked
                  ? 'cursor-default'
                  : 'hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
              }`}
              aria-expanded={isOpen}
              aria-controls={`round-${round.round}`}
            >
              <div className="flex items-center gap-2">
                <ContainerTitle>{round.label}</ContainerTitle>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {round.fixtures.length}경기
                </span>
                {isLocked && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium ml-1">
                    현재 경기
                  </span>
                )}
              </div>
              {!isLocked && (
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              )}
            </button>
            {isOpen && (
              <div id={`round-${round.round}`} className="border-t border-gray-100 dark:border-gray-800">
                {round.fixtures.map((fixture, idx) => (
                  <FixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    isLast={idx === round.fixtures.length - 1}
                    isCurrent={currentMatchId !== undefined && fixture.id === currentMatchId}
                  />
                ))}
              </div>
            )}
          </Container>
        );
      })}
    </div>
  );
}
