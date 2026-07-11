'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';
import { getMatchHrefByTeams, getTeamHref } from '@/domains/livescore/utils/entityLinks';

// 시간대별 통계 타입
interface MinuteStats {
  [key: string]: { total: number | null; percentage: string | null };
}

// 언더/오버 통계 타입
interface UnderOverStats {
  [key: string]: { over: number; under: number };
}

// 팀 리그 통계 타입
interface TeamLeagueStats {
  form?: string;
  fixtures?: {
    played?: { home: number; away: number; total: number };
    wins?: { home: number; away: number; total: number };
    draws?: { home: number; away: number; total: number };
    loses?: { home: number; away: number; total: number };
  };
  goals?: {
    for?: {
      total?: { home: number; away: number; total: number };
      average?: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
    against?: {
      total?: { home: number; away: number; total: number };
      average?: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
  };
  biggest?: {
    streak?: { wins: number; draws: number; loses: number };
    wins?: { home: string | null; away: string | null };
    loses?: { home: string | null; away: string | null };
    goals?: { for?: { home: number; away: number }; against?: { home: number; away: number } };
  };
  clean_sheet?: { home: number; away: number; total: number };
  failed_to_score?: { home: number; away: number; total: number };
  penalty?: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: MinuteStats;
    red: MinuteStats;
  };
}

// 팀 데이터 타입
interface TeamData {
  id: number;
  name: string;
  logo: string;
  last_5: {
    form: string;
    att: string;
    def: string;
    goals: { for: { total: number; average: number }; against: { total: number; average: number } };
  };
  league?: TeamLeagueStats;
}

// H2H 매치 타입
interface H2HMatch {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number; away: number };
}

// 예측 차트 데이터 타입
export interface PredictionChartData {
  match?: {
    id?: number;
    date?: string;
    league?: {
      id?: number;
      name?: string;
    };
  };
  predictions: {
    percent: { home: string; draw: string; away: string };
    advice?: string | null;
    goals?: { home: string; away: string };
    winner?: { id?: number | null; name: string | null; comment: string | null };
    under_over?: string | null;
    win_or_draw?: boolean;
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  teams: {
    home: TeamData;
    away: TeamData;
  };
  h2h?: H2HMatch[];
}

interface PredictionChartProps {
  data: PredictionChartData;
  showRadar?: boolean;
  showComparison?: boolean;
  showPrediction?: boolean;
  showTeamDetails?: boolean;
  showH2H?: boolean;
  compact?: boolean;
}

// 값 정규화 함수 (0-100 스케일)
function normalizeValue(value: number | undefined, maxExpected: number): number {
  if (!value) return 0;
  return Math.min(Math.round((value / maxExpected) * 100), 100);
}

// 팀 이름 한국어 가져오기 (매핑 없으면 원본 이름 사용)
// Context 기반 lookup — useTeamLeague에서 가져온 lookup 함수를 클로저로 받음
function useTeamNameKo(): (teamId: number | string | null | undefined, fallbackName: string) => string {
  const { getTeamById } = useTeamLeague();
  return (teamId: number | string | null | undefined, fallbackName: string) => {
    const numericTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;
    return numericTeamId ? getTeamById(numericTeamId)?.name_ko || fallbackName : fallbackName;
  };
}

function sameTeamId(left: number | string | null | undefined, right: number | string | null | undefined) {
  if (left === null || left === undefined || right === null || right === undefined) return false;
  return String(left) === String(right);
}

function formatMatchDateTime(date?: string) {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const dateText = parsedDate.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const timeText = parsedDate.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${dateText} ${timeText}`;
}

// W/D/L 배지 컴포넌트
function FormBadge({ result }: { result: string }) {
  const getStyle = () => {
    switch (result.toUpperCase()) {
      case 'W':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'D':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'L':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-[#F5F5F5] dark:bg-[#333333] text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <span className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded text-[10px] md:text-[11px] font-medium ${getStyle()}`}>
      {result.toUpperCase()}
    </span>
  );
}

// 폼 문자열을 배지로 렌더링 (왼쪽=최신, 오른쪽=과거)
function FormDisplay({ form }: { form: string }) {
  if (!form) return null;
  const recentResults = form.split('').reverse();
  return (
    <div className="grid w-fit max-w-full grid-cols-[repeat(6,20px)] gap-0.5 md:grid-cols-[repeat(10,24px)] md:gap-0.5">
      <span className="flex h-5 w-5 md:h-6 md:w-6 items-center justify-center rounded bg-[#F5F5F5] text-[10px] md:text-[11px] font-semibold text-gray-400 dark:bg-[#333333] dark:text-gray-500">
        &gt;
      </span>
      {recentResults.map((char, idx) => (
        <FormBadge key={idx} result={char} />
      ))}
    </div>
  );
}

