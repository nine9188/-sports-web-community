import { siteUrl } from '@/shared/seo/sitemap';

const INDEXNOW_KEY = 'c1df662b78d0423d9ef5095856359889';
const INDEXNOW_HOST = '4590football.com';
const INDEXNOW_KEY_LOCATION = siteUrl(`/${INDEXNOW_KEY}.txt`);

const INDEXNOW_ENDPOINTS = {
  bing: 'https://www.bing.com/indexnow',
  naver: 'https://searchadvisor.naver.com/indexnow',
} as const;

type IndexNowEngine = keyof typeof INDEXNOW_ENDPOINTS;

const DEFAULT_INDEXNOW_ENGINES: IndexNowEngine[] = ['bing', 'naver'];

type IndexNowEngineResult = {
  engine: IndexNowEngine;
  ok: boolean;
  status?: number;
  error?: string;
};

type IndexNowSubmitResult = {
  ok: boolean;
  status?: number;
  submitted: string[];
  error?: string;
  results?: IndexNowEngineResult[];
};

function toCanonicalUrl(urlOrPath: string): string | null {
  try {
    const url = new URL(urlOrPath, siteUrl('/'));
    if (url.protocol !== 'https:' || url.host !== INDEXNOW_HOST) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function getIndexNowKeyFilePath(): string {
  return `/${INDEXNOW_KEY}.txt`;
}

async function submitIndexNowBatch(
  engine: IndexNowEngine,
  submitted: string[],
): Promise<IndexNowEngineResult> {
  try {
    const response = await fetch(INDEXNOW_ENDPOINTS[engine], {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: submitted,
      }),
    });

    if (!response.ok && response.status !== 202) {
      return {
        engine,
        ok: false,
        status: response.status,
        error: await response.text().catch(() => response.statusText),
      };
    }

    return { engine, ok: true, status: response.status };
  } catch (error) {
    return {
      engine,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function submitIndexNowUrls(
  urlsOrPaths: string[],
  engines: IndexNowEngine[] = DEFAULT_INDEXNOW_ENGINES,
): Promise<IndexNowSubmitResult> {
  const submitted = [
    ...new Set(urlsOrPaths.map(toCanonicalUrl).filter((url): url is string => Boolean(url))),
  ];

  if (submitted.length === 0) {
    return { ok: true, submitted };
  }

  const uniqueEngines = [...new Set(engines)];
  const results = await Promise.all(
    uniqueEngines.map((engine) => submitIndexNowBatch(engine, submitted)),
  );
  const failed = results.filter((result) => !result.ok);

  if (failed.length > 0) {
    return {
      ok: false,
      submitted,
      results,
      error: failed
        .map((result) => `${result.engine}: ${result.status ?? 'network'} ${result.error ?? ''}`)
        .join('; '),
    };
  }

  return { ok: true, status: results[0]?.status, submitted, results };
}

export async function submitIndexNowUrl(urlOrPath: string): Promise<IndexNowSubmitResult> {
  return submitIndexNowUrls([urlOrPath]);
}
