'use client';

import { FormEvent, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Download, Image as ImageIcon, Loader2, Search, Square, RectangleVertical, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadPredictionThumbnailSource, type PredictionThumbnailSource } from '@/domains/admin/actions/thumbnail';
import type { PredictionChartData } from '@/domains/prediction/components/PredictionChart';

type ThumbnailSizeId = 'vertical' | 'square' | 'smallSquare';
type ThumbnailTemplate =
  | 'versus'
  | 'powerOdds'
  | 'powerRadar'
  | 'comparison'
  | 'condition'
  | 'goals'
  | 'h2h'
  | 'chart'
  | 'match'
  | 'clean';
type ThumbnailTone = 'dark' | 'light';
type PosterBackground = 'blueGreen' | 'navy' | 'blackBlue' | 'blackGreen' | 'charcoal' | 'custom';

interface ThumbnailSize {
  id: ThumbnailSizeId;
  label: string;
  width: number;
  height: number;
  icon: typeof RectangleVertical;
}

const THUMBNAIL_SIZES: ThumbnailSize[] = [
  { id: 'vertical', label: '1080 x 1350', width: 1080, height: 1350, icon: RectangleVertical },
  { id: 'square', label: '1080 x 1080', width: 1080, height: 1080, icon: Square },
  { id: 'smallSquare', label: '542 x 542', width: 542, height: 542, icon: Square },
];

const SAMPLE_SOURCE: PredictionThumbnailSource = {
  title: '5월 13일 프리미어리그 Chelsea vs Arsenal 경기 예측 분석',
  boardSlug: 'foreign-analysis',
  postNumber: 1,
  postUrl: '/boards/foreign-analysis/1',
  fixtureId: 'sample',
  chartData: {
    predictions: {
      percent: { home: '44%', draw: '27%', away: '29%' },
      advice: '홈팀 우세 흐름이지만 무승부 변수도 높습니다.',
      goals: { home: '1.7', away: '1.2' },
      winner: { id: 1, name: 'Chelsea', comment: null },
      under_over: '2.5',
      win_or_draw: true,
    },
    comparison: {
      form: { home: '58%', away: '42%' },
      att: { home: '54%', away: '46%' },
      def: { home: '49%', away: '51%' },
      poisson_distribution: { home: '55%', away: '45%' },
      h2h: { home: '47%', away: '53%' },
      goals: { home: '57%', away: '43%' },
      total: { home: '56%', away: '44%' },
    },
    teams: {
      home: {
        id: 1,
        name: 'Chelsea',
        logo: '',
        last_5: {
          form: '62',
          att: '58',
          def: '51',
          goals: { for: { total: 8, average: 1.6 }, against: { total: 5, average: 1 } },
        },
      },
      away: {
        id: 2,
        name: 'Arsenal',
        logo: '',
        last_5: {
          form: '55',
          att: '53',
          def: '56',
          goals: { for: { total: 7, average: 1.4 }, against: { total: 4, average: 0.8 } },
        },
      },
    },
    h2h: [],
  },
};

const TONES = {
  dark: {
    bg: '#101318',
    bg2: '#171b22',
    panel: '#1f2530',
    panel2: '#252c37',
    text: '#f8fafc',
    muted: '#a7b0bf',
    line: 'rgba(255,255,255,0.12)',
    home: '#38bdf8',
    away: '#34d399',
    draw: '#a3a3a3',
    accent: '#f59e0b',
  },
  light: {
    bg: '#f7f9fc',
    bg2: '#edf2f7',
    panel: '#ffffff',
    panel2: '#f1f5f9',
    text: '#111827',
    muted: '#64748b',
    line: 'rgba(15,23,42,0.12)',
    home: '#0284c7',
    away: '#059669',
    draw: '#737373',
    accent: '#d97706',
  },
};

const POSTER_BACKGROUNDS: Array<{ id: PosterBackground; label: string }> = [
  { id: 'blueGreen', label: '블루그린' },
  { id: 'navy', label: '네이비' },
  { id: 'blackBlue', label: '블랙블루' },
  { id: 'blackGreen', label: '블랙그린' },
  { id: 'charcoal', label: '차콜' },
  { id: 'custom', label: '커스텀' },
];

function getPosterBackground(
  preset: PosterBackground,
  tone: ThumbnailTone,
  customColors: [string, string, string]
): string {
  if (preset === 'custom') {
    const [start, middle, end] = customColors;
    return `radial-gradient(circle at 18% 16%, ${start}66 0%, transparent 58%), radial-gradient(circle at 82% 84%, ${end}66 0%, transparent 58%), linear-gradient(135deg, ${start} 0%, ${middle} 50%, ${end} 100%)`;
  }

  if (tone === 'light') {
    switch (preset) {
      case 'navy':
        return 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 52%, #eff6ff 100%)';
      case 'blackBlue':
        return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 48%, #e5e7eb 100%)';
      case 'blackGreen':
        return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 48%, #e5e7eb 100%)';
      case 'charcoal':
        return 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 48%, #cbd5e1 100%)';
      case 'blueGreen':
      default:
        return 'radial-gradient(circle at 18% 16%, rgba(2,132,199,0.36) 0%, rgba(14,116,144,0.18) 34%, transparent 62%), radial-gradient(circle at 82% 84%, rgba(5,150,105,0.36) 0%, rgba(21,128,61,0.18) 36%, transparent 64%), linear-gradient(135deg, #dbeafe 0%, #ccfbf1 50%, #dcfce7 100%)';
    }
  }

  switch (preset) {
    case 'navy':
      return 'radial-gradient(circle at 18% 16%, rgba(59,130,246,0.2) 0%, transparent 54%), linear-gradient(135deg, #071827 0%, #0b2540 52%, #102a43 100%)';
    case 'blackBlue':
      return 'radial-gradient(circle at 20% 18%, rgba(37,99,235,0.28) 0%, transparent 52%), linear-gradient(135deg, #020617 0%, #0f172a 52%, #082f49 100%)';
    case 'blackGreen':
      return 'radial-gradient(circle at 82% 84%, rgba(34,197,94,0.26) 0%, transparent 56%), linear-gradient(135deg, #020617 0%, #111827 48%, #064e3b 100%)';
    case 'charcoal':
      return 'radial-gradient(circle at 50% 20%, rgba(148,163,184,0.16) 0%, transparent 54%), linear-gradient(135deg, #111827 0%, #1f2937 50%, #0f172a 100%)';
    case 'blueGreen':
    default:
      return 'radial-gradient(circle at 18% 16%, rgba(56,189,248,0.34) 0%, rgba(14,116,144,0.26) 34%, transparent 62%), radial-gradient(circle at 82% 84%, rgba(52,211,153,0.34) 0%, rgba(21,128,61,0.26) 36%, transparent 64%), linear-gradient(135deg, #082f49 0%, #0f4f4f 50%, #064e3b 100%)';
  }
}

function parsePercent(value?: string | number | null): number {
  if (typeof value === 'number') return Math.max(0, Math.min(100, value));
  const parsed = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
}

function displayPercent(value?: string | number | null): string {
  const parsed = parsePercent(value);
  return `${Math.round(parsed)}%`;
}

