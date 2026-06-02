# 도메인 변경 계획

이 문서는 공개 사이트 도메인을 `4590football.com`에서 `4590fb.com`으로 바꾸기 위한 실행 계획과 실제 처리 내역입니다.

전제:

- URL 경로는 그대로 유지합니다.
- 예: `https://4590football.com/boards/free/123` -> `https://4590fb.com/boards/free/123`

도메인 변경과 URL 구조 개편을 동시에 하지 않는 것이 좋습니다. 경로가 유지되어야 검색엔진이 기존 페이지와 새 페이지를 1:1로 인식하기 쉽습니다.

## 현재 상태

- 현재 대표 도메인: `4590football.com`
- 새 대표 도메인: `4590fb.com`
- 새 CDN 도메인: `cdn.4590fb.com`
- 기존 CDN 도메인: `cdn.4590football.com`
- 운영 사이트 URL 환경변수: `NEXT_PUBLIC_SITE_URL=https://4590fb.com`
- 사이트맵:
  - `https://4590fb.com/sitemap.xml`
  - `https://4590fb.com/sitemaps/recent-posts.xml`
- RSS:
  - `https://4590fb.com/rss.xml`
- 현재 Cloudflare 네임서버:
  - `rajeev.ns.cloudflare.com`
  - `rosemary.ns.cloudflare.com`

## 2026-06-02 실제 처리 내역

- Cloudflare에 `4590fb.com` Zone 활성화 완료.
- Vercel 프로젝트에 `4590fb.com`, `www.4590fb.com` 도메인 연결 완료.
- Cloudflare DNS:
  - `4590fb.com` A `76.76.21.21`, DNS only
  - `www.4590fb.com` A `76.76.21.21`, DNS only
  - `cdn.4590fb.com` AAAA `100::`, proxied, `storage-cdn` Worker 연결
- 앱 대표 URL 기준 변경:
  - `src/shared/config/site.ts`
  - `src/proxy.ts`
  - `src/shared/services/email.ts`
  - `.env.local`
  - Vercel `NEXT_PUBLIC_SITE_URL`
  - Supabase `seo_settings.site_url`
- 사이트맵/robots/RSS 검증:
  - `https://4590fb.com/robots.txt`의 Sitemap이 `https://4590fb.com/sitemap.xml`을 가리킴
  - `https://4590fb.com/sitemap.xml`에 기존 도메인 URL 없음
  - `https://4590fb.com/rss.xml`에 기존 도메인 URL 없음
- CDN 처리:
  - `storage-cdn` Worker에 `4590fb.com`, `www.4590fb.com` Referer 허용 추가
  - 앱 기본 CDN을 `https://cdn.4590fb.com`으로 변경
  - Vercel 환경변수에 옛 CDN이 남아 있어도 앱에서는 새 CDN으로 정규화
  - Next 이미지 허용 목록에 `cdn.4590fb.com` 추가
  - 기존 DB/캐시 절대 URL 호환을 위해 `cdn.4590football.com` 허용 유지

## 남은 외부 작업

- `4590football.com` -> `4590fb.com` 301/308 리다이렉트 전환.
- Brevo에서 `support@4590fb.com` 발신자 등록 완료. SMTP 발신 주소를 `support@4590fb.com`으로 전환.
- AdSense 계정에서 `4590fb.com` 사이트 추가/검토 요청.
- Google Search Console에서 새 속성 추가, 사이트맵 제출, 주소 변경 도구 실행.
- Naver Search Advisor에서 `4590fb.com` 사이트 추가, 소유 확인, 사이트맵/robots 재수집.
- Bing Webmaster Tools에서 `4590fb.com` 추가, 사이트맵 제출. Bing 연동으로 Yahoo/DuckDuckGo 일부 반영 기대.
- Daum 웹마스터/검색등록에서 `4590fb.com` 추가 확인. robots의 기존 Daum PIN은 기존 값이므로 새 도메인에서 별도 확인 필요.
- Google Analytics GA4에서 데이터 스트림 URL을 `4590fb.com`으로 수정하고, 추천 제외/측정 도메인을 확인.
- Pinterest `p:domain_verify` 등 외부 도메인 인증 태그가 필요한 서비스에서 새 도메인 재검증.

