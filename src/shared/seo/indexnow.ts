import { siteUrl } from '@/shared/seo/sitemap';

const INDEXNOW_KEY = 'c1df662b78d0423d9ef5095856359889';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_HOST = '4590football.com';
const INDEXNOW_KEY_LOCATION = siteUrl(`/${INDEXNOW_KEY}.txt`);

type IndexNowSubmitResult = {
  ok: boolean;
  status?: number;
  submitted: string[];
  error?: string;
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

export async function submitIndexNowUrls(urlsOrPaths: string[]): Promise<IndexNowSubmitResult> {
  const submitted = [
    ...new Set(urlsOrPaths.map(toCanonicalUrl).filter((url): url is string => Boolean(url))),
  ];

  if (submitted.length === 0) {
    return { ok: true, submitted };
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
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
        ok: false,
        status: response.status,
        submitted,
        error: await response.text().catch(() => response.statusText),
      };
    }

    return { ok: true, status: response.status, submitted };
  } catch (error) {
    return {
      ok: false,
      submitted,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function submitIndexNowUrl(urlOrPath: string): Promise<IndexNowSubmitResult> {
  return submitIndexNowUrls([urlOrPath]);
}