function SeasonFormCell({ label, form, align }: { label: '홈' | '원정'; form: string; align: 'right' | 'left' }) {
  return (
    <div className={`mx-auto w-fit max-w-full text-left ${align === 'right' ? 'md:ml-auto md:mr-0' : 'md:ml-0 md:mr-auto'}`}>
      <div className={`mb-1 text-[10px] font-semibold ${label === '홈' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
        {label}
      </div>
      <FormDisplay form={form} />
    </div>
  );
}

// 섹션 헤더
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
      {children}
    </div>
  );
}

type VenueKey = 'total' | 'home' | 'away';

function formatRecord(team: TeamData, venue: VenueKey) {
  const fixtures = team.league?.fixtures;
  const played = fixtures?.played?.[venue] ?? 0;
  const wins = fixtures?.wins?.[venue] ?? 0;
  const draws = fixtures?.draws?.[venue] ?? 0;
  const loses = fixtures?.loses?.[venue] ?? 0;

  return `${played}경기 ${wins}승 ${draws}무 ${loses}패`;
}

function goalLine(team: TeamData, type: 'for' | 'against') {
  const goals = team.league?.goals?.[type];
  return (
    <span className="leading-5 md:whitespace-normal">
      홈 <strong className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{goals?.total?.home ?? 0}</strong>
      <span className="mx-0.5 text-gray-300 dark:text-gray-600 sm:mx-1">·</span>
      원정 <strong className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{goals?.total?.away ?? 0}</strong>
      <span className="mx-0.5 text-gray-300 dark:text-gray-600 sm:mx-1">·</span>
      합계 <strong className="font-bold text-gray-950 dark:text-white">{goals?.total?.total ?? 0}</strong>
      <span className="mx-0.5 text-gray-300 dark:text-gray-600 sm:mx-1">·</span>
      평균 {goals?.average?.total ?? '-'}
    </span>
  );
}

function mobileGoalLine(team: TeamData, type: 'for' | 'against') {
  const goals = team.league?.goals?.[type];
  return (
    <div className="space-y-1 leading-5">
      <div className="grid grid-cols-2 gap-x-2">
        <span>홈 <strong className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{goals?.total?.home ?? 0}</strong></span>
        <span>원정 <strong className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{goals?.total?.away ?? 0}</strong></span>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <span>합계 <strong className="font-bold text-gray-950 dark:text-white">{goals?.total?.total ?? 0}</strong></span>
        <span>평균 {goals?.average?.total ?? '-'}</span>
      </div>
    </div>
  );
}

function underOverLine(team: TeamData, line: string) {
  const forLine = team.league?.goals?.for?.under_over?.[line];
  const againstLine = team.league?.goals?.against?.under_over?.[line];

  return (
    <div className="inline-block space-y-0.5 text-left leading-5">
      <div>
        득점 오버 <strong className="text-green-600 dark:text-green-400">{forLine?.over ?? '-'}</strong>
        <span className="mx-0.5 text-gray-300 dark:text-gray-600 sm:mx-1">/</span>
        언더 <strong className="text-red-600 dark:text-red-400">{forLine?.under ?? '-'}</strong>
      </div>
      <div>
        실점 오버 <strong className="text-green-600 dark:text-green-400">{againstLine?.over ?? '-'}</strong>
        <span className="mx-0.5 text-gray-300 dark:text-gray-600 sm:mx-1">/</span>
        언더 <strong className="text-red-600 dark:text-red-400">{againstLine?.under ?? '-'}</strong>
      </div>
    </div>
  );
}

function mobileUnderOverLine(team: TeamData, line: string) {
  const forLine = team.league?.goals?.for?.under_over?.[line];
  const againstLine = team.league?.goals?.against?.under_over?.[line];

  return (
    <div className="space-y-1 leading-5">
      <div className="grid grid-cols-2 gap-x-2">
        <span>득 오버 <strong className="text-green-600 dark:text-green-400">{forLine?.over ?? '-'}</strong></span>
        <span>언더 <strong className="text-red-600 dark:text-red-400">{forLine?.under ?? '-'}</strong></span>
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        <span>실 오버 <strong className="text-green-600 dark:text-green-400">{againstLine?.over ?? '-'}</strong></span>
        <span>언더 <strong className="text-red-600 dark:text-red-400">{againstLine?.under ?? '-'}</strong></span>
      </div>
    </div>
  );
}

function formatLineups(team: TeamData, limit: number) {
  return (team.league?.lineups || [])
    .slice(0, limit)
    .map((lineup) => `${lineup.formation} (${lineup.played})`)
    .join(' · ') || '-';
}

function formatLineupsMobile(team: TeamData, limit: number, align: 'left' | 'right') {
  const lineups = team.league?.lineups || [];
  if (lineups.length === 0) return '-';
  return (
    <div className={`space-y-0.5 text-[10px] ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {lineups.slice(0, limit).map((lineup, idx) => (
        <div key={idx} className="truncate">
          <span className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{lineup.formation}</span>
          <span className="text-gray-400 dark:text-gray-500 ml-1">({lineup.played}경기)</span>
        </div>
      ))}
    </div>
  );
}

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black/5 dark:border-white/10">
      <SectionHeader>{title}</SectionHeader>
      <div className="divide-y divide-black/5 dark:divide-white/10">{children}</div>
    </section>
  );
}

