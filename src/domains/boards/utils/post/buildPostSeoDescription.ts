import type { DealInfo } from '@/domains/boards/types/hotdeal/deal-info';
import type { PostSeoEntities } from './extractPostSeoEntities';

type PostContentType = 'news' | 'article' | 'community' | 'deal' | 'review' | string;

type BuildPostSeoDescriptionParams = {
  summary?: string | null;
  title: string;
  boardName: string;
  contentType?: PostContentType | null;
  dealInfo?: DealInfo | null;
  seoEntities?: PostSeoEntities | null;
  postMeta?: Record<string, unknown> | null;
};

type BuildPostSeoKeywordsParams = {
  title: string;
  boardName: string;
  contentType?: PostContentType | null;
  seoEntities?: PostSeoEntities | null;
};

export function compactSeoText(value?: string | null): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentence(value: string, maxLength = 180): string {
  const clean = compactSeoText(value);
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
}

function splitKoreanSentences(value: string): string[] {
  return compactSeoText(value)
    .split(/(?<=[.!?。]|다\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function cleanAnalysisSummary(value?: string | null): string {
  return compactSeoText(value)
    .replace(/^경기\s*개요\s*/i, '')
    .replace(/\s*홈팀\s*분석[\s\S]*$/i, '')
    .replace(/\s*어웨이팀\s*분석[\s\S]*$/i, '')
    .replace(/\s*원정팀\s*분석[\s\S]*$/i, '')
    .trim();
}

function formatKoreanDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getPredictionPercent(meta?: Record<string, unknown> | null): {
  home?: string;
  draw?: string;
  away?: string;
} | null {
  const predictionData = meta?.prediction_data;
  if (!Array.isArray(predictionData)) return null;

  const firstPrediction = predictionData[0] as {
    predictions?: {
      percent?: {
        home?: unknown;
        draw?: unknown;
        away?: unknown;
      };
    };
  } | undefined;
  const percent = firstPrediction?.predictions?.percent;
  if (!percent) return null;

  const home = typeof percent.home === 'string' ? percent.home : undefined;
  const draw = typeof percent.draw === 'string' ? percent.draw : undefined;
  const away = typeof percent.away === 'string' ? percent.away : undefined;

  if (!home && !draw && !away) return null;
  return { home, draw, away };
}

function formatPrice(price?: number | null): string | null {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  return `${price.toLocaleString('ko-KR')}원`;
}

function joinNames(names: string[], limit: number): string {
  return names.slice(0, limit).join(', ');
}

function getPrimaryTeams(entities?: PostSeoEntities | null): string[] {
  return entities?.teams.slice(0, 4) || [];
}

function getPrimaryPlayers(entities?: PostSeoEntities | null): string[] {
  return entities?.players.slice(0, 3) || [];
}

function getPrimaryMatches(entities?: PostSeoEntities | null): string[] {
  return entities?.matches.slice(0, 2) || [];
}

function buildEntityContext(entities?: PostSeoEntities | null): string {
  if (!entities) return '';

  const parts = [
    getPrimaryTeams(entities).length > 0 ? `관련 팀: ${joinNames(getPrimaryTeams(entities), 4)}` : '',
    getPrimaryPlayers(entities).length > 0 ? `관련 선수: ${joinNames(getPrimaryPlayers(entities), 3)}` : '',
    getPrimaryMatches(entities).length > 0 ? `관련 경기: ${joinNames(getPrimaryMatches(entities), 2)}` : '',
  ].filter(Boolean);

  return parts.length > 0 ? ` ${parts.join('. ')}.` : '';
}

function buildNewsDescription(
  title: string,
  summary?: string | null,
  seoEntities?: PostSeoEntities | null
): string {
  const context = buildEntityContext(seoEntities);
  const teams = getPrimaryTeams(seoEntities);
  const matches = getPrimaryMatches(seoEntities);
  const cleanSummary = compactSeoText(summary);
  const summarySentences = splitKoreanSentences(cleanSummary);

  if (summarySentences.length > 0) {
    const intro = summarySentences.slice(0, 2).join(' ');
    if (intro.length >= 50) {
      return sentence(`${sentence(intro, context ? 145 : 160)}${context}`);
    }
  }

  if (teams.length > 0 || matches.length > 0) {
    return sentence(`${sentence(title, context ? 95 : 140)} 관련 축구 뉴스입니다.${context}`);
  }

  return sentence(`${sentence(title, 130)} 관련 축구 뉴스입니다. 해외축구 주요 이슈와 경기 흐름을 4590 Football에서 확인하세요.`);
}

function buildArticleDescriptionFromSummary(
  title: string,
  boardName: string,
  summary?: string | null,
  seoEntities?: PostSeoEntities | null,
  postMeta?: Record<string, unknown> | null
): string {
  const teams = getPrimaryTeams(seoEntities);
  const matches = getPrimaryMatches(seoEntities);
  const predictionPercent = getPredictionPercent(postMeta);
  const matchDate = formatKoreanDate(postMeta?.target_date);

  if (predictionPercent && teams.length >= 2) {
    const [homeTeam, awayTeam] = teams;
    const percentText = [
      predictionPercent.home ? `${homeTeam} ${predictionPercent.home}` : '',
      predictionPercent.draw ? `무승부 ${predictionPercent.draw}` : '',
      predictionPercent.away ? `${awayTeam} ${predictionPercent.away}` : '',
    ].filter(Boolean).join(', ');

    return sentence(
      `${matchDate ? `${matchDate} ` : ''}${boardName} ${homeTeam} vs ${awayTeam} 경기 예측 분석입니다. 승률 예측: ${percentText}. 최근 흐름과 맞대결 관전 포인트를 정리했습니다.`
    );
  }

  const cleanSummary = cleanAnalysisSummary(summary);
  const summarySentences = splitKoreanSentences(cleanSummary);

  if (summarySentences.length > 0) {
    const intro = summarySentences.slice(0, 2).join(' ');
    if (intro.length >= 50) return sentence(intro);
  }

  if (matches.length > 0) {
    return sentence(`${sentence(title, 105)}입니다. ${joinNames(matches, 2)} 경기의 최근 흐름, 맞대결 기록, 승부 예측과 주요 변수를 정리했습니다.`);
  }

  if (teams.length >= 2) {
    return sentence(`${sentence(title, 105)}입니다. ${joinNames(teams, 2)}의 최근 흐름, 맞대결 기록, 승부 예측과 주요 변수를 정리했습니다.`);
  }

  return sentence(`${sentence(title, 115)}입니다. ${boardName} 경기의 최근 흐름, 맞대결 기록, 승부 예측과 주요 변수를 정리했습니다.`);
}

function buildDealDescription(title: string, boardName: string, dealInfo?: DealInfo | null): string {
  const price = formatPrice(dealInfo?.price);
  const store = compactSeoText(dealInfo?.store);
  const ended = dealInfo?.is_ended ? '종료된 딜' : '진행 중인 딜';
  const productName = compactSeoText(dealInfo?.product_name) || title;

  if (price && store) {
    return sentence(`${productName} ${price} ${store} ${ended} 정보입니다. ${boardName}에서 가격, 배송비, 구매 링크를 확인하세요.`);
  }

  return sentence(`${title} 핫딜 정보입니다. ${boardName}에서 가격, 판매처, 배송비와 구매 가능 여부를 확인하세요.`);
}

function buildReviewDescription(title: string, boardName: string, summary?: string | null): string {
  const cleanSummary = compactSeoText(summary);
  if (cleanSummary && cleanSummary.length >= 50) {
    return sentence(cleanSummary);
  }

  return sentence(`${title} 후기 게시글입니다. ${boardName}에서 실제 이용 후기, 장단점, 댓글 반응을 확인하세요.`);
}

function buildCommunityDescription(title: string, boardName: string, summary?: string | null): string {
  const cleanSummary = compactSeoText(summary);
  if (cleanSummary && cleanSummary.length >= 50) {
    return sentence(cleanSummary);
  }

  return sentence(`${title} 게시글입니다. ${boardName}에서 축구 팬들과 경기, 팀 소식, 선수 이야기를 나눠보세요.`);
}

export function buildPostSeoDescription({
  summary,
  title,
  boardName,
  contentType,
  dealInfo,
  seoEntities,
  postMeta,
}: BuildPostSeoDescriptionParams): string {
  switch (contentType) {
    case 'news':
      return buildNewsDescription(title, summary, seoEntities);
    case 'article':
      return buildArticleDescriptionFromSummary(title, boardName, summary, seoEntities, postMeta);
    case 'deal':
      return buildDealDescription(title, boardName, dealInfo);
    case 'review':
      return buildReviewDescription(title, boardName, summary);
    case 'community':
    default:
      return buildCommunityDescription(title, boardName, summary);
  }
}

export function buildPostSeoKeywords({
  title,
  boardName,
  contentType,
  seoEntities,
}: BuildPostSeoKeywordsParams): string[] {
  const baseByType: Record<string, string[]> = {
    news: ['축구 뉴스', '해외축구 뉴스'],
    article: ['축구 분석', '경기 분석', '축구 예측'],
    community: ['축구 커뮤니티', '축구 게시판'],
    deal: ['축구 핫딜', '축구용품'],
    review: ['축구 후기', '축구 리뷰'],
  };

  const titleKeywords = extractTitleKeywords(title);

  const brandKeywords = ['4590', '4590football', '4590 Football'];
  const contentKeywords = Array.from(new Set([
    boardName,
    ...(seoEntities?.teams || []),
    ...(seoEntities?.players || []),
    ...(seoEntities?.matches || []),
    ...titleKeywords,
    ...(baseByType[contentType || ''] || baseByType.community),
  ].filter(Boolean))).filter((keyword) => !brandKeywords.includes(keyword));

  return [...contentKeywords.slice(0, 9), ...brandKeywords];
}

function extractTitleKeywords(title: string): string[] {
  const compactTitle = compactSeoText(title);
  const keywords = new Set<string>();

  const quoted = compactTitle.match(/[가-힣A-Za-z0-9]+(?:\s+[가-힣A-Za-z0-9]+){0,2}/g) || [];
  for (const value of quoted) {
    const keyword = value
      .replace(/[^\w가-힣\s-]/g, '')
      .trim();
    if (keyword.length >= 3 && keyword.length <= 20) keywords.add(keyword);
    if (keywords.size >= 4) break;
  }

  if (/EPL|프리미어리그/i.test(compactTitle)) keywords.add('프리미어리그');
  if (/우승/.test(compactTitle)) keywords.add('우승');
  if (/이적/.test(compactTitle)) keywords.add('축구 이적');

  return [...keywords];
}
