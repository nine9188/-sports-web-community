/**
 * Cloudflare Worker for cdn.4590football.com.
 *
 * - Storage assets:
 *   /players/md/123.webp -> Supabase Storage public object
 * - External news image proxy:
 *   /proxy?url=https://img.mydaily.co.kr/...
 */

const SUPABASE_STORAGE_ORIGIN =
  'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public';

const ALLOWED_BUCKETS = new Set([
  'players',
  'teams',
  'leagues',
  'coachs',
  'venues',
  'profile-icons',
  'post-images',
  'post-videos',
  'benner',
  'emoticon-submissions',
]);

const ALLOWED_EXTENSIONS = new Set(['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg']);

const ALLOWED_ORIGINS = [
  '4590football.com',
  'localhost',
];

const ALLOWED_PROXY_SOURCE_HOSTS = new Set([
  'img.mydaily.co.kr',
]);

const SEARCH_CRAWLER_UA =
  /(Googlebot|Googlebot-Image|Google-InspectionTool|bingbot|Yeti|DuckDuckBot|Applebot)/i;

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isHead = request.method === 'HEAD';

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/robots.txt') {
      return handleRobotsTxt(isHead);
    }

    if (url.pathname === '/proxy') {
      return handleExternalProxy(request, url, ctx, isHead);
    }

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(isHead ? null : '4590 Storage CDN', { status: 200 });
    }

    return handleStorageProxy(request, url, ctx, isHead);
  },
};

export default worker;

function handleRobotsTxt(isHead) {
  const body = [
    'User-agent: *',
    'Disallow: /proxy',
    'Allow: /players/',
    'Allow: /teams/',
    'Allow: /leagues/',
    'Allow: /coachs/',
    'Allow: /venues/',
    'Allow: /profile-icons/',
    '',
  ].join('\n');

  return new Response(isHead ? null : body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleStorageProxy(request, url, ctx, isHead) {
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 1) {
    return new Response(isHead ? null : 'Not Found', { status: 404 });
  }

  const bucket = segments[0];
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return new Response(isHead ? null : 'Not Found', { status: 404 });
  }

  const lastSegment = segments[segments.length - 1];
  const ext = lastSegment.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return new Response(isHead ? null : 'Not Found', { status: 404 });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  let response = await cache.match(cacheKey);

  if (response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(isHead ? null : response.body, {
      status: response.status,
      headers,
    });
  }

  const supabaseUrl = `${SUPABASE_STORAGE_ORIGIN}${url.pathname}`;

  try {
    const originResponse = await fetch(supabaseUrl, {
      headers: { Accept: 'image/*' },
    });

    if (!originResponse.ok) {
      return new Response(isHead ? null : 'Not Found', { status: 404 });
    }

    const originContentType =
      originResponse.headers.get('content-type') || 'application/octet-stream';
    response = new Response(originResponse.body, {
      status: 200,
      headers: {
        'Content-Type': originContentType,
        'Cache-Control': 'public, s-maxage=31536000, max-age=86400',
        'CDN-Cache-Control': 'max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return isHead
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  } catch {
    return new Response(isHead ? null : 'Origin Error', { status: 502 });
  }
}

async function handleExternalProxy(request, url, ctx, isHead) {
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response(isHead ? null : 'URL parameter is required', { status: 400 });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new Response(isHead ? null : 'Invalid URL', { status: 400 });
  }

  if (parsedUrl.protocol !== 'https:') {
    return new Response(isHead ? null : 'Only HTTPS URLs are allowed', { status: 400 });
  }

  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(
    (domain) => referer.includes(domain) || origin.includes(domain)
  );
  const userAgent = request.headers.get('user-agent') || '';
  const isAllowedCrawler =
    ALLOWED_PROXY_SOURCE_HOSTS.has(parsedUrl.hostname) &&
    SEARCH_CRAWLER_UA.test(userAgent);

  if (!isAllowedOrigin && !isAllowedCrawler) {
    return new Response(isHead ? null : 'Forbidden', {
      status: 403,
      headers: {
        'X-Robots-Tag': 'noindex, noimageindex',
      },
    });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  let response = await cache.match(cacheKey);

  if (response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(isHead ? null : response.body, {
      status: response.status,
      headers,
    });
  }

  try {
    const originResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: `https://${parsedUrl.hostname}/`,
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-site',
      },
    });

    if (!originResponse.ok) {
      return new Response(isHead ? null : 'Failed to fetch image', {
        status: originResponse.status,
        headers: {
          'X-Robots-Tag': 'noindex, noimageindex',
        },
      });
    }

    const contentType = originResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response(isHead ? null : 'URL is not an image', {
        status: 400,
        headers: {
          'X-Robots-Tag': 'noindex, noimageindex',
        },
      });
    }

    response = new Response(originResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=86400, max-age=3600',
        'CDN-Cache-Control': 'max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'noindex, noimageindex',
        'X-Cache': 'MISS',
      },
    });

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return isHead
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  } catch {
    return new Response(isHead ? null : 'Origin Error', {
      status: 502,
      headers: {
        'X-Robots-Tag': 'noindex, noimageindex',
      },
    });
  }
}