function CompareRow({
  label,
  home,
  away,
  mobileHome,
  mobileAway,
  homeClassName = '',
  awayClassName = '',
  mobileLayout = 'two-column',
  showMobileLabel = true,
  showMobileSideLabels = true,
  mobileCenterLabelWidth = 'normal',
  mobileDensity = 'normal',
}: {
  label: string;
  home: React.ReactNode;
  away: React.ReactNode;
  mobileHome?: React.ReactNode;
  mobileAway?: React.ReactNode;
  homeClassName?: string;
  awayClassName?: string;
  mobileLayout?: 'two-column' | 'stack' | 'center-label';
  showMobileLabel?: boolean;
  showMobileSideLabels?: boolean;
  mobileCenterLabelWidth?: 'narrow' | 'normal' | 'wide';
  mobileDensity?: 'normal' | 'compact';
}) {
  const mobileHomeContent = mobileHome ?? home;
  const mobileAwayContent = mobileAway ?? away;
  const centerLabelGridClass = mobileCenterLabelWidth === 'wide'
    ? 'grid-cols-[minmax(0,1fr)_82px_minmax(0,1fr)]'
    : mobileCenterLabelWidth === 'narrow'
      ? 'grid-cols-[minmax(0,1fr)_34px_minmax(0,1fr)]'
    : 'grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)]';
  const mobileRowPaddingClass = mobileDensity === 'compact' ? 'px-3 py-1.5' : 'px-3 py-2.5';

  return (
    <>
      <div className={`${mobileRowPaddingClass} text-[11px] md:hidden`}>
        {showMobileLabel && label && mobileLayout !== 'center-label' && (
          <div className="mb-2 text-[12px] font-semibold leading-none text-gray-500 dark:text-gray-400">{label}</div>
        )}
        {mobileLayout === 'center-label' ? (
          <div className={`grid ${centerLabelGridClass} items-center gap-1.5`}>
            <div className={`min-w-0 break-words text-right leading-5 text-gray-900 dark:text-[#F0F0F0] ${homeClassName}`}>{mobileHomeContent}</div>
            <div className="text-center text-[11px] font-semibold leading-5 text-gray-500 dark:text-gray-400">{label}</div>
            <div className={`min-w-0 break-words text-left leading-5 text-gray-900 dark:text-[#F0F0F0] ${awayClassName}`}>{mobileAwayContent}</div>
          </div>
        ) : mobileLayout === 'stack' ? (
          <div className="space-y-1.5">
            <div className="min-w-0">
              {showMobileSideLabels && (
                <div className="mb-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">홈</div>
              )}
              <div className={`min-w-0 break-words text-gray-900 dark:text-[#F0F0F0] ${homeClassName}`}>{mobileHomeContent}</div>
            </div>
            <div className="min-w-0 border-t border-black/5 pt-1.5 dark:border-white/10">
              {showMobileSideLabels && (
                <div className="mb-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">원정</div>
              )}
              <div className={`min-w-0 break-words text-gray-900 dark:text-[#F0F0F0] ${awayClassName}`}>{mobileAwayContent}</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0 border-r border-black/5 pr-2 dark:border-white/10">
              {showMobileSideLabels && (
                <div className="mb-1 text-[11px] font-semibold leading-none text-blue-600 dark:text-blue-400">홈</div>
              )}
              <div className={`min-w-0 break-words leading-5 text-gray-900 dark:text-[#F0F0F0] ${homeClassName}`}>{mobileHomeContent}</div>
            </div>
            <div className="min-w-0 pl-1">
              {showMobileSideLabels && (
                <div className="mb-1 text-[11px] font-semibold leading-none text-red-600 dark:text-red-400">원정</div>
              )}
              <div className={`min-w-0 break-words leading-5 text-gray-900 dark:text-[#F0F0F0] ${awayClassName}`}>{mobileAwayContent}</div>
            </div>
          </div>
        )}
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)] items-center text-xs md:grid">
        <div className={`min-w-0 break-words px-3 py-2 text-right text-gray-900 dark:text-[#F0F0F0] ${homeClassName}`}>{home}</div>
        <div className="border-x border-black/5 px-2 py-2 text-center text-[11px] font-medium text-gray-500 dark:border-white/10 dark:text-gray-400">
          {label}
        </div>
        <div className={`min-w-0 break-words px-3 py-2 text-left text-gray-900 dark:text-[#F0F0F0] ${awayClassName}`}>{away}</div>
      </div>
    </>
  );
}