function safeText(value: unknown, fallback = '-'): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function proxyImage(src?: string | null): string {
  if (!src) return '';
  if (src.startsWith('/')) return src;
  if (!/^https?:\/\//i.test(src)) return src;
  return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

function makeFileName(source: PredictionThumbnailSource | null, size: ThumbnailSize): string {
  const base = source
    ? `${source.boardSlug}-${source.postNumber}-${source.chartData.teams.home.name}-vs-${source.chartData.teams.away.name}`
    : `prediction-thumbnail-${size.width}x${size.height}`;

  return `${base}`
    .replace(/[^\w가-힣-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function normalizeRadarValue(value: number | undefined, maxExpected: number): number {
  if (!value) return 0;
  return Math.min(Math.round((value / maxExpected) * 100), 100);
}

function getRadarRows(data: PredictionChartData) {
  const { teams } = data;

  return [
    { label: '경기력', home: parsePercent(teams.home.last_5?.form), away: parsePercent(teams.away.last_5?.form) },
    { label: '공격력', home: parsePercent(teams.home.last_5?.att), away: parsePercent(teams.away.last_5?.att) },
    { label: '수비력', home: parsePercent(teams.home.last_5?.def), away: parsePercent(teams.away.last_5?.def) },
    {
      label: '승',
      home: normalizeRadarValue(teams.home.league?.fixtures?.wins?.total, 15),
      away: normalizeRadarValue(teams.away.league?.fixtures?.wins?.total, 15),
    },
    {
      label: '무',
      home: normalizeRadarValue(teams.home.league?.fixtures?.draws?.total, 10),
      away: normalizeRadarValue(teams.away.league?.fixtures?.draws?.total, 10),
    },
    {
      label: '패',
      home: normalizeRadarValue(teams.home.league?.fixtures?.loses?.total, 15),
      away: normalizeRadarValue(teams.away.league?.fixtures?.loses?.total, 15),
    },
    {
      label: '득점',
      home: normalizeRadarValue(teams.home.league?.goals?.for?.total?.total, 50),
      away: normalizeRadarValue(teams.away.league?.goals?.for?.total?.total, 50),
    },
    {
      label: '실점',
      home: normalizeRadarValue(teams.home.league?.goals?.against?.total?.total, 50),
      away: normalizeRadarValue(teams.away.league?.goals?.against?.total?.total, 50),
    },
  ];
}

function getThumbnailComparisonRows(data: PredictionChartData) {
  return [
    ['경기력', data.comparison.form],
    ['공격력', data.comparison.att],
    ['수비력', data.comparison.def],
    ['통계예측', data.comparison.poisson_distribution],
    ['상대전적', data.comparison.h2h],
    ['득점력', data.comparison.goals],
    ['종합', data.comparison.total],
  ].map(([label, values]) => ({
    label: String(label),
    home: parsePercent((values as { home?: string }).home),
    away: parsePercent((values as { away?: string }).away),
  }));
}

function TeamLogo({
  src,
  name,
  size,
  color,
  showLogo,
}: {
  src?: string;
  name: string;
  size: number;
  color: string;
  showLogo: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (showLogo && src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.16,
          background: 'linear-gradient(135deg, #38bdf8 0%, #14b8a6 48%, #34d399 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: size * 0.12,
          boxShadow: '0 18px 45px rgba(0,0,0,0.24)',
          flexShrink: 0,
        }}
      >
        <Image
          src={proxyImage(src)}
          alt={name}
          width={size}
          height={size}
          unoptimized
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.16,
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: size * 0.34,
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
}

function PlainTeamLogo({
  src,
  name,
  size,
  color,
  showLogo,
  opacity = 1,
}: {
  src?: string;
  name: string;
  size: number;
  color: string;
  showLogo: boolean;
  opacity?: number;
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (showLogo && src) {
    return (
      <Image
        src={proxyImage(src)}
        alt={name}
        width={size}
        height={size}
        unoptimized
        crossOrigin="anonymous"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          opacity,
          filter: opacity < 1 ? 'grayscale(10%)' : 'drop-shadow(0 20px 34px rgba(0,0,0,0.34))',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 950,
        fontSize: size * 0.36,
        opacity,
        textShadow: '0 18px 32px rgba(0,0,0,0.34)',
      }}
    >
      {initials || '?'}
    </div>
  );
}

function ProbabilityBar({
  data,
  tone,
  compact = false,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  compact?: boolean;
}) {
  const colors = TONES[tone];
  const home = parsePercent(data.predictions.percent.home);
  const draw = parsePercent(data.predictions.percent.draw);
  const away = parsePercent(data.predictions.percent.away);
  const total = Math.max(home + draw + away, 1);

  return (
    <div>
      <div
        style={{
          height: compact ? 18 : 28,
          borderRadius: 999,
          overflow: 'hidden',
          background: colors.panel2,
          display: 'flex',
        }}
      >
        <div style={{ width: `${(home / total) * 100}%`, background: colors.home }} />
        <div style={{ width: `${(draw / total) * 100}%`, background: colors.draw }} />
        <div style={{ width: `${(away / total) * 100}%`, background: colors.away }} />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  color: string;
  tone: ThumbnailTone;
  compact?: boolean;
}) {
  const colors = TONES[tone];

  return (
    <div
      style={{
        flex: 1,
        borderRadius: 18,
        background: colors.panel,
        border: `1px solid ${colors.line}`,
        padding: compact ? '14px 16px' : '24px 18px',
        textAlign: 'center',
      }}
    >
      <div style={{ color, fontSize: compact ? 34 : 52, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div style={{ color: colors.muted, fontSize: compact ? 17 : 24, fontWeight: 700, marginTop: compact ? 7 : 10 }}>{label}</div>
    </div>
  );
}

function PredictionOddsStrip({
  data,
  tone,
  compact = false,
  inline = false,
  inlineSize,
  scale = 1,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  compact?: boolean;
  inline?: boolean;
  inlineSize?: number;
  scale?: number;
}) {
  const colors = TONES[tone];
  const mainSize = inline ? inlineSize ?? (compact ? 14 : 34) : compact ? 28 : 52;
  const drawLabelSize = compact ? 20 : 34;
  const drawValueSize = compact ? 34 : 62;

  if (inline) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: compact ? 8 : Math.round(22 * scale),
          alignItems: 'center',
          width: '100%',
          maxWidth: Math.round(850 * scale),
          margin: '0 auto',
        }}
      >
        <div style={{ color: colors.home, fontSize: mainSize, fontWeight: 950, lineHeight: 1, whiteSpace: 'nowrap' }}>
          홈승 {displayPercent(data.predictions.percent.home)}
        </div>
        <div style={{ color: colors.draw, fontSize: mainSize, fontWeight: 950, lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
          무승부 {displayPercent(data.predictions.percent.draw)}
        </div>
        <div style={{ color: colors.away, fontSize: mainSize, fontWeight: 950, lineHeight: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
          {displayPercent(data.predictions.percent.away)} 원정승
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: compact ? 14 : 24,
        width: '100%',
        maxWidth: compact ? '100%' : 780,
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 16 : 30, alignItems: 'center' }}>
        <div style={{ color: colors.home, fontSize: mainSize, fontWeight: 950, lineHeight: 1, whiteSpace: 'nowrap' }}>
          홈승 {displayPercent(data.predictions.percent.home)}
        </div>
        <div style={{ color: colors.away, fontSize: mainSize, fontWeight: 950, lineHeight: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
          {displayPercent(data.predictions.percent.away)} 원정승
        </div>
      </div>
      <div style={{ display: 'grid', justifyItems: 'center', gap: compact ? 7 : 12 }}>
        <div style={{ color: colors.muted, fontSize: drawLabelSize, fontWeight: 900, lineHeight: 1 }}>무승부</div>
        <div style={{ color: colors.draw, fontSize: drawValueSize, fontWeight: 950, lineHeight: 1 }}>{displayPercent(data.predictions.percent.draw)}</div>
      </div>
    </div>
  );
}

function ComparisonBars({
  data,
  tone,
  limit,
  compact = false,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  limit?: number;
  compact?: boolean;
}) {
  const colors = TONES[tone];
  const rows = getThumbnailComparisonRows(data).slice(0, limit);

  return (
    <div style={{ display: 'grid', gap: compact ? 11 : 18 }}>
      {rows.map((row) => {
        const total = Math.max(row.home + row.away, 1);
        return (
          <div key={row.label} style={{ display: 'grid', gridTemplateColumns: compact ? '54px 1fr 54px' : '80px 1fr 80px', gap: compact ? 10 : 18, alignItems: 'center' }}>
            <div style={{ color: colors.home, fontSize: compact ? 16 : 24, fontWeight: 900, textAlign: 'right' }}>{Math.round(row.home)}%</div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted, fontSize: compact ? 14 : 20, fontWeight: 700, marginBottom: compact ? 5 : 8 }}>
                <span>{row.label}</span>
                <span>{Math.round(row.away)}%</span>
              </div>
              <div style={{ height: compact ? 10 : 18, borderRadius: 999, overflow: 'hidden', background: colors.panel2, display: 'flex' }}>
                <div style={{ width: `${(row.home / total) * 100}%`, background: colors.home }} />
                <div style={{ width: `${(row.away / total) * 100}%`, background: colors.away }} />
              </div>
            </div>
            <div style={{ color: colors.away, fontSize: compact ? 16 : 24, fontWeight: 900 }}>{Math.round(row.away)}%</div>
          </div>
        );
      })}
    </div>
  );
}

function RadarValueRows({
  data,
  tone,
  compact = false,
  scale,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  compact?: boolean;
  scale?: number;
}) {
  const colors = TONES[tone];
  const rows = getRadarRows(data);
  const sizeScale = scale ?? (compact ? 0.5 : 1);
  const rowGap = Math.max(7, Math.round(14 * sizeScale));
  const labelSize = Math.max(11, Math.round(18 * sizeScale));
  const valueSize = Math.max(14, Math.round(23 * sizeScale));
  const barHeight = Math.max(7, Math.round(13 * sizeScale));
  const numberColumn = Math.max(42, Math.round(66 * sizeScale));
  const columnGap = Math.max(8, Math.round(13 * sizeScale));

  return (
    <div style={{ display: 'grid', gap: rowGap }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: 'grid', gap: Math.max(4, Math.round(7 * sizeScale)) }}>
          <div style={{ color: colors.muted, fontSize: labelSize, fontWeight: 800, textAlign: 'center' }}>{row.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `${numberColumn}px 1fr ${numberColumn}px`, gap: columnGap, alignItems: 'center' }}>
            <div style={{ color: colors.home, fontSize: valueSize, fontWeight: 950, textAlign: 'right', lineHeight: 1 }}>{Math.round(row.home)}</div>
            <div style={{ height: barHeight, borderRadius: 999, overflow: 'hidden', background: colors.panel2, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: `${row.home}%`, height: '100%', background: colors.home }} />
              </div>
              <div>
                <div style={{ width: `${row.away}%`, height: '100%', background: colors.away }} />
              </div>
            </div>
            <div style={{ color: colors.away, fontSize: valueSize, fontWeight: 950, lineHeight: 1 }}>{Math.round(row.away)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentH2HMiniBlock({ data, tone, compact = false }: { data: PredictionChartData; tone: ThumbnailTone; compact?: boolean }) {
  const colors = TONES[tone];
  const matches = data.h2h?.slice(0, compact ? 1 : 3) ?? [];

  if (matches.length === 0) {
    return <div style={{ color: colors.muted, fontSize: compact ? 15 : 18, fontWeight: 800 }}>최근 맞대결 데이터 없음</div>;
  }

  return (
    <div style={{ display: 'grid', gap: compact ? 10 : 14 }}>
      {matches.map((match) => {
        const date = match.fixture.date ? match.fixture.date.slice(0, 10) : '-';
        const homeWon = match.teams.home.winner === true;
        const awayWon = match.teams.away.winner === true;

        return (
          <div
            key={match.fixture.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: compact ? 10 : 16,
              alignItems: 'center',
            }}
          >
            <div style={{ minWidth: 0, color: homeWon ? colors.home : colors.text, fontSize: compact ? 16 : 21, fontWeight: homeWon ? 950 : 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.teams.home.name}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: colors.text, fontSize: compact ? 22 : 30, fontWeight: 950, lineHeight: 1 }}>
                {match.goals.home} - {match.goals.away}
              </div>
              <div style={{ color: colors.muted, fontSize: compact ? 11 : 13, fontWeight: 750, marginTop: 5 }}>{date}</div>
            </div>
            <div style={{ minWidth: 0, color: awayWon ? colors.away : colors.text, fontSize: compact ? 16 : 21, fontWeight: awayWon ? 950 : 800, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.teams.away.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ChartTeam = PredictionChartData['teams']['home'];

function valueAt(source: unknown, path: string[], fallback: string | number = '-'): string {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== 'object') return String(fallback);
    current = (current as Record<string, unknown>)[key];
  }
  return String(current ?? fallback);
}

function numAt(source: unknown, path: string[], fallback = 0): number {
  const value = valueAt(source, path, fallback);
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function StatBox({
  label,
  homeValue,
  awayValue,
  tone,
  compact = false,
}: {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  tone: ThumbnailTone;
  compact?: boolean;
}) {
  const colors = TONES[tone];
  return (
    <div style={{ borderRadius: compact ? 14 : 18, background: colors.panel, border: `1px solid ${colors.line}`, padding: compact ? '12px 14px' : '18px 20px' }}>
      <div style={{ color: colors.muted, fontSize: compact ? 13 : 20, fontWeight: 800, marginBottom: compact ? 8 : 12 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 10 : 18 }}>
        <div style={{ color: colors.home, fontSize: compact ? 20 : 34, fontWeight: 950, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeValue}</div>
        <div style={{ color: colors.away, fontSize: compact ? 20 : 34, fontWeight: 950, textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayValue}</div>
      </div>
    </div>
  );
}

function TeamHeader({ data, tone, compact = false, scale = 1 }: { data: PredictionChartData; tone: ThumbnailTone; compact?: boolean; scale?: number }) {
  const colors = TONES[tone];
  const logoSize = compact ? 42 : Math.round(72 * scale);
  const fontSize = compact ? 18 : Math.round(34 * scale);
  const gap = compact ? 10 : Math.round(18 * scale);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: compact ? 10 : Math.round(26 * scale) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap, minWidth: 0 }}>
        <PlainTeamLogo src={data.teams.home.logo} name={data.teams.home.name} size={logoSize} color={colors.home} showLogo />
        <div style={{ minWidth: 0, color: colors.text, fontSize, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.teams.home.name}</div>
      </div>
      <div style={{ color: colors.muted, fontSize: compact ? 14 : Math.round(22 * scale), fontWeight: 950 }}>VS</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap, minWidth: 0 }}>
        <div style={{ minWidth: 0, color: colors.text, fontSize, fontWeight: 900, whiteSpace: 'nowrap', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.teams.away.name}</div>
        <PlainTeamLogo src={data.teams.away.logo} name={data.teams.away.name} size={logoSize} color={colors.away} showLogo />
      </div>
    </div>
  );
}

function RadarComparison({ data, tone, chartSize = 430 }: { data: PredictionChartData; tone: ThumbnailTone; chartSize?: number }) {
  const colors = TONES[tone];
  const rows = getRadarRows(data);
  const size = chartSize;
  const center = size / 2;
  const radius = size * 0.36;
  const labelOffset = size * 0.08;
  const labelSize = Math.max(10, Math.round(size * 0.026));
  const gridStroke = Math.max(0.8, size * 0.0019);
  const radarStroke = Math.max(1.6, size * 0.0046);
  const point = (value: number, index: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / rows.length;
    const distance = radius * (value / 100);
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  };
  const axisPoint = (index: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / rows.length;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (radius + labelOffset),
      labelY: center + Math.sin(angle) * (radius + labelOffset),
    };
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={rows.map((_, index) => {
            const p = axisPoint(index);
            return `${center + (p.x - center) * scale},${center + (p.y - center) * scale}`;
          }).join(' ')}
          fill="none"
          stroke={colors.line}
          strokeWidth={gridStroke}
        />
      ))}
      {rows.map((row, index) => {
        const p = axisPoint(index);
        return (
          <g key={row.label}>
            <line x1={center} y1={center} x2={p.x} y2={p.y} stroke={colors.line} strokeWidth={gridStroke} />
            <text x={p.labelX} y={p.labelY} fill={colors.muted} fontSize={labelSize} fontWeight={800} textAnchor="middle" dominantBaseline="middle">
              {row.label}
            </text>
          </g>
        );
      })}
      <polygon points={rows.map((row, index) => point(row.home, index)).join(' ')} fill={colors.home} fillOpacity={0.34} stroke={colors.home} strokeWidth={radarStroke} />
      <polygon points={rows.map((row, index) => point(row.away, index)).join(' ')} fill={colors.away} fillOpacity={0.3} stroke={colors.away} strokeWidth={radarStroke} />
    </svg>
  );
}

function MinuteBars({ team, tone, color }: { team: ChartTeam; tone: ThumbnailTone; color: string }) {
  const colors = TONES[tone];
  const slots = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];
  const values = slots.map((slot) => numAt(team, ['league', 'goals', 'for', 'minute', slot, 'total']));
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {slots.map((slot, index) => (
        <div key={slot} style={{ display: 'grid', gridTemplateColumns: '62px 1fr 38px', gap: 10, alignItems: 'center' }}>
          <div style={{ color: colors.muted, fontSize: 15, fontWeight: 750 }}>{slot}</div>
          <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', background: colors.panel2 }}>
            <div style={{ width: `${(values[index] / max) * 100}%`, height: '100%', background: color }} />
          </div>
          <div style={{ color: colors.text, fontSize: 16, fontWeight: 850, textAlign: 'right' }}>{values[index]}</div>
        </div>
      ))}
    </div>
  );
}

function VsMark({
  size,
  compact,
}: {
  size: ThumbnailSize;
  compact: boolean;
}) {
  const markWidth = compact ? 285 : size.width === size.height ? 620 : 730;
  const maskUrl = 'url("/icons/vs2.png")';

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: markWidth,
        height: markWidth * 0.86,
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
        pointerEvents: 'none',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-5%',
          width: '110%',
          height: '110%',
          background: 'rgba(255,255,255,0.92)',
          WebkitMaskImage: maskUrl,
          maskImage: maskUrl,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          filter: 'drop-shadow(18px 22px 26px rgba(0,0,0,0.32))',
          zIndex: 1,
        }}
      />
      <div
        aria-label="VS"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: '#000000',
          WebkitMaskImage: maskUrl,
          maskImage: maskUrl,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          filter: 'drop-shadow(10px 14px 18px rgba(0,0,0,0.24))',
          zIndex: 2,
        }}
      />
    </div>
  );
}

