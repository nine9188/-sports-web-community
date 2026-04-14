/**
 * Cloudflare Worker — Storage CDN + 외부 이미지 프록시
 *
 * 1. Storage: https://cdn.4590football.com/players/md/123.webp
 *    → Supabase Storage에서 가져와 1년 캐시
 *
 * 2. 외부 이미지: https://cdn.4590football.com/proxy?url=https://img.mydaily.co.kr/...
 *    → 외부 이미지를 가져와 24시간 캐시
 *
 * 배포: cd workers/storage-cdn && npx wrangler deploy
 */

const SUPABASE_STORAGE_ORIGIN =
  'https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public';

// 허용 버킷 (보안: 다른 경로 접근 차단)
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

// 허용 확장자
const ALLOWED_EXTENSIONS = new Set(['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg']);

// 외부 프록시 허용 도메인 (보안: 아무 URL이나 프록시 방지)
const ALLOWED_PROXY_DOMAINS = new Set([
  'img.mydaily.co.kr',
  'imgnews.pstatic.net',
  'mimgnews.pstatic.net',
  's.pstatic.net',
  'image.kmib.co.kr',
  'flexible.img.hani.co.kr',
  'img.khan.co.kr',
  'img.sbs.co.kr',
  'image.chosun.com',
  'image.dongascience.com',
  'cdn.footballist.co.kr',
  'i.ytimg.com',
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // GET만 허용
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const pathname = url.pathname;

    // ─── /proxy 경로: 외부 이미지 프록시 ───
    if (pathname === '/proxy') {
      return handleExternalProxy(request, url, ctx);
    }

    // ─── 루트 ───
    if (pathname === '/' || pathname === '') {
      return new Response('4590 Storage CDN', { status: 200 });
    }

    // ─── Storage 프록시 ───
    return handleStorageProxy(request, url, ctx, pathname);
  },
};

/**
 * Supabase Storage 프록시 (기존 기능)
 */
async function handleStorageProxy(request, url, ctx, pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 1) {
    return new Response('Not Found', { status: 404 });
  }

  // 버킷 검증
  const bucket = segments[0];
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return new Response('Not Found', { status: 404 });
  }

  // 확장자 검증
  const lastSegment = segments[segments.length - 1];
  const ext = lastSegment.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return new Response('Not Found', { status: 404 });
  }

  // 캐시 확인
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  let response = await cache.match(cacheKey);

  if (response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(response.body, { ...response, headers });
  }

  // Supabase에서 가져오기
  const supabaseUrl = `${SUPABASE_STORAGE_ORIGIN}${pathname}`;

  try {
    const originResponse = await fetch(supabaseUrl, {
      headers: { 'Accept': 'image/*' },
    });

    if (!originResponse.ok) {
      return new Response('Not Found', { status: 404 });
    }

    response = new Response(originResponse.body, originResponse);
    response.headers.set('Cache-Control', 'public, s-maxage=31536000, max-age=86400');
    response.headers.set('CDN-Cache-Control', 'max-age=31536000');
    response.headers.set('X-Cache', 'MISS');
    response.headers.delete('Set-Cookie');

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return new Response('Origin Error', { status: 502 });
  }
}

/**
 * 외부 이미지 프록시 (뉴스 이미지 등)
 */
async function handleExternalProxy(request, url, ctx) {
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('URL parameter is required', { status: 400 });
  }

  // URL 검증
  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  // HTTPS만 허용
  if (parsedUrl.protocol !== 'https:') {
    return new Response('Only HTTPS URLs are allowed', { status: 400 });
  }

  // 허용 도메인 검증
  if (!ALLOWED_PROXY_DOMAINS.has(parsedUrl.hostname)) {
    return new Response('Domain not allowed', { status: 403 });
  }

  // 캐시 확인 (원본 URL 기반 캐시키)
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  let response = await cache.match(cacheKey);

  if (response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'HIT');
    return new Response(response.body, { ...response, headers });
  }

  // 외부 이미지 fetch
  try {
    const originResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 4590-CDN/1.0)',
        'Accept': 'image/*',
      },
    });

    if (!originResponse.ok) {
      return new Response('Failed to fetch image', { status: originResponse.status });
    }

    // Content-Type 확인
    const contentType = originResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new Response('URL is not an image', { status: 400 });
    }

    response = new Response(originResponse.body, originResponse);
    // 뉴스 이미지: 24시간 CDN 캐시, 브라우저 1시간
    response.headers.set('Cache-Control', 'public, s-maxage=86400, max-age=3600');
    response.headers.set('CDN-Cache-Control', 'max-age=86400');
    response.headers.set('X-Cache', 'MISS');
    response.headers.delete('Set-Cookie');

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return new Response('Origin Error', { status: 502 });
  }
}