## 추천 진행 순서

1. `NEW_DOMAIN`을 구매하고 DNS를 준비합니다.
2. Vercel 프로젝트에 `NEW_DOMAIN`, `www.NEW_DOMAIN`을 추가합니다.
3. 새 도메인의 DNS 레코드를 Vercel 안내에 맞게 연결합니다.
4. 앱을 `NEXT_PUBLIC_SITE_URL=https://NEW_DOMAIN` 기준으로 배포합니다.
5. Supabase, Kakao, Naver 등 인증 콜백 URL을 새 도메인으로 추가합니다.
6. 새 도메인에서 페이지, 사이트맵, robots.txt, RSS, 로그인, 이미지가 정상인지 확인합니다.
7. 기존 도메인 `4590football.com`에서 새 도메인으로 301 리다이렉트를 겁니다.
8. Google, Naver, Bing, Daum에 도메인 변경 및 새 사이트맵을 제출합니다.
9. 기존 도메인은 최소 12개월 유지합니다.

## DNS와 호스팅

### 메인 사이트

Vercel Domains에 아래 도메인을 추가합니다.

- `NEW_DOMAIN`
- `www.NEW_DOMAIN`

DNS는 Vercel 화면에 표시되는 값대로 설정합니다.

일반적인 구성:

- 루트 도메인 `NEW_DOMAIN`: Vercel이 안내하는 `A` 레코드 또는 DNS 제공자의 CNAME flattening
- `www.NEW_DOMAIN`: Vercel이 안내하는 `CNAME`

대표 도메인은 하나만 정합니다. 추천:

- 대표 도메인: `NEW_DOMAIN`
- 리다이렉트: `www.NEW_DOMAIN` -> `NEW_DOMAIN`

### CDN

스토리지 CDN 도메인은 두 가지 선택지가 있습니다.

낮은 리스크:

- `cdn.4590football.com`을 당분간 그대로 둡니다.
- 메인 도메인 이전이 안정된 뒤 `cdn.NEW_DOMAIN`으로 별도 이전합니다.

깔끔한 최종 상태:

- `cdn.NEW_DOMAIN`을 새로 만듭니다.
- `storage-cdn` Cloudflare Worker route를 새 도메인으로 배포합니다.
- `NEXT_PUBLIC_STORAGE_CDN_URL=https://cdn.NEW_DOMAIN`으로 변경합니다.

CDN까지 바꾸는 경우 DB에 저장된 이미지 URL과 캐시를 확인해야 합니다. 일부 데이터에 `cdn.4590football.com` 절대 URL이 이미 들어 있을 수 있습니다.

## 코드와 설정 변경 체크리스트

### 환경변수

운영, 프리뷰, 로컬 환경변수를 확인합니다.

- `.env.local`
  - `NEXT_PUBLIC_SITE_URL=https://NEW_DOMAIN`
  - 이메일 주소도 바꿀 경우 `SMTP_SENDER_EMAIL=support@NEW_DOMAIN`
  - CDN도 바꿀 경우 `NEXT_PUBLIC_STORAGE_CDN_URL=https://cdn.NEW_DOMAIN`
- Vercel Environment Variables
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_STORAGE_CDN_URL`
  - 인증, SMTP, Analytics, AdSense 관련 도메인 의존 변수
- Cloudflare Worker vars
  - `SITE_ORIGIN`
  - `ALLOWED_ORIGINS`

### 사이트 URL 기준점

주요 기준 파일:

- `src/shared/config/site.ts`
  - fallback 값 `https://4590football.com`
  - OG 이미지 URL
  - canonical URL 생성 함수

가능하면 도메인 직접 문자열 대신 `siteConfig.url` 또는 `siteUrl()`을 쓰는 방향이 좋습니다.

### 대표 도메인 리다이렉트

- `src/proxy.ts`
  - `CANONICAL_HOST = '4590football.com'`
  - 현재 `.vercel.app` 접속을 기존 도메인으로 보내고 있음

변경 후:

