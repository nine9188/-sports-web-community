import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/shared/lib/supabase/server';
import type { Json } from '@/shared/types/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Search Engine Check',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

type SearchEngineMatch = {
  name: string;
  pattern: RegExp;
};

type SearchEngineLogMetadata = {
  searchEngine?: string;
  isTrackedSearchEngine?: boolean;
  host?: string | null;
  referer?: string | null;
  forwardedFor?: string | null;
  realIp?: string | null;
  cfConnectingIp?: string | null;
  trueClientIp?: string | null;
  secFetchSite?: string | null;
  secFetchMode?: string | null;
  secFetchDest?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  asNumber?: string | null;
  asName?: string | null;
};

type RecentSearchEngineLog = {
  id: string;
  created_at: string | null;
  message: string;
  user_agent: string | null;
  ip_address: unknown;
  metadata: Json | null;
};

const SEARCH_ENGINE_BOTS: SearchEngineMatch[] = [
  { name: 'Google', pattern: /googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google/i },
  { name: 'Bing', pattern: /bingbot|msnbot|adidxbot/i },
  { name: 'Naver', pattern: /yeti|naverbot/i },
  { name: 'Daum', pattern: /daum|daumoa/i },
  { name: 'Apple', pattern: /applebot/i },
  { name: 'DuckDuckGo', pattern: /duckduckbot/i },
];

function readHeader(headersList: Headers, name: string) {
  return headersList.get(name) || null;
}

function detectSearchEngine(userAgent: string | null) {
  if (!userAgent) return null;
  return SEARCH_ENGINE_BOTS.find((bot) => bot.pattern.test(userAgent))?.name || null;
}

function getClientIp(headersList: Headers) {
  return readHeader(headersList, 'cf-connecting-ip')
    || readHeader(headersList, 'true-client-ip')
    || readHeader(headersList, 'x-real-ip')
    || readHeader(headersList, 'x-forwarded-for')?.split(',')[0]?.trim()
    || null;
}

function getSearchEngineLogMetadata(headersList: Headers, searchEngine: string | null): SearchEngineLogMetadata {
  const asName = readHeader(headersList, 'x-vercel-ip-as-name');
  const possibleGoogle = !searchEngine && Boolean(asName && /google/i.test(asName));

  return {
    searchEngine: searchEngine || (possibleGoogle ? 'Possible Google' : 'Unrecognized'),
    isTrackedSearchEngine: Boolean(searchEngine || possibleGoogle),
    host: readHeader(headersList, 'host'),
    referer: readHeader(headersList, 'referer'),
    forwardedFor: readHeader(headersList, 'x-forwarded-for'),
    realIp: readHeader(headersList, 'x-real-ip'),
    cfConnectingIp: readHeader(headersList, 'cf-connecting-ip'),
    trueClientIp: readHeader(headersList, 'true-client-ip'),
    secFetchSite: readHeader(headersList, 'sec-fetch-site'),
    secFetchMode: readHeader(headersList, 'sec-fetch-mode'),
    secFetchDest: readHeader(headersList, 'sec-fetch-dest'),
    acceptLanguage: readHeader(headersList, 'accept-language'),
    country: readHeader(headersList, 'x-vercel-ip-country'),
    region: readHeader(headersList, 'x-vercel-ip-country-region'),
    city: readHeader(headersList, 'x-vercel-ip-city'),
    asNumber: readHeader(headersList, 'x-vercel-ip-as-number'),
    asName,
  };
}

async function writeSearchEngineVisitLog({
  headersList,
  searchEngine,
  userAgent,
}: {
  headersList: Headers;
  searchEngine: string | null;
  userAgent: string | null;
}) {
  const metadata = getSearchEngineLogMetadata(headersList, searchEngine);
  if (!metadata.isTrackedSearchEngine) return;

  console.log('[search-engine-check]', JSON.stringify({
    at: new Date().toISOString(),
    ...metadata,
    userAgent,
  }));

  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from('application_logs')
      .insert({
        level: 'INFO',
        category: 'system',
        action: 'search_engine_check',
        message: `${metadata.searchEngine} visited search engine check page`,
        endpoint: '/search-engine-check-4590',
        ip_address: getClientIp(headersList),
        user_agent: userAgent,
        request_id: readHeader(headersList, 'x-vercel-id') || crypto.randomUUID(),
        metadata: metadata as Json,
      });
  } catch (error) {
    console.error('[search-engine-check] failed to persist log', error);
  }
}

async function getRecentSearchEngineLogs(): Promise<RecentSearchEngineLog[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('application_logs')
      .select('id, created_at, message, user_agent, ip_address, metadata')
      .eq('action', 'search_engine_check')
      .neq('metadata->>isTrackedSearchEngine', 'false')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[search-engine-check] failed to read logs', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[search-engine-check] failed to read logs', error);
    return [];
  }
}

function readLogMetadata(log: RecentSearchEngineLog): SearchEngineLogMetadata {
  return (log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata))
    ? log.metadata as SearchEngineLogMetadata
    : {};
}

function formatDateTime(value: string | null) {
  if (!value) return 'unknown';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function SearchEngineCheckPage() {
  const headersList = await headers();
  const userAgent = readHeader(headersList, 'user-agent');
  const searchEngine = detectSearchEngine(userAgent);

  await writeSearchEngineVisitLog({ headersList, searchEngine, userAgent });

  const recentLogs = await getRecentSearchEngineLogs();

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-semibold">Search engine check</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Only tracked search engine visits are saved below. Human browser refreshes are ignored.
        </p>
        <dl className="mt-6 space-y-3 rounded border border-neutral-200 p-4 text-sm">
          <div>
            <dt className="font-medium text-neutral-500">Detected search engine</dt>
            <dd>{searchEngine || 'none'}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Tracked engines</dt>
            <dd>Google, Bing, Naver, Daum, Apple, DuckDuckGo</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">User agent</dt>
            <dd className="break-words">{userAgent || 'unknown'}</dd>
          </div>
        </dl>

        <section className="mt-8">
          <h2 className="text-base font-semibold">Recent search engine visits</h2>
          {recentLogs.length === 0 ? (
            <p className="mt-3 rounded border border-neutral-200 p-4 text-sm text-neutral-600">
              No saved search engine visits yet.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Engine</th>
                    <th className="px-3 py-2 font-medium">Network</th>
                    <th className="px-3 py-2 font-medium">User agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {recentLogs.map((log) => {
                    const metadata = readLogMetadata(log);
                    return (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-3 py-2 align-top text-neutral-600">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 align-top">
                          {metadata.searchEngine || 'unknown'}
                          {!metadata.isTrackedSearchEngine && (
                            <span className="ml-2 text-neutral-500">(not tracked)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-neutral-600">
                          <div>{String(log.ip_address || metadata.cfConnectingIp || metadata.forwardedFor || '-')}</div>
                          <div className="mt-1 text-xs">
                            {[metadata.country, metadata.asName || metadata.asNumber].filter(Boolean).join(' / ') || '-'}
                          </div>
                          {metadata.referer && (
                            <div className="mt-1 max-w-[180px] truncate text-xs">ref: {metadata.referer}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-neutral-600">
                          <span className="line-clamp-2 break-words">{log.user_agent || '-'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