function TeamCompareHeader({
  team,
  label,
  name,
  predictedGoals,
}: {
  team: TeamData;
  label: 'HOME' | 'AWAY';
  name: string;
  predictedGoals?: string;
}) {
  const teamHref = getTeamHref(team);

  return (
    <div className="flex min-w-0 items-center justify-center gap-2 px-3 py-3">
      {label === 'HOME' && team.logo && (
        <a href={teamHref} className="flex h-8 w-8 shrink-0 items-center justify-center" aria-label={`${name} 팀 페이지`}>
          <Image src={team.logo} alt={name} width={32} height={32} unoptimized className="h-full w-full object-contain" />
        </a>
      )}
      <div className="min-w-0 text-center">
        <div className={`mx-auto mb-1 w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${label === 'HOME' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'}`}>
          {label === 'HOME' ? '홈' : '원정'}
        </div>
        <a
          href={teamHref}
          className="block truncate text-[13px] font-semibold text-gray-900 no-underline hover:text-brand-primary hover:no-underline dark:text-[#F0F0F0] dark:hover:text-brand-primary-dark"
        >
          {name}
        </a>
        {predictedGoals && (
          <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            예상골: <strong className="text-gray-900 dark:text-[#F0F0F0]">{predictedGoals}</strong>
          </div>
        )}
      </div>
      {label === 'AWAY' && team.logo && (
        <a href={teamHref} className="flex h-8 w-8 shrink-0 items-center justify-center" aria-label={`${name} 팀 페이지`}>
          <Image src={team.logo} alt={name} width={32} height={32} unoptimized className="h-full w-full object-contain" />
        </a>
      )}
    </div>
  );
}

function MinuteValue({ scored, conceded, maxValue }: { scored: number; conceded: number; maxValue: number }) {
  const scoredPct = Math.max((scored / maxValue) * 100, scored > 0 ? 8 : 0);
  const concededPct = Math.max((conceded / maxValue) * 100, conceded > 0 ? 8 : 0);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[22px_minmax(0,1fr)_22px] items-center gap-1">
        <span className="text-[10px] font-medium text-green-600 dark:text-green-400">득</span>
        <div className="h-2 rounded bg-green-100 dark:bg-green-900/25">
          <div className="h-full rounded bg-green-300 dark:bg-green-700/70" style={{ width: `${scoredPct}%` }} />
        </div>
        <span className="text-right text-[11px] text-gray-700 dark:text-gray-300">{scored || '-'}</span>
      </div>
      <div className="grid grid-cols-[22px_minmax(0,1fr)_22px] items-center gap-1">
        <span className="text-[10px] font-medium text-red-600 dark:text-red-400">실</span>
        <div className="h-2 rounded bg-red-100 dark:bg-red-900/25">
          <div className="h-full rounded bg-red-300 dark:bg-red-700/70" style={{ width: `${concededPct}%` }} />
        </div>
        <span className="text-right text-[11px] text-gray-700 dark:text-gray-300">{conceded || '-'}</span>
      </div>
    </div>
  );
}

function getMinuteMax(home: TeamData, away: TeamData) {
  const timeSlots = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];
  const values = [home, away].flatMap((team) => (
    timeSlots.flatMap((slot) => [
      team.league?.goals?.for?.minute?.[slot]?.total ?? 0,
      team.league?.goals?.against?.minute?.[slot]?.total ?? 0,
    ])
  ));

  return Math.max(1, ...values);
}

