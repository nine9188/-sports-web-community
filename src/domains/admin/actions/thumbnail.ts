'use server';

import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getCachedBoardBySlug } from '@/domains/boards/actions/getCachedBoards';
import type { PredictionChartData } from '@/domains/prediction/components/PredictionChart';

export interface PredictionThumbnailSource {
  title: string;
  boardSlug: string;
  postNumber: number;
  postUrl: string;
  fixtureId: string;
  chartData: PredictionChartData;
}

interface LoadPredictionThumbnailResult {
  success: boolean;
  source?: PredictionThumbnailSource;
  error?: string;
}

interface PostLocator {
  slug: string;
  postNumber: number;
}

function parsePostLocator(input: string): PostLocator | null {
  const value = input.trim();
  if (!value) return null;

  let pathname = value;
  try {
    pathname = new URL(value).pathname;
  } catch {
    // Plain paths such as /boards/foreign-analysis/123 are supported.
  }

  const parts = pathname.split('/').filter(Boolean);
  const boardsIndex = parts.indexOf('boards');
  if (boardsIndex >= 0 && parts[boardsIndex + 1] && parts[boardsIndex + 2]) {
    const postNumber = Number(parts[boardsIndex + 2]);
    if (Number.isFinite(postNumber) && postNumber > 0) {
      return {
        slug: parts[boardsIndex + 1],
        postNumber,
      };
    }
  }

  if (parts.length >= 2) {
    const postNumber = Number(parts[parts.length - 1]);
    if (Number.isFinite(postNumber) && postNumber > 0) {
      return {
        slug: parts[parts.length - 2],
        postNumber,
      };
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPredictionChartData(value: unknown): value is PredictionChartData {
  if (!isRecord(value)) return false;
  const predictions = value.predictions;
  const comparison = value.comparison;
  const teams = value.teams;

  return (
    isRecord(predictions) &&
    isRecord(predictions.percent) &&
    isRecord(comparison) &&
    isRecord(teams) &&
    isRecord(teams.home) &&
    isRecord(teams.away)
  );
}

function extractChartFromTipTap(content: unknown): { fixtureId: string; chartData: PredictionChartData } | null {
  const walk = (node: unknown): { fixtureId: string; chartData: PredictionChartData } | null => {
    if (!isRecord(node)) return null;

    if (node.type === 'predictionChart' && isRecord(node.attrs)) {
      const chartData = node.attrs.chartData;
      if (isPredictionChartData(chartData)) {
        return {
          fixtureId: String(node.attrs.fixtureId ?? ''),
          chartData,
        };
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const found = walk(child);
        if (found) return found;
      }
    }

    return null;
  };

  return walk(content);
}

function extractChartFromHtml(html: string): { fixtureId: string; chartData: PredictionChartData } | null {
  const chartMatch = html.match(/data-chart=(?:"([^"]+)"|'([^']+)')/i);
  if (!chartMatch) return null;

  try {
    const encodedChart = chartMatch[1] || chartMatch[2];
    const chartData = JSON.parse(decodeURIComponent(encodedChart));
    if (!isPredictionChartData(chartData)) return null;

    const fixtureMatch = html.match(/data-fixture-id=(?:"([^"]+)"|'([^']+)')/i);
    return {
      fixtureId: fixtureMatch ? fixtureMatch[1] || fixtureMatch[2] || '' : '',
      chartData,
    };
  } catch {
    return null;
  }
}

function extractPredictionChart(content: unknown): { fixtureId: string; chartData: PredictionChartData } | null {
  if (!content) return null;

  if (typeof content === 'string') {
    const trimmed = content.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        const chart = extractChartFromTipTap(parsed);
        if (chart) return chart;
      } catch {
        // Fall through to HTML extraction.
      }
    }

    return extractChartFromHtml(content);
  }

  return extractChartFromTipTap(content);
}

export async function loadPredictionThumbnailSource(input: string): Promise<LoadPredictionThumbnailResult> {
  const locator = parsePostLocator(input);
  if (!locator) {
    return { success: false, error: '게시글 주소를 확인해 주세요. 예: /boards/foreign-analysis/123' };
  }

  const board = await getCachedBoardBySlug(locator.slug);
  if (!board) {
    return { success: false, error: '게시판을 찾을 수 없습니다.' };
  }

  const supabase = await getSupabaseServer();
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, title, post_number')
    .eq('board_id', board.id)
    .eq('post_number', locator.postNumber)
    .maybeSingle();

  if (postError || !post) {
    return { success: false, error: '게시글을 찾을 수 없습니다.' };
  }

  const { data: contentRow, error: contentError } = await supabase
    .from('posts_content')
    .select('content')
    .eq('post_id', post.id)
    .maybeSingle();

  if (contentError) {
    return { success: false, error: '게시글 본문을 불러오지 못했습니다.' };
  }

  const chart = extractPredictionChart(contentRow?.content);
  if (!chart) {
    return { success: false, error: '이 게시글에서 예측 차트를 찾지 못했습니다.' };
  }

  return {
    success: true,
    source: {
      title: post.title,
      boardSlug: locator.slug,
      postNumber: post.post_number ?? locator.postNumber,
      postUrl: `/boards/${locator.slug}/${locator.postNumber}`,
      fixtureId: chart.fixtureId,
      chartData: chart.chartData,
    },
  };
}