function PredictionThumbnail({
  source,
  size,
  template,
  tone,
  showLogo,
  posterBackground,
  posterColors,
}: {
  source: PredictionThumbnailSource;
  size: ThumbnailSize;
  template: ThumbnailTemplate;
  tone: ThumbnailTone;
  showLogo: boolean;
  posterBackground: PosterBackground;
  posterColors: [string, string, string];
}) {
  const colors = TONES[tone];
  const { chartData } = source;
  const home = chartData.teams.home;
  const away = chartData.teams.away;
  const isSmall = size.width <= 600;
  const isSquare = size.width === size.height;
  const unit = size.width / 1080;
  const pad = isSquare ? Math.round(76 * unit) : isSmall ? 34 : 82;
  const logoSize = isSmall ? 72 : template === 'match' ? 150 : template === 'versus' ? 138 : 112;
  const titleSize = isSmall ? 30 : isSquare ? 56 : 58;
  const teamSize = isSmall ? 26 : 42;
  const panelRadius = isSquare ? Math.round(28 * unit) : isSmall ? 16 : 28;
  const background =
    tone === 'dark'
      ? `radial-gradient(circle at 18% 12%, rgba(56,189,248,0.26), transparent 28%), radial-gradient(circle at 88% 18%, rgba(52,211,153,0.2), transparent 24%), linear-gradient(145deg, ${colors.bg}, ${colors.bg2})`
      : `radial-gradient(circle at 18% 12%, rgba(14,165,233,0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(16,185,129,0.16), transparent 24%), linear-gradient(145deg, ${colors.bg}, ${colors.bg2})`;

  const frameStyle = {
    width: size.width,
    height: size.height,
    background,
    color: colors.text,
    fontFamily: 'Arial, "Noto Sans KR", system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: pad,
    boxSizing: 'border-box',
    letterSpacing: 0,
  } satisfies React.CSSProperties;

  if (template === 'versus') {
    const fitNameSize = (name: string, base: number) => {
      const length = name.replace(/\s+/g, '').length;
      if (length > 24) return Math.round(base * 0.48);
      if (length > 20) return Math.round(base * 0.55);
      if (length > 16) return Math.round(base * 0.64);
      if (length > 12) return Math.round(base * 0.76);
      if (length > 9) return Math.round(base * 0.88);
      return base;
    };
    const homeNameSize = fitNameSize(home.name, isSmall ? 34 : isSquare ? 68 : 74);
    const awayNameSize = fitNameSize(away.name, isSmall ? 34 : isSquare ? 68 : 74);
    const badgeSize = isSmall ? 16 : 25;
    const teamBlockWidth = size.width - pad * 2;
    const foregroundLogoSize = isSmall ? 78 : isSquare ? 146 : 158;
    const watermarkLogoSize = isSmall ? 230 : isSquare ? 520 : 620;
    const teamNameStyle = {
      color: colors.text,
      fontFamily: '"Noto Sans KR", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif',
      fontWeight: 850,
      lineHeight: 1.08,
      letterSpacing: 0,
      whiteSpace: 'nowrap',
      textShadow: '0 5px 16px rgba(0,0,0,0.34)',
    } satisfies React.CSSProperties;

    return (
      <div style={frameStyle}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: getPosterBackground(posterBackground, tone, posterColors),
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -watermarkLogoSize * 0.24,
            top: size.height * 0.16,
            width: watermarkLogoSize,
            height: watermarkLogoSize,
            transform: 'rotate(-10deg)',
            zIndex: 1,
          }}
        >
          <PlainTeamLogo
            src={home.logo}
            name={home.name}
            size={watermarkLogoSize}
            color={colors.home}
            showLogo={showLogo}
            opacity={tone === 'dark' ? 0.07 : 0.1}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            right: -watermarkLogoSize * 0.26,
            bottom: size.height * 0.13,
            width: watermarkLogoSize,
            height: watermarkLogoSize,
            transform: 'rotate(10deg)',
            zIndex: 1,
          }}
        >
          <PlainTeamLogo
            src={away.logo}
            name={away.name}
            size={watermarkLogoSize}
            color={colors.away}
            showLogo={showLogo}
            opacity={tone === 'dark' ? 0.07 : 0.1}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: pad,
            top: isSmall ? 24 : 42,
            width: isSmall ? 118 : 210,
            height: isSmall ? 28 : 50,
            zIndex: 4,
          }}
        >
          <Image
            src="/logo/4590football-logo-white.webp"
            alt="4590 Football"
            width={210}
            height={50}
            unoptimized
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'left center',
              opacity: 0.96,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            right: pad,
            top: isSmall ? 24 : 42,
            color: colors.accent,
            fontSize: isSmall ? 15 : 25,
            fontWeight: 950,
            textTransform: 'uppercase',
            zIndex: 4,
          }}
        >
          Match Preview
        </div>
        <VsMark size={size} compact={isSmall} />

        <div
          style={{
            position: 'absolute',
            top: isSmall ? 74 : pad + 58,
            left: pad,
            width: teamBlockWidth,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: isSmall ? 8 : 14,
          }}
        >
          <PlainTeamLogo src={home.logo} name={home.name} size={foregroundLogoSize} color={colors.home} showLogo={showLogo} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: '#ffffff', fontSize: badgeSize, fontWeight: 950, textTransform: 'uppercase', marginBottom: isSmall ? 2 : 5 }}>
              HOME
            </div>
            <div
              style={{
                ...teamNameStyle,
                fontSize: homeNameSize,
                maxWidth: teamBlockWidth - foregroundLogoSize - (isSmall ? 18 : 30),
              }}
            >
              {home.name}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: pad,
            bottom: isSmall ? 74 : pad + 58,
            width: teamBlockWidth,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: isSmall ? 8 : 14,
            textAlign: 'right',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: '#ffffff', fontSize: badgeSize, fontWeight: 950, textTransform: 'uppercase', marginBottom: isSmall ? 2 : 5 }}>
              AWAY
            </div>
            <div
              style={{
                ...teamNameStyle,
                fontSize: awayNameSize,
                maxWidth: teamBlockWidth - foregroundLogoSize - (isSmall ? 18 : 30),
              }}
            >
              {away.name}
            </div>
          </div>
          <PlainTeamLogo src={away.logo} name={away.name} size={foregroundLogoSize} color={colors.away} showLogo={showLogo} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: isSmall ? 14 : 40,
            transform: 'translateX(-50%)',
            color: colors.muted,
            fontSize: isSmall ? 12 : 22,
            fontWeight: 850,
            zIndex: 4,
            textTransform: 'uppercase',
            opacity: isSmall ? 0.86 : 1,
          }}
        >
          4590football.com
        </div>
      </div>
    );
  }

  if (template === 'powerOdds') {
    const squareScale = isSquare ? unit : 1;
    const radarChartSize = isSquare ? Math.round(720 * squareScale) : 870;

    return (
      <div style={frameStyle}>
        <TeamHeader data={chartData} tone={tone} compact={false} scale={squareScale} />
        <div style={{ marginTop: isSquare ? Math.round(16 * squareScale) : 34 }}>
          <PredictionOddsStrip
            data={chartData}
            tone={tone}
            compact={false}
            inline
            inlineSize={isSquare ? Math.round(26 * squareScale) : 34}
            scale={squareScale}
          />
        </div>
        <div style={{ marginTop: isSquare ? Math.round(12 * squareScale) : 32 }}>
          <div style={{ color: colors.accent, fontSize: isSquare ? Math.round(30 * squareScale) : 34, fontWeight: 950 }}>전력비교 레이더</div>
        </div>
        <div style={{ marginTop: isSquare ? Math.round(10 * squareScale) : 24, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSquare ? Math.round(4 * squareScale) : 4 }}>
          <RadarComparison data={chartData} tone={tone} chartSize={radarChartSize} />
        </div>
      </div>
    );
  }

  if (template === 'powerRadar') {
    const valueScale = isSquare ? unit : 1;

    return (
      <div style={frameStyle}>
        <TeamHeader data={chartData} tone={tone} compact={false} scale={valueScale} />
        <div style={{ marginTop: isSquare ? Math.round(42 * valueScale) : 42 }}>
          <div style={{ color: colors.accent, fontSize: isSquare ? Math.round(34 * valueScale) : 34, fontWeight: 950 }}>전력비교 레이더 수치</div>
        </div>
        <div style={{ marginTop: isSquare ? Math.round(52 * valueScale) : 78, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSquare ? Math.round(42 * valueScale) : 42 }}>
          <RadarValueRows data={chartData} tone={tone} scale={valueScale} />
        </div>
      </div>
    );
  }

  if (template === 'comparison') {
    return (
      <div style={frameStyle}>
        <TeamHeader data={chartData} tone={tone} compact={isSmall} />
        <div style={{ marginTop: isSmall ? 24 : 42 }}>
          <div style={{ color: colors.accent, fontSize: isSmall ? 22 : 32, fontWeight: 950, marginBottom: 8 }}>상대 비교지표</div>
          <div style={{ color: colors.muted, fontSize: isSmall ? 14 : 19, fontWeight: 750 }}>게시글 비교 바차트 기준</div>
        </div>
        <div style={{ marginTop: isSmall ? 24 : 52, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSmall ? 18 : 40 }}>
          <ComparisonBars data={chartData} tone={tone} limit={isSmall ? 5 : 7} compact={isSmall} />
        </div>
      </div>
    );
  }

  if (template === 'condition') {
    const homeLeague = home.league;
    const awayLeague = away.league;
    return (
      <div style={frameStyle}>
        <TeamHeader data={chartData} tone={tone} compact={isSmall} />
        <div style={{ marginTop: isSmall ? 20 : 38, color: colors.accent, fontSize: isSmall ? 22 : 28, fontWeight: 950 }}>팀 컨디션</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isSmall ? 12 : 22, marginTop: isSmall ? 18 : 28 }}>
          <StatBox label="최근 5경기 폼" homeValue={safeText(home.last_5?.form)} awayValue={safeText(away.last_5?.form)} tone={tone} compact={isSmall} />
          <StatBox label="최근 5경기 공격" homeValue={safeText(home.last_5?.att)} awayValue={safeText(away.last_5?.att)} tone={tone} compact={isSmall} />
          <StatBox label="최근 5경기 수비" homeValue={safeText(home.last_5?.def)} awayValue={safeText(away.last_5?.def)} tone={tone} compact={isSmall} />
          <StatBox label="시즌 전적" homeValue={`${numAt(home, ['league', 'fixtures', 'wins', 'total'])}승 ${numAt(home, ['league', 'fixtures', 'draws', 'total'])}무 ${numAt(home, ['league', 'fixtures', 'loses', 'total'])}패`} awayValue={`${numAt(away, ['league', 'fixtures', 'wins', 'total'])}승 ${numAt(away, ['league', 'fixtures', 'draws', 'total'])}무 ${numAt(away, ['league', 'fixtures', 'loses', 'total'])}패`} tone={tone} compact={isSmall} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isSmall ? 12 : 22, marginTop: isSmall ? 12 : 22 }}>
          <StatBox label="클린시트" homeValue={valueAt(homeLeague, ['clean_sheet', 'total'])} awayValue={valueAt(awayLeague, ['clean_sheet', 'total'])} tone={tone} compact={isSmall} />
          <StatBox label="무득점 경기" homeValue={valueAt(homeLeague, ['failed_to_score', 'total'])} awayValue={valueAt(awayLeague, ['failed_to_score', 'total'])} tone={tone} compact={isSmall} />
        </div>
        <div style={{ marginTop: isSmall ? 14 : 28, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSmall ? 16 : 28 }}>
          <div style={{ color: colors.muted, fontSize: isSmall ? 14 : 20, fontWeight: 850, marginBottom: isSmall ? 10 : 16 }}>주요 포메이션</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isSmall ? 14 : 24 }}>
            <div style={{ color: colors.home, fontSize: isSmall ? 24 : 36, fontWeight: 950 }}>{valueAt(homeLeague, ['lineups', '0', 'formation'])}</div>
            <div style={{ color: colors.away, fontSize: isSmall ? 24 : 36, fontWeight: 950, textAlign: 'right' }}>{valueAt(awayLeague, ['lineups', '0', 'formation'])}</div>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'goals') {
    return (
      <div style={frameStyle}>
        <TeamHeader data={chartData} tone={tone} compact={isSmall} />
        <div style={{ marginTop: isSmall ? 20 : 38, color: colors.accent, fontSize: isSmall ? 22 : 28, fontWeight: 950 }}>득점 흐름</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isSmall ? 12 : 22, marginTop: isSmall ? 18 : 28 }}>
          <StatBox label="시즌 득점" homeValue={valueAt(home, ['league', 'goals', 'for', 'total', 'total'])} awayValue={valueAt(away, ['league', 'goals', 'for', 'total', 'total'])} tone={tone} compact={isSmall} />
          <StatBox label="시즌 실점" homeValue={valueAt(home, ['league', 'goals', 'against', 'total', 'total'])} awayValue={valueAt(away, ['league', 'goals', 'against', 'total', 'total'])} tone={tone} compact={isSmall} />
          <StatBox label="평균 득점" homeValue={valueAt(home, ['league', 'goals', 'for', 'average', 'total'])} awayValue={valueAt(away, ['league', 'goals', 'for', 'average', 'total'])} tone={tone} compact={isSmall} />
          <StatBox label="최대 승리" homeValue={valueAt(home, ['league', 'biggest', 'wins', 'home'])} awayValue={valueAt(away, ['league', 'biggest', 'wins', 'away'])} tone={tone} compact={isSmall} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: isSmall ? 12 : 22, marginTop: isSmall ? 14 : 24 }}>
          <div style={{ borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSmall ? 14 : 24 }}>
            <div style={{ color: colors.home, fontSize: isSmall ? 14 : 20, fontWeight: 900, marginBottom: isSmall ? 10 : 16 }}>{home.name} 시간대별 득점</div>
            <MinuteBars team={home} tone={tone} color={colors.home} />
          </div>
          {!isSmall && (
            <div style={{ borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: 24 }}>
              <div style={{ color: colors.away, fontSize: 20, fontWeight: 900, marginBottom: 16, textAlign: 'right' }}>{away.name} 시간대별 득점</div>
              <MinuteBars team={away} tone={tone} color={colors.away} />
            </div>
          )}
        </div>
        <div style={{ marginTop: isSmall ? 12 : 24 }}>
          <StatBox label="언더/오버 2.5 득점" homeValue={`O ${valueAt(home, ['league', 'goals', 'for', 'under_over', '2.5', 'over'])} / U ${valueAt(home, ['league', 'goals', 'for', 'under_over', '2.5', 'under'])}`} awayValue={`O ${valueAt(away, ['league', 'goals', 'for', 'under_over', '2.5', 'over'])} / U ${valueAt(away, ['league', 'goals', 'for', 'under_over', '2.5', 'under'])}`} tone={tone} compact={isSmall} />
        </div>
      </div>
    );
  }

  if (template === 'h2h') {
    return (
      <div style={frameStyle}>
        <TeamHeader data={chartData} tone={tone} compact={isSmall} />
        <div style={{ marginTop: isSmall ? 24 : 42 }}>
          <div style={{ color: colors.accent, fontSize: isSmall ? 22 : 32, fontWeight: 950, marginBottom: 8 }}>최근 맞대결</div>
          <div style={{ color: colors.muted, fontSize: isSmall ? 14 : 19, fontWeight: 750 }}>최근 상대전적 스코어</div>
        </div>
        <div style={{ marginTop: isSmall ? 24 : 58, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSmall ? 20 : 44 }}>
          <RecentH2HMiniBlock data={chartData} tone={tone} compact={isSmall} />
        </div>
      </div>
    );
  }

  if (template === 'match') {
    return (
      <div style={frameStyle}>
        <div style={{ color: colors.accent, fontSize: isSmall ? 16 : 24, fontWeight: 900, textTransform: 'uppercase' }}>
          Match Prediction
        </div>
        <div style={{ fontSize: titleSize, fontWeight: 950, lineHeight: 1.06, marginTop: isSmall ? 10 : 18, maxWidth: size.width - pad * 2 }}>
          {home.name} vs {away.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: isSmall ? 14 : 32, alignItems: 'center', marginTop: isSmall ? 28 : isSquare ? 58 : 88 }}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: isSmall ? 12 : 26 }}>
            <TeamLogo src={home.logo} name={home.name} size={logoSize} color={colors.home} showLogo={showLogo} />
            <div style={{ color: colors.text, fontSize: teamSize, fontWeight: 900, textAlign: 'center', lineHeight: 1.1 }}>{home.name}</div>
            <div style={{ color: colors.home, fontSize: isSmall ? 46 : 84, fontWeight: 950, lineHeight: 1 }}>{displayPercent(chartData.predictions.percent.home)}</div>
          </div>
          <div style={{ color: colors.muted, fontSize: isSmall ? 22 : 36, fontWeight: 950, alignSelf: 'center' }}>VS</div>
          <div style={{ display: 'grid', justifyItems: 'center', gap: isSmall ? 12 : 26 }}>
            <TeamLogo src={away.logo} name={away.name} size={logoSize} color={colors.away} showLogo={showLogo} />
            <div style={{ color: colors.text, fontSize: teamSize, fontWeight: 900, textAlign: 'center', lineHeight: 1.1 }}>{away.name}</div>
            <div style={{ color: colors.away, fontSize: isSmall ? 46 : 84, fontWeight: 950, lineHeight: 1 }}>{displayPercent(chartData.predictions.percent.away)}</div>
          </div>
        </div>

        <div style={{ marginTop: isSmall ? 26 : isSquare ? 54 : 82 }}>
          <ProbabilityBar data={chartData} tone={tone} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: isSmall ? 14 : 30, color: colors.muted, fontSize: isSmall ? 17 : 28, fontWeight: 800, marginTop: isSmall ? 14 : 24 }}>
            <span>무승부 {displayPercent(chartData.predictions.percent.draw)}</span>
            {chartData.predictions.under_over && <span>U/O {safeText(chartData.predictions.under_over)}</span>}
          </div>
        </div>

        {!isSmall && (
          <div style={{ marginTop: isSquare ? 54 : 86, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: 34 }}>
            <ComparisonBars data={chartData} tone={tone} limit={isSquare ? 4 : 5} />
          </div>
        )}
      </div>
    );
  }

  if (template === 'clean') {
    return (
      <div style={frameStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <TeamLogo src={home.logo} name={home.name} size={logoSize} color={colors.home} showLogo={showLogo} />
          <div style={{ textAlign: 'center', minWidth: 0 }}>
            <div style={{ color: colors.accent, fontSize: isSmall ? 15 : 22, fontWeight: 900 }}>AI Prediction</div>
            <div style={{ color: colors.text, fontSize: isSmall ? 24 : 38, fontWeight: 950, lineHeight: 1.1, marginTop: 8 }}>
              {home.name} vs {away.name}
            </div>
          </div>
          <TeamLogo src={away.logo} name={away.name} size={logoSize} color={colors.away} showLogo={showLogo} />
        </div>

        <div style={{ display: 'flex', gap: isSmall ? 12 : 24, marginTop: isSmall ? 28 : 62 }}>
          <StatPill label="홈" value={displayPercent(chartData.predictions.percent.home)} color={colors.home} tone={tone} />
          <StatPill label="무" value={displayPercent(chartData.predictions.percent.draw)} color={colors.draw} tone={tone} />
          <StatPill label="원정" value={displayPercent(chartData.predictions.percent.away)} color={colors.away} tone={tone} />
        </div>

        <div style={{ marginTop: isSmall ? 24 : 54, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSmall ? 18 : 34 }}>
          <ComparisonBars data={chartData} tone={tone} limit={isSmall ? 3 : isSquare ? 5 : 7} />
        </div>

        {!isSmall && (
          <div style={{ position: 'absolute', left: pad, right: pad, bottom: pad, color: colors.muted, fontSize: 24, fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
            <span>예상 승자 {safeText(chartData.predictions.winner?.name, '-')}</span>
            <span>{source.postUrl}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={frameStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: colors.muted, fontSize: isSmall ? 16 : 24, fontWeight: 900 }}>
        <span>4590 FOOTBALL</span>
        <span>Prediction Chart</span>
      </div>

      <div style={{ marginTop: isSmall ? 26 : 48, textAlign: 'center' }}>
        <div style={{ color: colors.accent, fontSize: isSmall ? 15 : 24, fontWeight: 900, marginBottom: isSmall ? 8 : 16 }}>경기 예측 분석</div>
        <div style={{ fontSize: titleSize, fontWeight: 950, lineHeight: 1.08 }}>
          {home.name} vs {away.name}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: isSmall ? 14 : 26, marginTop: isSmall ? 28 : isSquare ? 52 : 70 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: isSmall ? 12 : 20, minWidth: 0 }}>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div style={{ color: colors.text, fontSize: teamSize, fontWeight: 900, lineHeight: 1.1 }}>{home.name}</div>
            <div style={{ color: colors.home, fontSize: isSmall ? 34 : 56, fontWeight: 950, lineHeight: 1.05, marginTop: 8 }}>{displayPercent(chartData.predictions.percent.home)}</div>
          </div>
          <TeamLogo src={home.logo} name={home.name} size={logoSize} color={colors.home} showLogo={showLogo} />
        </div>
        <div style={{ color: colors.muted, fontSize: isSmall ? 18 : 30, fontWeight: 950 }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: isSmall ? 12 : 20, minWidth: 0 }}>
          <TeamLogo src={away.logo} name={away.name} size={logoSize} color={colors.away} showLogo={showLogo} />
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ color: colors.text, fontSize: teamSize, fontWeight: 900, lineHeight: 1.1 }}>{away.name}</div>
            <div style={{ color: colors.away, fontSize: isSmall ? 34 : 56, fontWeight: 950, lineHeight: 1.05, marginTop: 8 }}>{displayPercent(chartData.predictions.percent.away)}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: isSmall ? 26 : isSquare ? 52 : 68, borderRadius: panelRadius, background: colors.panel, border: `1px solid ${colors.line}`, padding: isSmall ? 20 : 40 }}>
        <div style={{ display: 'flex', gap: isSmall ? 10 : 22, marginBottom: isSmall ? 20 : 34 }}>
          <StatPill label="홈" value={displayPercent(chartData.predictions.percent.home)} color={colors.home} tone={tone} />
          <StatPill label="무" value={displayPercent(chartData.predictions.percent.draw)} color={colors.draw} tone={tone} />
          <StatPill label="원정" value={displayPercent(chartData.predictions.percent.away)} color={colors.away} tone={tone} />
        </div>
        <ProbabilityBar data={chartData} tone={tone} compact={isSmall} />
      </div>

      {!isSmall && (
        <div style={{ marginTop: isSquare ? 42 : 58, borderRadius: panelRadius, background: 'rgba(0,0,0,0.08)', border: `1px solid ${colors.line}`, padding: 34 }}>
          <ComparisonBars data={chartData} tone={tone} limit={isSquare ? 4 : 6} />
        </div>
      )}

      {!isSquare && !isSmall && (
        <div style={{ position: 'absolute', left: pad, right: pad, bottom: pad, color: colors.muted, fontSize: 24, lineHeight: 1.4, fontWeight: 700 }}>
          {safeText(chartData.predictions.advice, '데이터 기반 경기 흐름과 승률을 정리했습니다.')}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          right: pad,
          bottom: isSmall ? 22 : pad,
          color: colors.muted,
          fontSize: Math.max(13, 20 * unit),
          fontWeight: 800,
          opacity: isSmall ? 0.75 : 1,
        }}
      >
        4590football.com
      </div>
    </div>
  );
}

