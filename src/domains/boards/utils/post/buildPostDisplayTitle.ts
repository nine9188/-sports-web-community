type BuildPostDisplayTitleParams = {
  title?: string | null;
  contentType?: string | null;
  boardName?: string | null;
  sourceUrl?: string | null;
  meta?: Record<string, unknown> | null;
};

type PredictionPercent = {
  home?: string;
  draw?: string;
  away?: string;
};

function cleanTitle(value?: string | null): string {
  return String(value ?? '')
    .replace(/&quot;|&ldquo;|&rdquo;|[""]/g, '"')
    .replace(/&#39;|&lsquo;|&rsquo;|['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function hasHangul(value: string): boolean {
  return /[가-힣]/.test(value);
}

function stripClickbaitPrefix(value: string): string {
  return value
    .replace(/^\[[^\]]{1,16}\]\s*/u, '')
    .replace(/^['"]?(이럴\s*수가|초대박(?:\s*그\s*자체)?|단연|충격|깜짝|역대급|미쳤다|대박|오피셜)['"]?[!！\s,·-]*/u, '')
    .replace(/^['"][^'"]{2,28}['"]\s*[.!?！…·,-]*\s*/u, '')
    .trim();
}

function compactNewsTitle(title: string): string {
  const normalized = stripClickbaitPrefix(cleanTitle(title))
    .replace(/\s*(?:…|\.{2,}|→|⇒|--+)\s*/g, ' - ')
    .replace(/\s*[!！]{2,}\s*/g, '! ')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = normalized
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const compact = parts.length > 1
    ? parts.slice(0, 2).join(' - ')
    : normalized;

  if (compact.length <= 82) return compact;
  return compact.slice(0, 82).replace(/\s+\S*$/, '').trim();
}

function parsePercent(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function getPredictionPercent(meta?: Record<string, unknown> | null): PredictionPercent | null {
  const predictionData = meta?.prediction_data;
  if (!Array.isArray(predictionData)) return null;

  const first = predictionData[0] as {
    predictions?: { percent?: { home?: unknown; draw?: unknown; away?: unknown } };
  } | undefined;
  const percent = first?.predictions?.percent;
  if (!percent) return null;

  return {
    home: typeof percent.home === 'string' ? percent.home : undefined,
    draw: typeof percent.draw === 'string' ? percent.draw : undefined,
    away: typeof percent.away === 'string' ? percent.away : undefined,
  };
}

function getPredictionTeams(meta?: Record<string, unknown> | null): { home?: string; away?: string } {
  const predictionData = meta?.prediction_data;
  if (!Array.isArray(predictionData)) return {};

  const first = predictionData[0] as {
    teams?: {
      home?: { name?: unknown };
      away?: { name?: unknown };
    };
  } | undefined;

  return {
    home: typeof first?.teams?.home?.name === 'string' ? first.teams.home.name.trim() : undefined,
    away: typeof first?.teams?.away?.name === 'string' ? first.teams.away.name.trim() : undefined,
  };
}

function getMatchTitleTeams(title: string): { home?: string; away?: string } {
  const match = cleanTitle(title).match(/(?:\d{1,2}월\s*\d{1,2}일\s*)?(?:.+?\s)?(.+?)\s+vs\s+(.+?)\s+경기/u);
  return {
    home: match?.[1]?.trim(),
    away: match?.[2]?.trim(),
  };
}

function formatKoreanDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function normalizeLeagueName(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim();
  const leagueMap: Record<string, string> = {
    'Premier League': '프리미어리그',
    'La Liga': '라리가',
    Bundesliga: '분데스리가',
    'Serie A': '세리에A',
    'Ligue 1': '리그앙',
    'UEFA Champions League': '챔피언스리그',
    'UEFA Europa League': '유로파리그',
    'UEFA Europa Conference League': '컨퍼런스리그',
    'K League 1': 'K리그1',
    'K League 2': 'K리그2',
    'FA Cup': 'FA컵',
  };

  return leagueMap[normalized] || normalized;
}

function getPredictionAngle(percent: PredictionPercent | null, homeTeam: string, awayTeam: string): string {
  const home = parsePercent(percent?.home);
  const draw = parsePercent(percent?.draw);
  const away = parsePercent(percent?.away);

  if (home !== null && draw !== null && Math.abs(home - draw) <= 5 && home > (away ?? 0)) {
    return `${homeTeam} 우세와 무승부 변수`;
  }
  if (away !== null && draw !== null && Math.abs(away - draw) <= 5 && away > (home ?? 0)) {
    return `${awayTeam} 우세와 무승부 변수`;
  }
  if (home !== null && away !== null && Math.abs(home - away) <= 8) {
    return '승부 균형과 접전 흐름';
  }
  if (home !== null && away !== null && home > away) {
    return `${homeTeam} 홈 우세 포인트`;
  }
  if (home !== null && away !== null && away > home) {
    return `${awayTeam} 원정 우세 포인트`;
  }
  return '최근 흐름과 승부 변수';
}

function buildPredictionDisplayTitle(params: BuildPostDisplayTitleParams): string | null {
  const title = cleanTitle(params.title);
  const meta = params.meta;
  if (meta?.prediction_type !== 'league_analysis') return null;

  const teams = getPredictionTeams(meta);
  const fallbackTeams = getMatchTitleTeams(title);
  const homeTeam = fallbackTeams.home || teams.home;
  const awayTeam = fallbackTeams.away || teams.away;
  if (!homeTeam || !awayTeam) return null;

  const percent = getPredictionPercent(meta);
  const angle = getPredictionAngle(percent, homeTeam, awayTeam);
  const dateText = formatKoreanDate(meta?.target_date);
  const leagueName = normalizeLeagueName(
    typeof meta?.league_name === 'string' && meta.league_name.trim()
      ? meta.league_name
      : params.boardName
  );
  const suffix = [leagueName, dateText, '분석'].filter(Boolean).join(' ');

  return `${homeTeam} vs ${awayTeam}, ${angle}${suffix ? ` | ${suffix}` : ''}`;
}

export function buildPostDisplayTitle(params: BuildPostDisplayTitleParams): string {
  const originalTitle = cleanTitle(params.title);
  const isPredictionPost = params.meta?.prediction_type === 'league_analysis';

  if (isPredictionPost && hasHangul(originalTitle)) {
    return originalTitle;
  }

  const predictionTitle = buildPredictionDisplayTitle(params);
  if (predictionTitle) return predictionTitle;

  if (params.contentType === 'news' || params.sourceUrl) {
    return compactNewsTitle(originalTitle);
  }

  return originalTitle;
}