- `CANONICAL_HOST = 'NEW_DOMAIN'`
- Vercel에서 기존 도메인도 같이 받는다면 아래 리다이렉트를 추가합니다.
  - `4590football.com/*` -> `https://NEW_DOMAIN/:path*`
  - `www.4590football.com/*` -> `https://NEW_DOMAIN/:path*`

리다이렉트는 path와 query string을 보존해야 합니다.

### SEO 메타데이터

- `src/app/layout.tsx`
  - `metadataBase`
  - Open Graph URL/이미지
  - Twitter 이미지
  - favicon/manifest 절대 URL
  - Organization/WebSite JSON-LD
  - 고객지원 이메일 `support@4590fb.com`
  - 인증 태그:
    - `naver-site-verification`
    - `google-adsense-account`
    - `p:domain_verify`
    - Google Analytics ID `G-MESEGFZZPF`

Analytics, AdSense는 같은 계정을 계속 쓸지 결정해야 합니다. 검색엔진 소유확인 토큰은 새 도메인에서 다시 발급해야 할 수 있습니다.

### 사이트맵, robots.txt, RSS, AI 파일

- `src/shared/seo/sitemap.ts`
  - `siteConfig.url` 기반이라 환경변수가 맞으면 새 도메인으로 나와야 합니다.
- `src/app/sitemap.xml/route.ts`
  - 결과 XML에 새 도메인 URL만 나오는지 확인합니다.
- `src/app/sitemaps/recent-posts.xml/route.ts`
  - 결과 XML에 새 도메인 URL만 나오는지 확인합니다.
- `src/app/robots.txt/route.ts`
  - `Host:`를 `NEW_DOMAIN`으로 변경해야 합니다.
  - `Sitemap:` URL이 새 도메인을 가리켜야 합니다.
  - `DAUM_WEBMASTER_PIN`은 Daum에서 새 사이트로 보면 새로 발급해야 할 수 있습니다.
- `src/app/rss.xml/route.ts`
  - DB SEO 설정값을 먼저 쓰고, 없으면 `siteConfig.url`을 씁니다.
  - 관리자 SEO 설정의 `site_url`을 `https://NEW_DOMAIN`으로 바꿔야 합니다.
- `src/app/ai.txt/route.ts`
  - `4590football.com`이 직접 박혀 있습니다.
- `src/app/llms.txt/route.ts`
  - `4590football.com`이 직접 박혀 있습니다.
- `public/site.webmanifest`
  - 아이콘 `src`가 기존 도메인 절대 URL입니다.

### IndexNow

- `src/shared/seo/indexnow.ts`
  - `INDEXNOW_HOST = '4590football.com'`
  - key location이 기존 도메인 기준입니다.
- `scripts/submit-indexnow-urls.cjs`
  - 사용 예시와 기본 `INDEXNOW_HOST`가 기존 도메인입니다.
- 새 도메인에서 key 파일이 열려야 합니다.
  - `https://NEW_DOMAIN/c1df662b78d0423d9ef5095856359889.txt`

IndexNow는 제출하는 URL의 host와 인증 key 파일의 host가 맞아야 합니다.

### 인증과 OAuth

`NEXT_PUBLIC_SITE_URL`을 쓰는 내부 코드:

- `src/app/(auth)/signin/page.client.tsx`
- `src/app/(auth)/signup/page.client.tsx`
- `src/domains/auth/actions/naver.ts`
- `src/domains/auth/actions/password.ts`
- `src/domains/auth/components/KakaoLoginButton.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/auth/naver/callback/route.ts`
- `src/app/auth/naver/complete/route.ts`
- `src/app/auth/confirm/route.ts`
- `src/shared/services/email.ts`

외부 대시보드에서 바꿔야 할 것:

- Supabase Auth
  - Site URL: `https://NEW_DOMAIN`
  - Redirect URLs:
    - `https://NEW_DOMAIN/auth/callback`
    - `https://NEW_DOMAIN/auth/reset-password`
    - `https://NEW_DOMAIN/auth/naver/callback`
    - 이전 중에는 기존 도메인 콜백도 잠시 유지하는 것이 안전합니다.
- Kakao Developers
  - Redirect URI: `https://NEW_DOMAIN/auth/callback`
  - 사이트 도메인/허용 도메인 설정이 있으면 새 도메인 추가