export default function PredictionThumbnailMaker() {
  const [input, setInput] = useState('');
  const [source, setSource] = useState<PredictionThumbnailSource | null>(null);
  const [sizeId, setSizeId] = useState<ThumbnailSizeId>('vertical');
  const [template, setTemplate] = useState<ThumbnailTemplate>('versus');
  const [tone, setTone] = useState<ThumbnailTone>('dark');
  const [posterBackground, setPosterBackground] = useState<PosterBackground>('blueGreen');
  const [posterColors, setPosterColors] = useState<[string, string, string]>(['#082f49', '#0f4f4f', '#064e3b']);
  const [showLogo, setShowLogo] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const selectedSize = useMemo(
    () => THUMBNAIL_SIZES.find((item) => item.id === sizeId) ?? THUMBNAIL_SIZES[0],
    [sizeId]
  );
  const previewScale = Math.min(1, 540 / selectedSize.width);
  const previewHeight = selectedSize.height * previewScale;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await loadPredictionThumbnailSource(input);
      if (!result.success || !result.source) {
        toast.error(result.error || '예측 차트 데이터를 불러오지 못했습니다.');
        return;
      }
      setSource(result.source);
      toast.success('예측 차트 데이터를 불러왔습니다.');
    });
  };

  const handleSave = async () => {
    if (!thumbnailRef.current || !source) return;

    setIsSaving(true);
    const node = thumbnailRef.current;
    const previousTransform = node.style.transform;
    try {
      const { toPng } = await import('html-to-image');
      node.style.transform = 'none';
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const dataUrl = await toPng(node, {
        width: selectedSize.width,
        height: selectedSize.height,
        canvasWidth: selectedSize.width,
        canvasHeight: selectedSize.height,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: TONES[tone].bg,
      });

      const link = document.createElement('a');
      link.download = `${makeFileName(source, selectedSize)}-${selectedSize.width}x${selectedSize.height}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('thumbnail export failed', error);
      toast.error('이미지 저장에 실패했습니다. 로고 숨김을 켠 뒤 다시 저장해 보세요.');
    } finally {
      node.style.transform = previousTransform;
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F0F0]">예측분석 썸네일</h1>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">게시글 차트 데이터를 썸네일 비율로 다시 렌더링합니다.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSource(SAMPLE_SOURCE)}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-[#333333]"
          >
            <Wand2 className="h-4 w-4" />
            샘플 적용
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!source || isSaving}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F0F0F0] dark:text-gray-900 dark:hover:bg-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PNG 저장
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="게시글 URL 또는 /boards/foreign-analysis/123"
          className="min-h-10 flex-1 rounded-md border border-black/10 bg-white px-3 text-[13px] text-gray-900 outline-none transition focus:border-gray-400 dark:border-white/10 dark:bg-[#262626] dark:text-[#F0F0F0]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-200 dark:hover:bg-[#333333]"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          불러오기
        </button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-5">
          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">비율</h2>
            <div className="grid gap-2">
              {THUMBNAIL_SIZES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSizeId(item.id)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                      sizeId === item.id
                        ? 'border-gray-900 bg-gray-900 text-white dark:border-[#F0F0F0] dark:bg-[#F0F0F0] dark:text-gray-900'
                        : 'border-black/10 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-[#333333]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">템플릿</h2>
            <div className="grid gap-2">
              {[
                ['versus', 'VS 포스터형'],
                ['powerOdds', '전력비교 1'],
                ['powerRadar', '전력비교 2'],
                ['comparison', '상대 비교지표'],
                ['condition', '팀 컨디션'],
                ['goals', '득점 흐름'],
                ['h2h', '최근 맞대결'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTemplate(id as ThumbnailTemplate)}
                  className={`rounded-md border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                    template === id
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-[#F0F0F0] dark:bg-[#F0F0F0] dark:text-gray-900'
                      : 'border-black/10 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-[#333333]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">톤</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['dark', '다크'],
                ['light', '라이트'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTone(id as ThumbnailTone)}
                  className={`rounded-md border px-3 py-2 text-[13px] font-medium transition-colors ${
                    tone === id
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-[#F0F0F0] dark:bg-[#F0F0F0] dark:text-gray-900'
                      : 'border-black/10 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-[#333333]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {template === 'versus' && (
            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">배경</h2>
              <div className="grid gap-2">
                {POSTER_BACKGROUNDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPosterBackground(item.id)}
                    className={`rounded-md border px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                      posterBackground === item.id
                        ? 'border-gray-900 bg-gray-900 text-white dark:border-[#F0F0F0] dark:bg-[#F0F0F0] dark:text-gray-900'
                        : 'border-black/10 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300 dark:hover:bg-[#333333]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {posterBackground === 'custom' && (
                <div className="mt-3 grid gap-2 rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#262626]">
                  {[
                    ['시작', 0],
                    ['중앙', 1],
                    ['끝', 2],
                  ].map(([label, index]) => (
                    <label key={String(index)} className="flex items-center justify-between gap-3 text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      <span>{label}</span>
                      <input
                        type="color"
                        value={posterColors[index as number]}
                        onChange={(event) => {
                          const next = [...posterColors] as [string, string, string];
                          next[index as number] = event.target.value;
                          setPosterColors(next);
                        }}
                        className="h-8 w-14 cursor-pointer rounded border border-black/10 bg-transparent p-0 dark:border-white/10"
                      />
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          <label className="flex items-center justify-between rounded-md border border-black/10 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 dark:border-white/10 dark:bg-[#262626] dark:text-gray-300">
            로고 표시
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(event) => setShowLogo(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>

          {source && (
            <div className="rounded-md bg-[#F5F5F5] p-3 text-[12px] text-gray-600 dark:bg-[#262626] dark:text-gray-400">
              <div className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{source.chartData.teams.home.name} vs {source.chartData.teams.away.name}</div>
              <div className="mt-1">{source.postUrl}</div>
            </div>
          )}
        </aside>

        <section className="min-w-0 overflow-auto rounded-md bg-[#F5F5F5] p-4 dark:bg-[#262626]">
          {source ? (
            <div
              style={{
                width: selectedSize.width * previewScale,
                height: previewHeight,
                margin: '0 auto',
              }}
            >
              <div
                ref={thumbnailRef}
                style={{
                  width: selectedSize.width,
                  height: selectedSize.height,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <PredictionThumbnail
                  source={source}
                  size={selectedSize}
                  template={template}
                  tone={tone}
                  showLogo={showLogo}
                  posterBackground={posterBackground}
                  posterColors={posterColors}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-md border border-dashed border-black/10 bg-white text-center dark:border-white/10 dark:bg-[#1D1D1D]">
              <ImageIcon className="mb-3 h-10 w-10 text-gray-400" />
              <div className="text-[13px] font-medium text-gray-700 dark:text-gray-300">게시글을 불러오거나 샘플을 적용하세요.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
