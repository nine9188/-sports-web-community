/**
 * Cloudflare Worker — Supabase Storage CDN 프록시
 *
 * 요청: https://cdn.4590football.com/players/md/123.webp
 * → Supabase: https://xxx.supabase.co/storage/v1/object/public/players/md/123.webp
 * → Cloudflare 엣지 캐시에 저장 (1년)
 *
 * 배포: npx wrangler deploy
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
  'benner',
]);

// 허용 확장자
const ALLOWED_EXTENSIONS = new Set(['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg']);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // GET만 허용
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 경로 검증: /{bucket}/{size}/{id}.{ext}
    const pathname = url.pathname;

    // 빈 경로 or 루트
    if (pathname === '/' || pathname === '') {
      return new Response('4590 Storage CDN', { status: 200 });
    }

    // 버킷 추출 및 검증
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 1) {
      return new Response('Not Found', { status: 404 });
    }

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

    // 1. Cloudflare 엣지 캐시 확인
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);

    if (response) {
      // 캐시 HIT — 헤더 추가
      const headers = new Headers(response.headers);
      headers.set('X-Cache', 'HIT');
      return new Response(response.body, { ...response, headers });
    }

    // 2. 캐시 MISS → Supabase에서 가져오기
    const supabaseUrl = `${SUPABASE_STORAGE_ORIGIN}${pathname}`;

    try {
      const originResponse = await fetch(supabaseUrl, {
        headers: {
          'Accept': 'image/*',
        },
      });

      if (!originResponse.ok) {
        return new Response('Not Found', { status: 404 });
      }

      // 3. 응답에 캐시 헤더 설정
      response = new Response(originResponse.body, originResponse);
      response.headers.set('Cache-Control', 'public, s-maxage=31536000, max-age=86400');
      response.headers.set('CDN-Cache-Control', 'max-age=31536000');
      response.headers.set('X-Cache', 'MISS');
      response.headers.delete('Set-Cookie');

      // 4. 엣지 캐시에 저장 (백그라운드)
      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;
    } catch (err) {
      return new Response('Origin Error', { status: 502 });
    }
  },
};
