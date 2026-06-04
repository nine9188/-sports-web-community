import type { Metadata } from 'next';
import { headers } from 'next/headers';

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

export default async function SearchEngineCheckPage() {
  const headersList = await headers();
  const userAgent = readHeader(headersList, 'user-agent');
  const searchEngine = detectSearchEngine(userAgent);

  if (searchEngine) {
    console.log('[search-engine-check]', JSON.stringify({
      at: new Date().toISOString(),
      searchEngine,
      host: readHeader(headersList, 'host'),
      userAgent,
      referer: readHeader(headersList, 'referer'),
      forwardedFor: readHeader(headersList, 'x-forwarded-for'),
      realIp: readHeader(headersList, 'x-real-ip'),
      country: readHeader(headersList, 'x-vercel-ip-country'),
      region: readHeader(headersList, 'x-vercel-ip-country-region'),
      city: readHeader(headersList, 'x-vercel-ip-city'),
      asNumber: readHeader(headersList, 'x-vercel-ip-as-number'),
      asName: readHeader(headersList, 'x-vercel-ip-as-name'),
    }));
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-neutral-950">
      <div className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold">Search engine check</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Human browser visits are not written to the verification log.
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
      </div>
    </main>
  );
}