function PredictionTeamComparison({
  home,
  away,
  homeName,
  awayName,
  homeGoalLabel,
  awayGoalLabel,
}: {
  home: TeamData;
  away: TeamData;
  homeName: string;
  awayName: string;
  homeGoalLabel?: string;
  awayGoalLabel?: string;
}) {
  const minuteSlots = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];
  const underOverLines = ['0.5', '1.5', '2.5', '3.5'];
  const minuteMax = getMinuteMax(home, away);

  return (
    <div className="border-t border-black/5 bg-white dark:border-white/10 dark:bg-[#1D1D1D]">
      <div>
        <div>
          <CompareSection title="최근 5경기 지표">
            <CompareRow label="경기력" home={home.last_5?.form || '-'} away={away.last_5?.form || '-'} homeClassName="font-bold text-blue-600 dark:text-blue-400" awayClassName="font-bold text-blue-600 dark:text-blue-400" mobileLayout="center-label" />
            <CompareRow label="공격" home={home.last_5?.att || '-'} away={away.last_5?.att || '-'} homeClassName="font-bold text-green-600 dark:text-green-400" awayClassName="font-bold text-green-600 dark:text-green-400" mobileLayout="center-label" />
            <CompareRow label="수비" home={home.last_5?.def || '-'} away={away.last_5?.def || '-'} homeClassName="font-bold text-yellow-600 dark:text-yellow-400" awayClassName="font-bold text-yellow-600 dark:text-yellow-400" mobileLayout="center-label" />
            <CompareRow
              label="득/실"
              home={<>{home.last_5?.goals?.for?.total || 0}득 ({home.last_5?.goals?.for?.average || 0}) · {home.last_5?.goals?.against?.total || 0}실 ({home.last_5?.goals?.against?.average || 0})</>}
              away={<>{away.last_5?.goals?.for?.total || 0}득 ({away.last_5?.goals?.for?.average || 0}) · {away.last_5?.goals?.against?.total || 0}실 ({away.last_5?.goals?.against?.average || 0})</>}
              mobileLayout="center-label"
            />
          </CompareSection>

          {(home.league?.form || away.league?.form) && (
            <CompareSection title="시즌 폼">
              <CompareRow
                label="최근순"
                home={<SeasonFormCell label="홈" form={home.league?.form || ''} align="right" />}
                away={<SeasonFormCell label="원정" form={away.league?.form || ''} align="left" />}
                showMobileLabel={false}
                showMobileSideLabels={false}
              />
            </CompareSection>
          )}

          {(home.league?.fixtures || away.league?.fixtures) && (
            <CompareSection title="시즌 통계">
              <CompareRow label="합계" home={formatRecord(home, 'total')} away={formatRecord(away, 'total')} mobileLayout="center-label" />
              <CompareRow label="홈" home={formatRecord(home, 'home')} away={formatRecord(away, 'home')} mobileLayout="center-label" />
              <CompareRow label="원정" home={formatRecord(home, 'away')} away={formatRecord(away, 'away')} mobileLayout="center-label" />
            </CompareSection>
          )}

          {(home.league?.goals || away.league?.goals) && (
            <CompareSection title="득실점">
              <CompareRow label="득점" home={goalLine(home, 'for')} away={goalLine(away, 'for')} mobileHome={mobileGoalLine(home, 'for')} mobileAway={mobileGoalLine(away, 'for')} homeClassName="text-[11px] tabular-nums" awayClassName="text-[11px] tabular-nums" mobileLayout="center-label" />
              <CompareRow label="실점" home={goalLine(home, 'against')} away={goalLine(away, 'against')} mobileHome={mobileGoalLine(home, 'against')} mobileAway={mobileGoalLine(away, 'against')} homeClassName="text-[11px] tabular-nums" awayClassName="text-[11px] tabular-nums" mobileLayout="center-label" />
            </CompareSection>
          )}

          {(home.league?.goals?.for?.minute || home.league?.goals?.against?.minute || away.league?.goals?.for?.minute || away.league?.goals?.against?.minute) && (
            <CompareSection title="시간대별 득실점">
              {minuteSlots.map((slot) => (
                <CompareRow
                  key={slot}
                  label={slot}
                  home={<MinuteValue scored={home.league?.goals?.for?.minute?.[slot]?.total ?? 0} conceded={home.league?.goals?.against?.minute?.[slot]?.total ?? 0} maxValue={minuteMax} />}
                  away={<MinuteValue scored={away.league?.goals?.for?.minute?.[slot]?.total ?? 0} conceded={away.league?.goals?.against?.minute?.[slot]?.total ?? 0} maxValue={minuteMax} />}
                  mobileLayout="center-label"
                />
              ))}
            </CompareSection>
          )}

          {(home.league?.goals?.for?.under_over || home.league?.goals?.against?.under_over || away.league?.goals?.for?.under_over || away.league?.goals?.against?.under_over) && (
            <CompareSection title="언더/오버">
              {underOverLines.map((line) => (
                <CompareRow key={line} label={line} home={underOverLine(home, line)} away={underOverLine(away, line)} mobileHome={mobileUnderOverLine(home, line)} mobileAway={mobileUnderOverLine(away, line)} homeClassName="text-[11px] tabular-nums" awayClassName="text-[11px] tabular-nums" mobileLayout="center-label" mobileCenterLabelWidth="narrow" />
              ))}
            </CompareSection>
          )}

          {(home.league?.biggest || away.league?.biggest) && (
            <CompareSection title="최대 기록">
              <CompareRow label="연승" home={home.league?.biggest?.streak?.wins ?? 0} away={away.league?.biggest?.streak?.wins ?? 0} homeClassName="font-bold text-green-600 dark:text-green-400" awayClassName="font-bold text-green-600 dark:text-green-400" mobileLayout="center-label" />
              <CompareRow label="연속무" home={home.league?.biggest?.streak?.draws ?? 0} away={away.league?.biggest?.streak?.draws ?? 0} homeClassName="font-bold text-yellow-600 dark:text-yellow-400" awayClassName="font-bold text-yellow-600 dark:text-yellow-400" mobileLayout="center-label" />
              <CompareRow label="연패" home={home.league?.biggest?.streak?.loses ?? 0} away={away.league?.biggest?.streak?.loses ?? 0} homeClassName="font-bold text-red-600 dark:text-red-400" awayClassName="font-bold text-red-600 dark:text-red-400" mobileLayout="center-label" />
              <CompareRow label="홈 최다골 승" home={home.league?.biggest?.wins?.home || '-'} away={away.league?.biggest?.wins?.home || '-'} mobileLayout="center-label" mobileCenterLabelWidth="wide" />
              <CompareRow label="원정 최다골 승" home={home.league?.biggest?.wins?.away || '-'} away={away.league?.biggest?.wins?.away || '-'} mobileLayout="center-label" mobileCenterLabelWidth="wide" />
              <CompareRow label="홈 최다골 패" home={home.league?.biggest?.loses?.home || '-'} away={away.league?.biggest?.loses?.home || '-'} mobileLayout="center-label" mobileCenterLabelWidth="wide" />
              <CompareRow label="원정 최다골 패" home={home.league?.biggest?.loses?.away || '-'} away={away.league?.biggest?.loses?.away || '-'} mobileLayout="center-label" mobileCenterLabelWidth="wide" />
            </CompareSection>
          )}

          {(home.league?.clean_sheet || home.league?.failed_to_score || home.league?.penalty || away.league?.clean_sheet || away.league?.failed_to_score || away.league?.penalty) && (
            <CompareSection title="기타 통계">
              <CompareRow label="무실점" home={`합계 ${home.league?.clean_sheet?.total ?? 0} · 홈${home.league?.clean_sheet?.home ?? 0} 원정${home.league?.clean_sheet?.away ?? 0}`} away={`합계 ${away.league?.clean_sheet?.total ?? 0} · 홈${away.league?.clean_sheet?.home ?? 0} 원정${away.league?.clean_sheet?.away ?? 0}`} mobileLayout="center-label" />
              <CompareRow label="무득점" home={`합계 ${home.league?.failed_to_score?.total ?? 0} · 홈${home.league?.failed_to_score?.home ?? 0} 원정${home.league?.failed_to_score?.away ?? 0}`} away={`합계 ${away.league?.failed_to_score?.total ?? 0} · 홈${away.league?.failed_to_score?.home ?? 0} 원정${away.league?.failed_to_score?.away ?? 0}`} mobileLayout="center-label" />
              <CompareRow label="페널티" home={`${home.league?.penalty?.scored?.total ?? 0}/${home.league?.penalty?.total ?? 0} · ${home.league?.penalty?.scored?.percentage ?? '-'}`} away={`${away.league?.penalty?.scored?.total ?? 0}/${away.league?.penalty?.total ?? 0} · ${away.league?.penalty?.scored?.percentage ?? '-'}`} mobileLayout="center-label" />
            </CompareSection>
          )}

          <CompareSection title="포메이션">
            <CompareRow
              label="주요"
              home={formatLineups(home, 4)}
              away={formatLineups(away, 4)}
              mobileHome={formatLineupsMobile(home, 2, 'right')}
              mobileAway={formatLineupsMobile(away, 2, 'left')}
              mobileLayout="center-label"
            />
          </CompareSection>
        </div>
      </div>
    </div>
  );
}

