'use client';

import { FormEvent, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Download, Image as ImageIcon, Loader2, Search, Square, RectangleVertical, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadPredictionThumbnailSource, type PredictionThumbnailSource } from '@/domains/admin/actions/thumbnail';
import type { PredictionChartData } from '@/domains/prediction/components/PredictionChart';
import { localExternalImageProxyUrl } from '@/shared/images/urls';

type ThumbnailSizeId = 'vertical' | 'square' | 'smallSquare';
type ThumbnailTemplate =
  | 'versus'
  | 'powerCompare'
  | 'powerRadar'
  | 'comparison'
  | 'condition'
  | 'goals'
  | 'h2h'
  | 'chart'
  | 'match'
  | 'clean';
type ThumbnailTone = 'dark' | 'light';
type PosterBackground =
  | 'aiVertical'
  | 'aiSquare'
  | 'aiNoVsVertical'
  | 'aiNoVsSquare'
  | 'aiNoVsVertical2'
  | 'blueGreen'
  | 'navy'
  | 'blackBlue'
  | 'blackGreen'
  | 'charcoal'
  | 'custom';

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

const EXPORT_TEMPLATES: Array<{ id: ThumbnailTemplate; label: string }> = [
  { id: 'versus', label: 'VS 포스터형' },
  { id: 'powerCompare', label: '전력비교 1' },
  { id: 'powerRadar', label: '전력비교 2' },
  { id: 'comparison', label: '상대 비교지표' },
  { id: 'condition', label: '팀 컨디션' },
  { id: 'goals', label: '득점 흐름' },
  { id: 'h2h', label: '최근 맞대결' },
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
    panelGlass: 'rgba(31,37,48,0.74)',
    panel2: '#252c37',
    panel2Glass: 'rgba(37,44,55,0.58)',
    text: '#ffffff',
    muted: '#d7deea',
    line: 'rgba(255,255,255,0.2)',
    home: '#2ec7ff',
    away: '#2ff0a7',
    draw: '#d4d4d8',
    accent: '#ffb020',
  },
  light: {
    bg: '#f7f9fc',
    bg2: '#edf2f7',
    panel: '#ffffff',
    panelGlass: 'rgba(255,255,255,0.78)',
    panel2: '#f1f5f9',
    panel2Glass: 'rgba(241,245,249,0.64)',
    text: '#07111f',
    muted: '#334155',
    line: 'rgba(15,23,42,0.18)',
    home: '#0369a1',
    away: '#047857',
    draw: '#52525b',
    accent: '#c76500',
  },
};

const POSTER_BACKGROUNDS: Array<{ id: PosterBackground; label: string }> = [
  { id: 'aiVertical', label: 'AI 포스터 세로' },
  { id: 'aiSquare', label: 'AI 포스터 정사각' },
  { id: 'aiNoVsVertical', label: 'AI 배경 세로' },
  { id: 'aiNoVsSquare', label: 'AI 배경 정사각' },
  { id: 'aiNoVsVertical2', label: 'AI 배경 세로 2' },
  { id: 'blueGreen', label: '블루그린' },
  { id: 'navy', label: '네이비' },
  { id: 'blackBlue', label: '블랙블루' },
  { id: 'blackGreen', label: '블랙그린' },
  { id: 'charcoal', label: '차콜' },
  { id: 'custom', label: '커스텀' },
];

const POSTER_IMAGE_BACKGROUNDS: Partial<Record<PosterBackground, string>> = {
  aiVertical: '/images/prediction-poster-vs-vertical.png',
  aiSquare: '/images/prediction-poster-vs-square.png',
  aiNoVsVertical: '/images/prediction-template-bg-vertical.png',
  aiNoVsSquare: '/images/prediction-template-bg-square.png',
  aiNoVsVertical2: '/images/prediction-template-bg-vertical-2.png?v=20260513-151654-small',
};