- Naver Developers
  - Callback URL: `https://NEW_DOMAIN/auth/naver/callback`
- 이메일 제공자
  - `support@4590fb.com` 수신은 Cloudflare Email Routing으로 설정 완료
  - Brevo SMTP 발신 주소는 `support@4590fb.com`으로 전환

### Cloudflare Workers

- `workers/match-proxy/wrangler.toml`
  - `ALLOWED_ORIGINS`
- `workers/match-proxy/src/index.ts`
  - origin allowlist와 CORS 동작 확인
- `workers/sync-highlights/wrangler.toml`
  - `SITE_ORIGIN`
- `workers/sync-highlights/worker.js`
  - fallback `https://4590football.com`
- `workers/storage-cdn/worker.js`
  - 주석
  - `ALLOWED_ORIGINS`
- `workers/storage-cdn/wrangler.toml`
  - route 주석이 `cdn.4590football.com/*`

변경 후 Worker도 다시 배포해야 합니다.

### 이미지와 정적 자산

- `next.config.js`
  - remote pattern에 `cdn.4590football.com`이 있습니다.
  - CDN을 바꾸면 `cdn.NEW_DOMAIN`도 추가해야 합니다.
- `src/shared/images/urls.ts`
  - `DEFAULT_STORAGE_CDN_BASE_URL`
- `src/app/api/og/football/route.ts`
  - OG 이미지 안에 `4590football.com` 텍스트가 들어갑니다.
- `src/domains/livescore/components/football/match/tabs/lineups/Formation.tsx`
  - 캔버스 워터마크에 `4590football.com`이 들어갑니다.

### 직접 박힌 콘텐츠 URL

운영 코드 중 직접 URL이 있는 파일:

- `src/app/(site)/about/page.tsx`
- `src/app/(site)/contact/page.tsx`
- `src/app/(site)/privacy/page.tsx`
- `src/app/(site)/terms/page.tsx`
- `src/app/(site)/transfers/team/[id]/[slug]/page.tsx`
- `src/domains/boards/utils/post/extractInternalEntityLinksFromContent.ts`
- `src/domains/boards/utils/post/extractRelatedCtasFromContent.ts`

`docs/seo-recovery`, `docs/deploy-url-batches-5days.md` 같은 과거 기록용 문서는 운영에 쓰는 문서가 아니라면 굳이 바꾸지 않아도 됩니다.

### 관리자 / DB 설정

배포 후 관리자 SEO 설정을 확인합니다.

- `site_url`
- `site_name`
- 기본 OG 이미지
- 기본 canonical 동작

주의: `src/app/rss.xml/route.ts`와 게시글 상세 메타데이터는 DB SEO 설정을 우선 사용할 수 있습니다. 코드에서 도메인을 바꿔도 DB의 `site_url`이 예전 값이면 RSS/canonical이 계속 기존 도메인으로 나올 수 있습니다.

## 리다이렉트 계획

필수 리다이렉트:

- `https://4590football.com/:path*` -> `https://NEW_DOMAIN/:path*`
- `https://www.4590football.com/:path*` -> `https://NEW_DOMAIN/:path*`
- HTTP 접속도 최종적으로 HTTPS 새 도메인으로 가야 합니다.

규칙:

- HTTP 301을 사용합니다.
- path와 query string을 보존합니다.
- 리다이렉트 체인을 만들지 않습니다.
  - 나쁜 예: old -> www old -> new
  - 좋은 예: 모든 기존 도메인 변형 -> 최종 새 도메인
- 이전 중에는 기존 도메인을 robots.txt로 막지 않습니다. 검색로봇이 기존 URL에 접근해서 301을 확인해야 합니다.

유지 기간:

- Google 기준 최소 180일
- 실무적으로는 최소 12개월 권장
- 기존 도메인도 1년 이상 계속 소유하는 것이 안전합니다.

## 검색엔진 작업

### Google Search Console

공식 문서: https://support.google.com/webmasters/answer/9370220

Google은 도메인 또는 서브도메인을 옮길 때 Change of Address 도구 사용을 안내합니다. 단, 사이트 이동과 301 리다이렉트 설정이 끝난 뒤 사용해야 합니다.