export default function PredictionChart({
  data,
  showRadar = true,
  showComparison = true,
  showPrediction = true,
  showTeamDetails = true,
  showH2H = true,
  compact = false,
}: PredictionChartProps) {
  const getTeamNameKo = useTeamNameKo();
  const { predictions, comparison, teams, h2h, match } = data;

  // 팀 이름 한국어
  const homeNameKo = getTeamNameKo(teams.home.id, teams.home.name);
  const awayNameKo = getTeamNameKo(teams.away.id, teams.away.name);
  const homeHref = getTeamHref(teams.home);
  const awayHref = getTeamHref(teams.away);
  const getMatchTeamNameKo = (teamId: number | string | null | undefined, fallbackName: string) => {
    if (sameTeamId(teamId, teams.home.id)) return homeNameKo;
    if (sameTeamId(teamId, teams.away.id)) return awayNameKo;
    return getTeamNameKo(teamId, fallbackName);
  };
  const adviceText = predictions.advice
    ?.replaceAll(teams.home.name, homeNameKo)
    .replaceAll(teams.away.name, awayNameKo)
    .replace(/^Double chance\\s*:\\s*/i, '더블 찬스: ')
    .replace(/\\s+or draw\\b/i, ' 또는 무승부');

  // 다크 모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // 레이더 차트용 데이터 (8개 지표) - 각 팀의 개별 능력치 (last_5 기반)
  const radarData = [
    { subject: '경기력', home: parseInt(teams.home.last_5?.form) || 0, away: parseInt(teams.away.last_5?.form) || 0, fullMark: 100 },
    { subject: '공격력', home: parseInt(teams.home.last_5?.att) || 0, away: parseInt(teams.away.last_5?.att) || 0, fullMark: 100 },
    { subject: '수비력', home: parseInt(teams.home.last_5?.def) || 0, away: parseInt(teams.away.last_5?.def) || 0, fullMark: 100 },
    { subject: '승', home: normalizeValue(teams.home.league?.fixtures?.wins?.total, 15), away: normalizeValue(teams.away.league?.fixtures?.wins?.total, 15), fullMark: 100 },
    { subject: '무', home: normalizeValue(teams.home.league?.fixtures?.draws?.total, 10), away: normalizeValue(teams.away.league?.fixtures?.draws?.total, 10), fullMark: 100 },
    { subject: '패', home: normalizeValue(teams.home.league?.fixtures?.loses?.total, 15), away: normalizeValue(teams.away.league?.fixtures?.loses?.total, 15), fullMark: 100 },
    { subject: '득점', home: normalizeValue(teams.home.league?.goals?.for?.total?.total, 50), away: normalizeValue(teams.away.league?.goals?.for?.total?.total, 50), fullMark: 100 },
    { subject: '실점', home: normalizeValue(teams.home.league?.goals?.against?.total?.total, 50), away: normalizeValue(teams.away.league?.goals?.against?.total?.total, 50), fullMark: 100 },
  ];

  // 비교 막대용 데이터 (상대 비교 - 합이 100%)
  const comparisonData = [
    { label: '경기력', home: parseInt(comparison.form?.home) || 0, away: parseInt(comparison.form?.away) || 0 },
    { label: '공격력', home: parseInt(comparison.att?.home) || 0, away: parseInt(comparison.att?.away) || 0 },
    { label: '수비력', home: parseInt(comparison.def?.home) || 0, away: parseInt(comparison.def?.away) || 0 },
    { label: '통계예측', home: parseInt(comparison.poisson_distribution?.home) || 0, away: parseInt(comparison.poisson_distribution?.away) || 0 },
    { label: '상대전적', home: parseInt(comparison.h2h?.home) || 0, away: parseInt(comparison.h2h?.away) || 0 },
    { label: '득점력', home: parseInt(comparison.goals?.home) || 0, away: parseInt(comparison.goals?.away) || 0 },
    { label: '종합', home: parseInt(comparison.total?.home) || 0, away: parseInt(comparison.total?.away) || 0, highlight: true },
  ];

  const chartHeight = compact ? 240 : 280;
  const homeGoalVal = predictions.goals ? parseFloat(predictions.goals.home) : NaN;
  const awayGoalVal = predictions.goals ? parseFloat(predictions.goals.away) : NaN;
  const homeGoalLabel = !isNaN(homeGoalVal) ? (homeGoalVal < 0 ? `U${Math.abs(homeGoalVal)}` : `O${homeGoalVal}`) : undefined;
  const awayGoalLabel = !isNaN(awayGoalVal) ? (awayGoalVal < 0 ? `U${Math.abs(awayGoalVal)}` : `O${awayGoalVal}`) : undefined;
  const matchDateTime = formatMatchDateTime(match?.date);

  return (
    <div className="prediction-chart bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 overflow-hidden my-4">
      {/* AI 예측 */}
      {showPrediction && (
        <div className="p-4 border-b border-black/5 dark:border-white/10">
          {(matchDateTime || match?.league?.name) && (
            <div className="mb-3 text-center text-[12px] font-medium text-gray-500 dark:text-gray-400">
              {match?.league?.name && <span>{match.league.name}</span>}
              {match?.league?.name && matchDateTime && <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>}
              {matchDateTime && <time dateTime={match?.date}>{matchDateTime} KST</time>}
            </div>
          )}
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-3">
            {/* 홈팀 */}
            <div className="flex items-center gap-3 md:gap-4.5">
              {teams.home.logo && (
                <a href={homeHref} className="w-9 h-9 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center" aria-label={`${homeNameKo} 팀 페이지`}>
                  <Image src={teams.home.logo} alt={homeNameKo} width={48} height={48} unoptimized className="w-full h-full object-contain" />
                </a>
              )}
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{predictions.percent.home}</div>
                <a href={homeHref} className="block max-w-[90px] truncate text-[13px] text-gray-600 no-underline hover:text-brand-primary hover:no-underline dark:text-gray-400 dark:hover:text-brand-primary-dark">
                  {homeNameKo}
                </a>
              </div>
            </div>
            {/* 무승부 */}
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-gray-400 dark:text-gray-500">{predictions.percent.draw}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">무승부</div>
            </div>
            {/* 원정팀 */}
            <div className="flex items-center gap-3 md:gap-4.5">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">{predictions.percent.away}</div>
                <a href={awayHref} className="block max-w-[90px] truncate text-[13px] text-gray-600 no-underline hover:text-brand-primary hover:no-underline dark:text-gray-400 dark:hover:text-brand-primary-dark">
                  {awayNameKo}
                </a>
              </div>
              {teams.away.logo && (
                <a href={awayHref} className="w-9 h-9 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center" aria-label={`${awayNameKo} 팀 페이지`}>
                  <Image src={teams.away.logo} alt={awayNameKo} width={48} height={48} unoptimized className="w-full h-full object-contain" />
                </a>
              )}
            </div>
          </div>
          {/* 예측 상세 */}
          <div className="flex justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400">
            {predictions.winner?.name && (
              <span>
                승자:{' '}
                {predictions.winner.id ? (
                  <a
                    href={getTeamHref({ id: predictions.winner.id, name: predictions.winner.name })}
                    className="font-semibold text-gray-900 no-underline hover:text-brand-primary hover:no-underline dark:text-[#F0F0F0] dark:hover:text-brand-primary-dark"
                  >
                    {getTeamNameKo(predictions.winner.id, predictions.winner.name)}
                  </a>
                ) : (
                  <strong className="text-gray-900 dark:text-[#F0F0F0]">{predictions.winner.name}</strong>
                )}
              </span>
            )}
            {predictions.under_over && (() => {
              const val = parseFloat(predictions.under_over);
              if (isNaN(val)) return <span>U/O: <strong className="text-gray-900 dark:text-[#F0F0F0]">{predictions.under_over}</strong></span>;
              const label = val < 0 ? `U${Math.abs(val)}` : `O${val}`;
              return <span>총골: <strong className="text-gray-900 dark:text-[#F0F0F0]">{label}</strong></span>;
            })()}
          </div>
          {adviceText && (
            <div className="mt-2 text-center text-[11px] text-gray-600 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] py-1.5 px-2 rounded">
              💡 {adviceText}
            </div>
          )}
        </div>
      )}

      {/* 레이더 & 비교 */}
      {showRadar && (
        <>
          <SectionHeader>데이터 기반 팀 비교</SectionHeader>
          <div className="p-3">
            <div className="flex items-center justify-center gap-3 mb-1 text-[11px]">
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{homeNameKo}</span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{awayNameKo}</span>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={isDark ? '#4B5563' : '#e5e7eb'} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9CA3AF' : '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: isDark ? '#6B7280' : '#9ca3af', fontSize: 10 }} tickCount={5} />
                <Radar name={homeNameKo} dataKey="home" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} strokeWidth={2} />
                <Radar name={awayNameKo} dataKey="away" stroke="#22C55E" fill="#22C55E" fillOpacity={0.4} strokeWidth={2} />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded p-1.5 shadow text-[11px]">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-0.5">{label}</p>
                        {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: {e.value}%</p>)}
                      </div>
                    );
                  }
                  return null;
                }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {showComparison && (
        <>
          <SectionHeader>상대 비교 지표</SectionHeader>
          <div className="border-b border-black/5 dark:border-white/10">
            <div className="border-b border-black/5 px-3 py-2 text-center text-[11px] font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400 md:hidden">
              팀 비교
            </div>
            <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)]">
              <TeamCompareHeader team={teams.home} label="HOME" name={homeNameKo} predictedGoals={homeGoalLabel} />
              <div className="hidden items-center justify-center border-x border-black/5 px-2 text-[11px] font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400 md:flex">
                팀 비교
              </div>
              <TeamCompareHeader team={teams.away} label="AWAY" name={awayNameKo} predictedGoals={awayGoalLabel} />
            </div>
          </div>
          <div className="p-3">
            <div className="space-y-1.5">
            {comparisonData.map((item, idx) => (
              <div key={idx} className={`flex items-center gap-2 text-[11px] ${item.highlight ? 'bg-[#F5F5F5] dark:bg-[#262626] py-0.5 px-1 rounded' : ''}`}>
                <span className={`w-8 text-right text-blue-600 dark:text-blue-400 ${item.highlight ? 'font-bold' : ''}`}>{item.home}%</span>
                <div className="flex-1 flex h-2 bg-[#EAEAEA] dark:bg-[#333333] rounded overflow-hidden">
                  <div className="bg-blue-500" style={{ width: `${item.home}%` }} />
                  <div className="bg-green-500" style={{ width: `${item.away}%` }} />
                </div>
                <span className={`w-8 text-green-600 dark:text-green-400 ${item.highlight ? 'font-bold' : ''}`}>{item.away}%</span>
                <span className={`w-12 text-gray-500 dark:text-gray-400 ${item.highlight ? 'font-medium text-gray-700 dark:text-gray-300' : ''}`}>{item.label}</span>
              </div>
            ))}
            </div>
          </div>
        </>
      )}

      {/* 팀 상세 */}
      {showTeamDetails && (() => {
        return (
          <PredictionTeamComparison
            home={teams.home}
            away={teams.away}
            homeName={homeNameKo}
            awayName={awayNameKo}
            homeGoalLabel={homeGoalLabel}
            awayGoalLabel={awayGoalLabel}
          />
        );
      })()}

      {/* 상대전적 */}
      {showH2H && h2h && h2h.length > 0 && (
        <div className="border-t border-black/5 dark:border-white/10">
          <SectionHeader>상대전적 (최근 {Math.min(h2h.length, 5)}경기)</SectionHeader>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {h2h.slice(0, 5).map((match, idx) => {
              const matchHomeNameKo = getMatchTeamNameKo(match.teams.home.id, match.teams.home.name);
              const matchAwayNameKo = getMatchTeamNameKo(match.teams.away.id, match.teams.away.name);
              const matchHref = getMatchHrefByTeams(match.fixture.id, match.teams.home, match.teams.away);
              return (
                <a
                  key={idx}
                  href={matchHref}
                  className="grid grid-cols-[48px_minmax(0,1fr)_42px_minmax(0,1fr)_48px] md:grid-cols-[64px_minmax(0,1fr)_52px_minmax(0,1fr)_64px] items-center gap-1.5 md:gap-2 px-3 py-2 text-xs no-underline transition-colors hover:bg-[#F5F5F5] hover:no-underline dark:hover:bg-[#262626]"
                >
                  <span className="text-gray-400 truncate text-[10px] md:text-xs">
                    {new Date(match.fixture.date).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                  </span>
                  <span className={`min-w-0 truncate text-right ${match.teams.home.winner ? 'font-bold text-green-600 dark:text-green-400' : match.teams.home.winner === false ? 'text-red-500' : ''}`}>
                    {matchHomeNameKo}
                  </span>
                  <span className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-center font-bold text-gray-900 dark:bg-[#262626] dark:text-[#F0F0F0] text-[11px] md:text-xs">
                    {match.goals.home}-{match.goals.away}
                  </span>
                  <span className={`min-w-0 truncate text-left ${match.teams.away.winner ? 'font-bold text-green-600 dark:text-green-400' : match.teams.away.winner === false ? 'text-red-500' : ''}`}>
                    {matchAwayNameKo}
                  </span>
                  <span aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