function getPosterImageBackground(background: PosterBackground, size: ThumbnailSize): string | undefined {
  if (background === 'aiNoVsVertical2') {
    return size.width <= 600
      ? '/images/prediction-template-bg-vertical-2.png?v=20260513-151654-small'
      : '/images/prediction-template-bg-vertical-2-large.png?v=20260513-151654-large';
  }

  return POSTER_IMAGE_BACKGROUNDS[background];
}

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
  return localExternalImageProxyUrl(src);
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

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function dateToDosParts(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function createZipBlob(files: Array<{ name: string; bytes: Uint8Array }>): Blob {
  const encoder = new TextEncoder();
  const now = dateToDosParts(new Date());
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.bytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, now.time, true);
    localView.setUint16(12, now.date, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, file.bytes.length, true);
    localView.setUint32(22, file.bytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, file.bytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, now.time, true);
    centralView.setUint16(14, now.date, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, file.bytes.length, true);
    centralView.setUint32(24, file.bytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + file.bytes.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);

  const blobParts = [...localParts, centralDirectory, endHeader].map(toArrayBuffer);
  return new Blob(blobParts, { type: 'application/zip' });
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

function GradientTeamLogo({
  src,
  name,
  size,
  color,
  opacity = 0.22,
}: {
  src?: string;
  name: string;
  size: number;
  color: string;
  opacity?: number;
}) {
  if (src) {
    return (
      <div
        aria-label={name}
        style={{
          width: size,
          height: size,
          opacity,
          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${color} 42%, transparent 76%), linear-gradient(135deg, ${color}, rgba(255,255,255,0.9))`,
          WebkitMaskImage: `url("${proxyImage(src)}")`,
          maskImage: `url("${proxyImage(src)}")`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          filter: `drop-shadow(0 ${size * 0.04}px ${size * 0.08}px ${color}66)`,
        }}
      />
    );
  }

  return <PlainTeamLogo src={src} name={name} size={size} color={color} showLogo opacity={opacity} />;
}

function ComparisonBars({
  data,
  tone,
  limit,
  compact = false,
  scale,
  fullBar = false,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  limit?: number;
  compact?: boolean;
  scale?: number;
  fullBar?: boolean;
}) {
  const colors = TONES[tone];
  const rows = getThumbnailComparisonRows(data).slice(0, limit);
  const sizeScale = scale ?? (compact ? 0.5 : 1);
  const rowGap = (fullBar ? 24 : 14) * sizeScale;
  const labelGap = (fullBar ? 10 : 7) * sizeScale;
  const labelSize = 18 * sizeScale;
  const valueSize = 23 * sizeScale;
  const barHeight = 13 * sizeScale;
  const numberColumn = 66 * sizeScale;
  const columnGap = 13 * sizeScale;

  return (
    <div style={{ display: 'grid', gap: rowGap, width: '100%' }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: 'grid', gap: labelGap }}>
          <div style={{ color: colors.muted, fontSize: labelSize, fontWeight: 800, textAlign: 'center' }}>{row.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: `${numberColumn}px 1fr ${numberColumn}px`, gap: columnGap, alignItems: 'center' }}>
            <div style={{ color: colors.home, fontSize: valueSize, fontWeight: 950, textAlign: 'right', lineHeight: 1 }}>{Math.round(row.home)}%</div>
            {fullBar ? (
              <div style={{ height: barHeight, borderRadius: 999, overflow: 'hidden', background: colors.panel2, display: 'flex' }}>
                <div style={{ width: `${row.home}%`, background: colors.home }} />
                <div style={{ width: `${row.away}%`, background: colors.away }} />
              </div>
            ) : (
              <div style={{ height: barHeight, borderRadius: 999, overflow: 'hidden', background: colors.panel2, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: `${row.home}%`, height: '100%', background: colors.home }} />
                </div>
                <div>
                  <div style={{ width: `${row.away}%`, height: '100%', background: colors.away }} />
                </div>
              </div>
            )}
            <div style={{ color: colors.away, fontSize: valueSize, fontWeight: 950, lineHeight: 1 }}>{Math.round(row.away)}%</div>
          </div>
        </div>
      ))}
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
  const rowGap = 14 * sizeScale;
  const labelGap = 7 * sizeScale;
  const labelSize = 18 * sizeScale;
  const valueSize = 23 * sizeScale;
  const barHeight = 13 * sizeScale;
  const numberColumn = 66 * sizeScale;
  const columnGap = 13 * sizeScale;

  return (
    <div style={{ display: 'grid', gap: rowGap, width: '100%' }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: 'grid', gap: labelGap }}>
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

function RecentH2HMiniBlock({ data, tone, scale = 1 }: { data: PredictionChartData; tone: ThumbnailTone; scale?: number }) {
  const colors = TONES[tone];
  const matches = data.h2h?.slice(0, 5) ?? [];
  const rowGap = 20 * scale;
  const teamSize = 24 * scale;
  const scoreSize = 34 * scale;
  const dateSize = 18 * scale;
  const gap = 22 * scale;
  const rowPadding = 8 * scale;

  if (matches.length === 0) {
    return <div style={{ color: colors.muted, fontSize: 18 * scale, fontWeight: 800 }}>최근 맞대결 데이터 없음</div>;
  }

  return (
    <div style={{ display: 'grid', gap: rowGap }}>
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
              gap,
              alignItems: 'center',
              padding: `${rowPadding}px 0`,
            }}
          >
            <div style={{ minWidth: 0, color: homeWon ? colors.home : colors.text, fontSize: teamSize, fontWeight: homeWon ? 950 : 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.teams.home.name}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: colors.text, fontSize: scoreSize, fontWeight: 950, lineHeight: 1 }}>
                {match.goals.home} - {match.goals.away}
              </div>
              <div style={{ color: colors.muted, fontSize: dateSize, fontWeight: 800, marginTop: 8 * scale }}>{date}</div>
            </div>
            <div style={{ minWidth: 0, color: awayWon ? colors.away : colors.text, fontSize: teamSize, fontWeight: awayWon ? 950 : 800, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.teams.away.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

function TeamConditionTable({
  data,
  tone,
  scale = 1,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  scale?: number;
}) {
  const colors = TONES[tone];
  const home = data.teams.home;
  const away = data.teams.away;
  const homeLeague = home.league;
  const awayLeague = away.league;
  const rows = [
    { label: '최근 5경기 폼', home: safeText(home.last_5?.form), away: safeText(away.last_5?.form) },
    { label: '최근 5경기 공격', home: safeText(home.last_5?.att), away: safeText(away.last_5?.att) },
    { label: '최근 5경기 수비', home: safeText(home.last_5?.def), away: safeText(away.last_5?.def) },
    {
      label: '시즌 전적',
      home: `${numAt(home, ['league', 'fixtures', 'wins', 'total'])}승 ${numAt(home, ['league', 'fixtures', 'draws', 'total'])}무 ${numAt(home, ['league', 'fixtures', 'loses', 'total'])}패`,
      away: `${numAt(away, ['league', 'fixtures', 'wins', 'total'])}승 ${numAt(away, ['league', 'fixtures', 'draws', 'total'])}무 ${numAt(away, ['league', 'fixtures', 'loses', 'total'])}패`,
    },
    { label: '클린시트', home: valueAt(homeLeague, ['clean_sheet', 'total']), away: valueAt(awayLeague, ['clean_sheet', 'total']) },
    { label: '무득점 경기', home: valueAt(homeLeague, ['failed_to_score', 'total']), away: valueAt(awayLeague, ['failed_to_score', 'total']) },
    { label: '주요 포메이션', home: valueAt(homeLeague, ['lineups', '0', 'formation']), away: valueAt(awayLeague, ['lineups', '0', 'formation']) },
  ];
  const headerSize = 22 * scale;
  const labelSize = 23 * scale;
  const valueSize = 27 * scale;
  const rowPadding = 18 * scale;
  const gap = 22 * scale;

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,0.95fr) minmax(0,1fr)',
          gap,
          color: colors.muted,
          fontSize: headerSize,
          fontWeight: 900,
          padding: `0 ${rowPadding}px ${rowPadding}px`,
        }}
      >
        <div style={{ color: colors.home, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home.name}</div>
        <div style={{ textAlign: 'center' }}>항목</div>
        <div style={{ color: colors.away, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away.name}</div>
      </div>
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,0.95fr) minmax(0,1fr)',
            gap,
            alignItems: 'center',
            padding: `${rowPadding}px`,
            borderTop: `1px solid ${colors.line}`,
            background: index % 2 === 1 ? colors.panel2Glass : 'transparent',
          }}
        >
          <div style={{ color: colors.home, fontSize: valueSize, fontWeight: 950, whiteSpace: 'nowrap' }}>{row.home}</div>
          <div style={{ color: colors.muted, fontSize: labelSize, fontWeight: 850, textAlign: 'center', lineHeight: 1.15 }}>{row.label}</div>
          <div style={{ color: colors.away, fontSize: valueSize, fontWeight: 950, textAlign: 'right', whiteSpace: 'nowrap' }}>{row.away}</div>
        </div>
      ))}
    </div>
  );
}

function GoalsFlowTable({
  data,
  tone,
  scale = 1,
}: {
  data: PredictionChartData;
  tone: ThumbnailTone;
  scale?: number;
}) {
  const colors = TONES[tone];
  const home = data.teams.home;
  const away = data.teams.away;
  const minuteSlots = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];
  const summaryRows = [
    { label: '시즌 득점', home: valueAt(home, ['league', 'goals', 'for', 'total', 'total']), away: valueAt(away, ['league', 'goals', 'for', 'total', 'total']) },
    { label: '시즌 실점', home: valueAt(home, ['league', 'goals', 'against', 'total', 'total']), away: valueAt(away, ['league', 'goals', 'against', 'total', 'total']) },
    { label: '평균 득점', home: valueAt(home, ['league', 'goals', 'for', 'average', 'total']), away: valueAt(away, ['league', 'goals', 'for', 'average', 'total']) },
    {
      label: '언더/오버 2.5',
      home: `O ${valueAt(home, ['league', 'goals', 'for', 'under_over', '2.5', 'over'])} / U ${valueAt(home, ['league', 'goals', 'for', 'under_over', '2.5', 'under'])}`,
      away: `O ${valueAt(away, ['league', 'goals', 'for', 'under_over', '2.5', 'over'])} / U ${valueAt(away, ['league', 'goals', 'for', 'under_over', '2.5', 'under'])}`,
    },
  ];
  const minuteRows = minuteSlots.map((slot) => ({
    label: slot,
    home: numAt(home, ['league', 'goals', 'for', 'minute', slot, 'total']),
    away: numAt(away, ['league', 'goals', 'for', 'minute', slot, 'total']),
  }));
  const headerSize = 20 * scale;
  const labelSize = 16 * scale;
  const valueSize = 23 * scale;
  const minuteLabelSize = 15 * scale;
  const minuteValueSize = 18 * scale;
  const rowPaddingY = 10 * scale;
  const rowPaddingX = 18 * scale;
  const gap = 20 * scale;
  const chartGap = 10 * scale;
  const minuteLabelGap = 5 * scale;
  const barHeight = 10 * scale;
  const numberColumn = 38 * scale;
  const columnGap = 10 * scale;
  const maxMinute = Math.max(...minuteRows.flatMap((row) => [row.home, row.away]), 1);

  return (
    <div style={{ display: 'grid', gap: 20 * scale }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,0.9fr) minmax(0,1fr)',
          gap,
          color: colors.muted,
          fontSize: headerSize,
          fontWeight: 900,
          padding: `0 ${rowPaddingX}px ${rowPaddingY}px`,
        }}
      >
        <div style={{ color: colors.home, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home.name}</div>
        <div style={{ textAlign: 'center' }}>항목</div>
        <div style={{ color: colors.away, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away.name}</div>
      </div>
      <div style={{ borderTop: `1px solid ${colors.line}` }}>
        {summaryRows.map((row, index) => (
          <div
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(0,0.9fr) minmax(0,1fr)',
              gap,
              alignItems: 'center',
              padding: `${rowPaddingY}px ${rowPaddingX}px`,
              borderBottom: index === summaryRows.length - 1 ? 'none' : `1px solid ${colors.line}`,
              background: index % 2 === 1 ? colors.panel2Glass : 'transparent',
            }}
          >
            <div style={{ color: colors.home, fontSize: valueSize, fontWeight: 950, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.home}</div>
            <div style={{ color: colors.muted, fontSize: labelSize, fontWeight: 850, textAlign: 'center', lineHeight: 1.15 }}>{row.label}</div>
            <div style={{ color: colors.away, fontSize: valueSize, fontWeight: 950, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.away}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: chartGap, padding: `0 ${rowPaddingX}px ${rowPaddingY}px`, width: '100%' }}>
        <div style={{ color: colors.muted, fontSize: labelSize, fontWeight: 900, textAlign: 'center' }}>시간대별 득점</div>
        {minuteRows.map((row) => (
          <div key={row.label} style={{ display: 'grid', gap: minuteLabelGap }}>
            <div style={{ color: colors.muted, fontSize: minuteLabelSize, fontWeight: 850, textAlign: 'center', lineHeight: 1 }}>{row.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `${numberColumn}px 1fr ${numberColumn}px`, gap: columnGap, alignItems: 'center' }}>
              <div style={{ color: colors.home, fontSize: minuteValueSize, fontWeight: 950, textAlign: 'right', lineHeight: 1 }}>{row.home}</div>
              <div style={{ height: barHeight, borderRadius: 999, overflow: 'hidden', background: colors.panel2, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: `${(row.home / maxMinute) * 100}%`, height: '100%', background: colors.home }} />
                </div>
                <div>
                  <div style={{ width: `${(row.away / maxMinute) * 100}%`, height: '100%', background: colors.away }} />
                </div>
              </div>
              <div style={{ color: colors.away, fontSize: minuteValueSize, fontWeight: 950, lineHeight: 1 }}>{row.away}</div>
            </div>
          </div>
        ))}
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

function DataTopBrand({ tone, scale = 1 }: { tone: ThumbnailTone; scale?: number }) {
  const logoWidth = 236 * scale;
  const logoHeight = 58 * scale;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          right: 24 * scale,
          top: 22 * scale,
          zIndex: 8,
          color: '#2ff06d',
          fontSize: 22 * scale,
          fontWeight: 950,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textAlign: 'right',
          textTransform: 'uppercase',
          textShadow: tone === 'dark' ? '0 0 10px rgba(47,240,109,0.34)' : 'none',
        }}
      >
        MATCH PREVIEW
      </div>
      <div
        style={{
          position: 'absolute',
          left: 24 * scale,
          top: 18 * scale,
          zIndex: 8,
          width: logoWidth,
          height: logoHeight,
          pointerEvents: 'none',
        }}
      >
        <Image
          src={tone === 'dark' ? '/logo/4590football-logo-white.webp' : '/logo/4590football-logo.png'}
          alt="4590 Football"
          width={236}
          height={58}
          unoptimized
          crossOrigin="anonymous"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'left center',
            opacity: tone === 'dark' ? 0.94 : 0.86,
            filter: tone === 'dark' ? 'drop-shadow(0 5px 12px rgba(0,0,0,0.28))' : 'none',
          }}
        />
      </div>
    </>
  );
}

function DataBottomBrand({ tone, scale = 1 }: { tone: ThumbnailTone; scale?: number }) {
  const colors = TONES[tone];

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 30 * scale,
        zIndex: 8,
        color: tone === 'dark' ? 'rgba(255,255,255,0.82)' : colors.muted,
        fontFamily: '"Montserrat", "Avenir Next", "Century Gothic", Arial, sans-serif',
        fontSize: Math.max(10, 19 * scale),
        fontWeight: 300,
        letterSpacing: '0.36em',
        lineHeight: 1,
        textAlign: 'center',
        textTransform: 'uppercase',
        textShadow: tone === 'dark' ? '0 2px 10px rgba(0,0,0,0.36)' : 'none',
        pointerEvents: 'none',
      }}
    >
      4590FOOTBALL.COM
    </div>
  );
}

function PowerCompareHeader({ data, tone, scale = 1 }: { data: PredictionChartData; tone: ThumbnailTone; scale?: number }) {
  const colors = TONES[tone];
  const logoSize = Math.round(72 * scale);
  const teamSize = Math.round(34 * scale);
  const percentSize = 22 * scale;
  const vsSize = Math.round(22 * scale);
  const gap = Math.round(18 * scale);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: Math.round(26 * scale) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap, minWidth: 0 }}>
        <PlainTeamLogo src={data.teams.home.logo} name={data.teams.home.name} size={logoSize} color={colors.home} showLogo />
        <div style={{ minWidth: 0, color: colors.text, fontSize: teamSize, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.teams.home.name}</div>
        <div style={{ color: colors.home, fontSize: percentSize, fontWeight: 950, lineHeight: 1, whiteSpace: 'nowrap' }}>{displayPercent(data.predictions.percent.home)}</div>
      </div>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 5 * scale, minWidth: 74 * scale }}>
        <div style={{ color: colors.draw, fontSize: percentSize, fontWeight: 950, lineHeight: 1 }}>{displayPercent(data.predictions.percent.draw)}</div>
        <div style={{ color: colors.muted, fontSize: vsSize, fontWeight: 950, lineHeight: 1 }}>VS</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap, minWidth: 0 }}>
        <div style={{ color: colors.away, fontSize: percentSize, fontWeight: 950, lineHeight: 1, whiteSpace: 'nowrap' }}>{displayPercent(data.predictions.percent.away)}</div>
        <div style={{ minWidth: 0, color: colors.text, fontSize: teamSize, fontWeight: 900, whiteSpace: 'nowrap', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.teams.away.name}</div>
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

function RadarLegend({ data, tone, scale = 1 }: { data: PredictionChartData; tone: ThumbnailTone; scale?: number }) {
  const colors = TONES[tone];
  const fontSize = 18 * scale;
  const gap = 10 * scale;
  const lineWidth = 38 * scale;
  const lineHeight = 3 * scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: 26 * scale,
        bottom: 26 * scale,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap,
        color: colors.text,
        fontSize,
        fontWeight: 850,
        lineHeight: 1,
        pointerEvents: 'none',
      }}
    >
      {[
        { name: data.teams.home.name, color: colors.home },
        { name: data.teams.away.name, color: colors.away },
      ].map((team) => (
        <div key={team.name} style={{ display: 'grid', gridTemplateColumns: `${lineWidth}px minmax(0, ${210 * scale}px)`, alignItems: 'center', gap: 8 * scale }}>
          <span style={{ width: lineWidth, height: lineHeight, borderRadius: 999, background: team.color, flex: '0 0 auto' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
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
  const contentScale = unit;
  const pad = template === 'versus' ? (isSquare ? Math.round(76 * unit) : isSmall ? 34 : 82) : Math.round((isSquare ? 92 : 98) * unit);
  const topPad = template === 'versus' ? pad : pad + Math.round(26 * unit);
  const logoSize = isSmall ? 72 : template === 'match' ? 150 : template === 'versus' ? 138 : 112;
  const titleSize = isSmall ? 30 : isSquare ? 56 : 58;
  const teamSize = isSmall ? 26 : 42;
  const panelRadius = Math.round(28 * contentScale);
  const selectedPosterImage = getPosterImageBackground(posterBackground, size);
  const backgroundImage =
    selectedPosterImage
      ? tone === 'dark'
        ? `linear-gradient(145deg, rgba(5,8,13,0.54), rgba(5,10,18,0.72)), url("${selectedPosterImage}")`
        : `linear-gradient(145deg, rgba(255,255,255,0.34), rgba(241,245,249,0.58)), url("${selectedPosterImage}")`
      : tone === 'dark'
      ? `radial-gradient(circle at 18% 12%, rgba(56,189,248,0.26), transparent 28%), radial-gradient(circle at 88% 18%, rgba(52,211,153,0.2), transparent 24%), linear-gradient(145deg, ${colors.bg}, ${colors.bg2})`
      : `radial-gradient(circle at 18% 12%, rgba(14,165,233,0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(16,185,129,0.16), transparent 24%), linear-gradient(145deg, ${colors.bg}, ${colors.bg2})`;

  const frameStyle = {
    width: size.width,
    height: size.height,
    backgroundColor: colors.bg,
    backgroundImage,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: colors.text,
    fontFamily: 'Arial, "Noto Sans KR", system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: `${topPad}px ${pad}px ${pad}px`,
    boxSizing: 'border-box',
    letterSpacing: 0,
  } satisfies React.CSSProperties;
  const sectionTitleSize = 32 * contentScale;
  const sectionTitleTop = 44 * contentScale;
  const sectionTitleWeight = 950;
  const dataPanelTop = 34 * contentScale;
  const dataTopBrand = <DataTopBrand tone={tone} scale={contentScale} />;
  const dataBottomBrand = <DataBottomBrand tone={tone} scale={contentScale} />;
  const panelStyle = {
    background: colors.panelGlass,
    border: `1px solid ${colors.line}`,
    boxShadow: tone === 'dark' ? '0 22px 52px rgba(0,0,0,0.2)' : '0 18px 44px rgba(15,23,42,0.1)',
    textShadow: tone === 'dark' ? '0 2px 8px rgba(0,0,0,0.28)' : 'none',
  } satisfies React.CSSProperties;
  const comparisonPanelLayout = (scale: number) => ({
    ...panelStyle,
    borderRadius: panelRadius,
    padding: `${58 * scale}px ${42 * scale}px`,
    minHeight: 560 * scale,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }) satisfies React.CSSProperties;

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
    const posterImage = getPosterImageBackground(posterBackground, size);
    const isImagePoster = Boolean(posterImage);
    const imagePosterLogoSize = isSmall ? 84 : isSquare ? 168 : 176;
    const imagePosterWatermarkSize = isSmall ? 260 : isSquare ? 560 : 640;
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
        {posterImage ? (
          <Image
            src={posterImage}
            alt=""
            fill
            unoptimized
            priority
            style={{ objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: getPosterBackground(posterBackground, tone, posterColors),
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: isImagePoster ? -imagePosterWatermarkSize * 0.16 : -watermarkLogoSize * 0.24,
            top: isImagePoster ? size.height * 0.12 : size.height * 0.16,
            width: isImagePoster ? imagePosterWatermarkSize : watermarkLogoSize,
            height: isImagePoster ? imagePosterWatermarkSize : watermarkLogoSize,
            transform: isImagePoster ? 'rotate(-7deg)' : 'rotate(-10deg)',
            zIndex: 1,
          }}
        >
          {isImagePoster ? (
            <GradientTeamLogo src={home.logo} name={home.name} size={imagePosterWatermarkSize} color={colors.home} opacity={0.2} />
          ) : (
            <PlainTeamLogo
              src={home.logo}
              name={home.name}
              size={watermarkLogoSize}
              color={colors.home}
              showLogo={showLogo}
              opacity={tone === 'dark' ? 0.07 : 0.1}
            />
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            right: isImagePoster ? -imagePosterWatermarkSize * 0.18 : -watermarkLogoSize * 0.26,
            bottom: isImagePoster ? size.height * 0.09 : size.height * 0.13,
            width: isImagePoster ? imagePosterWatermarkSize : watermarkLogoSize,
            height: isImagePoster ? imagePosterWatermarkSize : watermarkLogoSize,
            transform: isImagePoster ? 'rotate(7deg)' : 'rotate(10deg)',
            zIndex: 1,
          }}
        >
          {isImagePoster ? (
            <GradientTeamLogo src={away.logo} name={away.name} size={imagePosterWatermarkSize} color={colors.away} opacity={0.2} />
          ) : (
            <PlainTeamLogo
              src={away.logo}
              name={away.name}
              size={watermarkLogoSize}
              color={colors.away}
              showLogo={showLogo}
              opacity={tone === 'dark' ? 0.07 : 0.1}
            />
          )}
        </div>
        
        {!isImagePoster && <VsMark size={size} compact={isSmall} />}

        <div
          style={{
            position: 'absolute',
            top: isImagePoster ? size.height * 0.22 : isSmall ? 74 : pad + 58,
            left: pad,
            width: teamBlockWidth,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: isImagePoster ? 18 * unit : isSmall ? 8 : 14,
          }}
        >
          <PlainTeamLogo src={home.logo} name={home.name} size={isImagePoster ? imagePosterLogoSize : foregroundLogoSize} color={colors.home} showLogo={showLogo} />
          <div style={{ minWidth: 0, flex: 1 }}>
            {!isImagePoster && (
              <div style={{ color: '#ffffff', fontSize: badgeSize, fontWeight: 950, textTransform: 'uppercase', marginBottom: isSmall ? 2 : 5 }}>
                HOME
              </div>
            )}
            <div
              style={{
                ...teamNameStyle,
                fontSize: isImagePoster ? fitNameSize(home.name, isSmall ? 40 : isSquare ? 72 : 80) : homeNameSize,
                maxWidth: teamBlockWidth - (isImagePoster ? imagePosterLogoSize : foregroundLogoSize) - (isSmall ? 18 : 30),
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
            bottom: isImagePoster ? size.height * 0.18 : isSmall ? 74 : pad + 58,
            width: teamBlockWidth,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: isImagePoster ? 18 * unit : isSmall ? 8 : 14,
            textAlign: 'right',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {!isImagePoster && (
              <div style={{ color: '#ffffff', fontSize: badgeSize, fontWeight: 950, textTransform: 'uppercase', marginBottom: isSmall ? 2 : 5 }}>
                AWAY
              </div>
            )}
            <div
              style={{
                ...teamNameStyle,
                fontSize: isImagePoster ? fitNameSize(away.name, isSmall ? 40 : isSquare ? 72 : 80) : awayNameSize,
                maxWidth: teamBlockWidth - (isImagePoster ? imagePosterLogoSize : foregroundLogoSize) - (isSmall ? 18 : 30),
              }}
            >
              {away.name}
            </div>
          </div>
          <PlainTeamLogo src={away.logo} name={away.name} size={isImagePoster ? imagePosterLogoSize : foregroundLogoSize} color={colors.away} showLogo={showLogo} />
        </div>

      </div>
    );
  }

  if (template === 'powerCompare') {
    const squareScale = contentScale;
    const radarChartSize = isSquare ? Math.round(650 * squareScale) : 760;

    return (
      <div style={frameStyle}>
        {dataTopBrand}
        {dataBottomBrand}
        <PowerCompareHeader data={chartData} tone={tone} scale={squareScale} />
        <div style={{ marginTop: sectionTitleTop }}>
          <div style={{ color: colors.accent, fontSize: sectionTitleSize, fontWeight: sectionTitleWeight }}>전력비교 레이더</div>
        </div>
        <div style={{ ...panelStyle, position: 'relative', marginTop: dataPanelTop, borderRadius: panelRadius, padding: 12 * squareScale }}>
          <RadarLegend data={chartData} tone={tone} scale={squareScale} />
          <RadarComparison data={chartData} tone={tone} chartSize={radarChartSize} />
        </div>
      </div>
    );
  }

  if (template === 'powerRadar') {
    const valueScale = contentScale;
    const titleSize = sectionTitleSize;
    const titleTop = sectionTitleTop;
    const panelTop = dataPanelTop;

    return (
      <div style={frameStyle}>
        {dataTopBrand}
        {dataBottomBrand}
        <TeamHeader data={chartData} tone={tone} compact={false} scale={contentScale} />
        <div style={{ marginTop: titleTop }}>
          <div style={{ color: colors.accent, fontSize: titleSize, fontWeight: sectionTitleWeight }}>전력비교 레이더 수치</div>
        </div>
        <div style={{ ...comparisonPanelLayout(valueScale), marginTop: panelTop }}>
          <RadarValueRows data={chartData} tone={tone} scale={valueScale} />
        </div>
      </div>
    );
  }

  if (template === 'comparison') {
    const comparisonScale = contentScale;
    const titleSize = sectionTitleSize;
    const titleTop = sectionTitleTop;
    const panelTop = dataPanelTop;

    return (
      <div style={frameStyle}>
        {dataTopBrand}
        {dataBottomBrand}
        <TeamHeader data={chartData} tone={tone} scale={contentScale} />
        <div style={{ marginTop: titleTop }}>
          <div style={{ color: colors.accent, fontSize: titleSize, fontWeight: sectionTitleWeight }}>상대 비교지표</div>
        </div>
        <div style={{ ...comparisonPanelLayout(comparisonScale), marginTop: panelTop }}>
          <ComparisonBars data={chartData} tone={tone} limit={7} scale={comparisonScale} fullBar />
        </div>
      </div>
    );
  }

  if (template === 'condition') {
    const conditionScale = contentScale * (isSquare ? 0.92 : 1.12);
    const titleTop = sectionTitleTop;
    const panelTop = dataPanelTop;
    const panelPad = 18 * conditionScale;
    return (
      <div style={frameStyle}>
        {dataTopBrand}
        {dataBottomBrand}
        <TeamHeader data={chartData} tone={tone} scale={contentScale} />
        <div style={{ marginTop: titleTop, color: colors.accent, fontSize: sectionTitleSize, fontWeight: sectionTitleWeight }}>팀 컨디션</div>
        <div style={{ ...panelStyle, marginTop: panelTop, borderRadius: panelRadius, padding: panelPad, overflow: 'hidden' }}>
          <TeamConditionTable data={chartData} tone={tone} scale={conditionScale} />
        </div>
      </div>
    );
  }

  if (template === 'goals') {
    const goalsScale = contentScale * (isSquare ? 1.08 : 1.28);
    const titleTop = sectionTitleTop;
    const panelTop = dataPanelTop;
    const panelPad = isSquare ? 16 * goalsScale : 18;
    return (
      <div style={frameStyle}>
        {dataTopBrand}
        {dataBottomBrand}
        <TeamHeader data={chartData} tone={tone} scale={contentScale} />
        <div style={{ marginTop: titleTop, color: colors.accent, fontSize: sectionTitleSize, fontWeight: sectionTitleWeight }}>득점 흐름</div>
        <div style={{ ...panelStyle, marginTop: panelTop, borderRadius: panelRadius, padding: panelPad, overflow: 'hidden' }}>
          <GoalsFlowTable data={chartData} tone={tone} scale={goalsScale} />
        </div>
      </div>
    );
  }

  if (template === 'h2h') {
    const h2hScale = contentScale;
    return (
      <div style={frameStyle}>
        {dataTopBrand}
        {dataBottomBrand}
        <TeamHeader data={chartData} tone={tone} scale={contentScale} />
        <div style={{ marginTop: sectionTitleTop }}>
          <div style={{ color: colors.accent, fontSize: sectionTitleSize, fontWeight: sectionTitleWeight, marginBottom: 10 * h2hScale }}>최근 맞대결</div>
          <div style={{ color: colors.muted, fontSize: 22 * h2hScale, fontWeight: 750 }}>최근 상대전적 스코어</div>
        </div>
        <div style={{ ...panelStyle, marginTop: dataPanelTop, borderRadius: panelRadius, padding: 54 * h2hScale }}>
          <RecentH2HMiniBlock data={chartData} tone={tone} scale={h2hScale} />
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
  const [isSavingAll, setIsSavingAll] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const exportRefs = useRef<Partial<Record<ThumbnailTemplate, HTMLDivElement | null>>>({});

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
      link.download = `${makeFileName(source, selectedSize)}-${template}-${selectedSize.width}x${selectedSize.height}.png`;
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

  const handleSaveAll = async () => {
    if (!source) return;

    setIsSavingAll(true);
    try {
      const { toPng } = await import('html-to-image');
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const files: Array<{ name: string; bytes: Uint8Array }> = [];

      for (const item of EXPORT_TEMPLATES) {
        const node = exportRefs.current[item.id];
        if (!node) continue;

        const dataUrl = await toPng(node, {
          width: selectedSize.width,
          height: selectedSize.height,
          canvasWidth: selectedSize.width,
          canvasHeight: selectedSize.height,
          pixelRatio: 1,
          cacheBust: true,
          backgroundColor: TONES[tone].bg,
        });

        files.push({
          name: `${makeFileName(source, selectedSize)}-${item.id}-${selectedSize.width}x${selectedSize.height}.png`,
          bytes: dataUrlToBytes(dataUrl),
        });
      }

      const zipUrl = URL.createObjectURL(createZipBlob(files));
      const link = document.createElement('a');
      link.download = `${makeFileName(source, selectedSize)}-all-${selectedSize.width}x${selectedSize.height}.zip`;
      link.href = zipUrl;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);

      toast.success('전체 썸네일 ZIP 저장을 시작했습니다.');
    } catch (error) {
      console.error('thumbnail batch export failed', error);
      toast.error('전체 ZIP 저장에 실패했습니다. 로고 이미지 로딩 후 다시 시도해 보세요.');
    } finally {
      setIsSavingAll(false);
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
            disabled={!source || isSaving || isSavingAll}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F0F0F0] dark:text-gray-900 dark:hover:bg-white"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PNG 저장
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!source || isSaving || isSavingAll}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#262626] dark:text-gray-200 dark:hover:bg-[#333333]"
          >
            {isSavingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            전체 ZIP 저장
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
                ['powerCompare', '전력비교 1'],
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

      {source && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: -20000,
            top: 0,
            width: selectedSize.width,
            pointerEvents: 'none',
          }}
        >
          {EXPORT_TEMPLATES.map((item) => (
            <div
              key={item.id}
              ref={(node) => {
                exportRefs.current[item.id] = node;
              }}
              style={{
                width: selectedSize.width,
                height: selectedSize.height,
              }}
            >
              <PredictionThumbnail
                source={source}
                size={selectedSize}
                template={item.id}
                tone={tone}
                showLogo={showLogo}
                posterBackground={posterBackground}
                posterColors={posterColors}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