체크리스트:

- `NEW_DOMAIN`을 Domain Property로 추가하고 소유확인합니다.
- 기존 `4590football.com` 속성의 소유권도 유지합니다.
- 기존 도메인에서 새 도메인으로 301 리다이렉트가 걸렸는지 확인합니다.
- 새 페이지의 canonical이 `https://NEW_DOMAIN/...`을 가리키는지 확인합니다.
- 새 사이트맵 제출:
  - `https://NEW_DOMAIN/sitemap.xml`
  - 필요 시 `https://NEW_DOMAIN/sitemaps/recent-posts.xml`
- 기존 도메인 속성에서 Change of Address 도구를 실행합니다.
- 모니터링:
  - Pages 색인 상태
  - Crawl stats
  - Sitemap fetch 상태
  - Google이 선택한 canonical
  - 404/redirect 오류

Google은 이전 알림이 180일 동안 표시된다고 안내합니다. 또한 301 리다이렉트는 최소 180일 유지하고, 기존 도메인은 최소 1년 유지하는 것을 권장합니다.

### Naver Search Advisor

공식 문서: https://searchadvisor.naver.com/guide/seo-basic-migration

Naver는 기존 URL과 신규 URL을 1:1 HTTP redirect로 연결하고, 신규 사이트의 모든 페이지에 canonical URL을 지정하고, 신규 사이트를 웹마스터도구에 등록해 사이트맵을 제출하라고 안내합니다.

체크리스트:

- `https://NEW_DOMAIN`을 추가하고 소유확인합니다.
- 제출:
  - `https://NEW_DOMAIN/sitemap.xml`
  - `https://NEW_DOMAIN/rss.xml`
- 이전 중에는 기존 도메인과 새 도메인 모두에서 Naver Yeti가 robots.txt에 막히지 않도록 합니다.
- 주요 새 URL은 수집 요청합니다.
- 수집 현황과 색인 현황을 모니터링합니다.
- Naver가 이전을 인식하기 전에 기존 도메인을 닫거나 robots.txt로 막지 않습니다.

### Bing Webmaster Tools

공식 문서:

- Sitemaps: https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed
- URL Submission / IndexNow: https://www.bing.com/webmasters/help/URL-Submission-62f2860b

체크리스트:

- `NEW_DOMAIN`을 추가하고 소유확인합니다.
- `https://NEW_DOMAIN/sitemap.xml`을 제출합니다.
- 주요 페이지는 URL Inspection으로 확인합니다.
- 빠른 발견을 위해 IndexNow를 사용합니다.
- 모니터링:
  - Sitemaps
  - IndexNow activity
  - URL Inspection
  - Site Explorer의 redirect/crawl 이슈

Bing은 변경된 URL을 빠르게 알리는 방법으로 IndexNow 사용을 권장합니다.

### IndexNow

공식 문서: https://www.indexnow.org/documentation

체크리스트:

- `INDEXNOW_HOST=NEW_DOMAIN`으로 설정합니다.
- 새 도메인에서 key 파일이 열리는지 확인합니다.
  - `https://NEW_DOMAIN/c1df662b78d0423d9ef5095856359889.txt`
- 새 도메인 URL만 제출합니다.
- 런칭 후 사이트맵 기반으로 URL을 제출합니다.
  - `npm run indexnow:submit -- --sitemap https://NEW_DOMAIN/sitemap.xml --dry-run`
  - `INDEXNOW_HOST=NEW_DOMAIN npm run indexnow:submit -- --sitemap https://NEW_DOMAIN/sitemap.xml`

IndexNow는 제출 URL이 선언한 host에 속하지 않거나 key가 맞지 않으면 `422`를 반환할 수 있습니다.

### Daum

현재 코드에는 `src/app/robots.txt/route.ts`에 Daum Webmaster pin이 있습니다.

체크리스트:

- Daum 검색등록 또는 웹마스터 도구에서 `NEW_DOMAIN`을 등록/확인합니다.
- Daum이 새 인증 pin을 발급하면 교체합니다.
- 도구에서 지원하면 sitemap/RSS를 제출합니다.
- Daum/Kakao 검색 결과에서 기존 URL 노출이 줄어들 때까지 기존 도메인 리다이렉트를 유지합니다.

Daum 검색등록 조회: https://register.search.daum.net/searchForm.daum?act=search

### 그 외 수정할 곳

- Google Analytics property/data stream 기본 URL
- Google AdSense의 새 사이트 승인
- Pinterest 도메인 인증이 필요하면 `p:domain_verify`
- 소셜 프로필:
  - Instagram
  - YouTube
  - 커뮤니티 링크
- 직접 관리하는 외부 백링크
- 이메일 서명
- 고객지원/문의 페이지

## 런칭 전 검증

기존 도메인 301 리다이렉트를 켜기 전에 확인합니다.

- `https://NEW_DOMAIN/`이 200을 반환합니다.
- `https://www.NEW_DOMAIN/`이 대표 도메인으로 리다이렉트됩니다.
- `https://NEW_DOMAIN/robots.txt`가 200이고 새 sitemap을 가리킵니다.
- `https://NEW_DOMAIN/sitemap.xml`이 200이고 `https://NEW_DOMAIN/...` URL만 포함합니다.
- `https://NEW_DOMAIN/sitemaps/recent-posts.xml`이 200이고 새 도메인 URL만 포함합니다.
- `https://NEW_DOMAIN/rss.xml`이 200이고 새 도메인 링크만 포함합니다.
- 페이지 소스의 canonical이 새 도메인입니다.
- JSON-LD의 `url`, `@id`, `logo`, `SearchAction`이 새 도메인입니다.
- Open Graph 이미지 URL이 새 도메인입니다.
- 로그인 동작 확인:
  - 이메일 로그인
  - 비밀번호 재설정
  - Kakao
  - Naver
  - Supabase callback
- 이미지 로딩 확인:
  - 로컬 asset
  - Supabase 이미지
  - CDN 이미지
  - OG 이미지 endpoint
- IndexNow key 파일이 200 text/plain으로 열립니다.

검증 명령:

```bash
NEXT_PUBLIC_SITE_URL=https://NEW_DOMAIN npm run build
SITE_URL=https://NEW_DOMAIN npm run verify:sitemaps
```

운영 도메인에서 직접 확인:

```bash
curl -I https://NEW_DOMAIN/robots.txt
curl -I https://NEW_DOMAIN/sitemap.xml
curl -I https://NEW_DOMAIN/rss.xml
```

## 런칭 후 검증

배포와 리다이렉트 후 확인합니다.

- `https://4590football.com/`이 `https://NEW_DOMAIN/`으로 301 됩니다.
- `https://4590football.com/boards/all`이 `https://NEW_DOMAIN/boards/all`로 301 됩니다.
- `https://www.4590football.com/boards/all`이 `https://NEW_DOMAIN/boards/all`로 301 됩니다.
- 리다이렉트 체인이 없습니다.
- canonical이 `4590football.com`으로 남아 있지 않습니다.
- Google Search Console에서 sitemap fetch가 성공합니다.
- Naver sitemap/RSS 제출이 성공합니다.
- Bing sitemap 제출이 성공합니다.
- IndexNow 제출이 200 또는 202를 반환합니다.

기존 도메인 문자열 검색:

```bash
rg -n "4590football\\.com|cdn\\.4590football\\.com|www\\.4590football" src scripts workers public next.config.js wrangler.jsonc vercel.json .env.local
```

마이그레이션 리다이렉트 규칙과 과거 기록용 문서에는 기존 도메인이 의도적으로 남을 수 있습니다.

## 롤백 계획

새 도메인 런칭에 문제가 생기면:

1. 기존 도메인 301 리다이렉트를 끕니다.
2. `NEXT_PUBLIC_SITE_URL=https://4590football.com`으로 되돌립니다.
3. 제거했던 기존 OAuth callback URL을 복구합니다.
4. 앱과 Worker를 다시 배포합니다.
5. Google Change of Address를 이미 제출했고 롤백이 확정이라면 취소합니다.

짧은 기간에 도메인을 여러 번 왔다 갔다 하지 않는 것이 좋습니다. 검색엔진이 사이트 이전을 불안정하게 볼 수 있습니다.
